import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

async function getPlayerInfo(playerTag: string) {
    const cocApiToken = process.env.CLASH_OF_CLANS_API_TOKEN;
    if (!cocApiToken) {
        return NextResponse.json({ error: 'Clash of Clans API token is not configured on the server.' }, { status: 500 });
    }
    const encodedPlayerTag = encodeURIComponent(playerTag);
    const res = await fetch(`https://cocproxy.royaleapi.dev/v1/players/${encodedPlayerTag}`, {
        headers: {
            'Authorization': `Bearer ${cocApiToken}`,
        },
    });

    if (!res.ok) {
        console.error('Failed to fetch player data:', await res.text());
        return NextResponse.json({ error: `Failed to fetch player data for tag: ${playerTag}`}, { status: res.status });
    }
    return res.json();
}

async function getClanInfo(clanTag: string) {
    const cocApiToken = process.env.CLASH_OF_CLANS_API_TOKEN;
    if (!cocApiToken) {
        throw new Error('COC API token not configured');
    }
    const encodedClanTag = encodeURIComponent(clanTag);
    const res = await fetch(`https://cocproxy.royaleapi.dev/v1/clans/${encodedClanTag}`, {
        headers: {
            'Authorization': `Bearer ${cocApiToken}`,
        },
    });
     if (!res.ok) {
        console.error('Failed to fetch clan data:', await res.text());
        return NextResponse.json({ error: `Failed to fetch clan data for tag: ${clanTag}`}, { status: res.status });
    }
    return res.json();
}

export async function GET() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's clan_tag (prioritizing active linked profile)
    const { data: userProfile } = await supabase
        .from('profiles')
        .select('clan_tag')
        .eq('id', user.id)
        .single();

    // Check for active linked profile
    const { data: activeLinkedProfile } = await supabase
        .from('linked_profiles')
        .select('clan_tag')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

    // Use active linked profile's clan_tag if available
    const clanTag = activeLinkedProfile?.clan_tag || userProfile?.clan_tag;
    
    if (!clanTag) {
        return NextResponse.json({ error: 'User is not in a clan' }, { status: 404 });
    }

    try {
        const clanInfo = await getClanInfo(clanTag);
        const totalDonations = clanInfo.memberList.reduce((acc: number, member: any) => acc + member.donations, 0);
        const totalDonationsReceived = clanInfo.memberList.reduce((acc: number, member: any) => acc + member.donationsReceived, 0);
        const donationRatio = totalDonationsReceived > 0 ? (totalDonations / totalDonationsReceived) : 0;
        
        const stats = {
            name: clanInfo.name,
            level: clanInfo.clanLevel,
            badgeUrl: clanInfo.badgeUrls.medium,
            warLeague: clanInfo.warLeague.name,
            warWinStreak: clanInfo.warWinStreak,
            members: clanInfo.members,
            donationRatio: donationRatio,
        };

        return NextResponse.json(stats);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: message }, { status: 500 });
    }
} 