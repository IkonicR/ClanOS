import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Helper function to get player info to find the clan tag
async function getPlayerClanTag(playerTag: string) {
    const cocApiToken = process.env.CLASH_OF_CLANS_API_TOKEN;
    if (!cocApiToken) {
        throw new Error('COC API token not configured');
    }
    const encodedPlayerTag = encodeURIComponent(playerTag);
    const res = await fetch(`https://cocproxy.royaleapi.dev/v1/players/${encodedPlayerTag}`, {
        headers: {
            'Authorization': `Bearer ${cocApiToken}`,
        },
        next: { revalidate: 60 } // Cache player info for 60 seconds
    });

    if (!res.ok) {
        console.error('Failed to fetch player data:', await res.text());
        throw new Error(`Failed to fetch player data for tag: ${playerTag}`);
    }
    const playerInfo = await res.json();
    if (!playerInfo.clan || !playerInfo.clan.tag) {
        return null;
    }
    return playerInfo.clan.tag;
}


async function getCurrentWar(clanTag: string) {
    const cocApiToken = process.env.CLASH_OF_CLANS_API_TOKEN;
    if (!cocApiToken) {
        throw new Error('COC API token not configured');
    }
    const encodedClanTag = encodeURIComponent(clanTag);
    // Note: Caching is set here with revalidate
    const res = await fetch(`https://cocproxy.royaleapi.dev/v1/clans/${encodedClanTag}/currentwar`, {
        headers: {
            'Authorization': `Bearer ${cocApiToken}`,
        },
        next: { revalidate: 60 } // Cache for 60 seconds as requested
    });

     if (!res.ok) {
        // If war info isn't found, it could be that the clan is not in a war.
        // This is a normal state, so we'll return a specific state instead of an error.
        if (res.status === 404) {
            return { state: 'notInWar' };
        }
        console.error('Failed to fetch current war data:', await res.text());
        throw new Error(`Failed to fetch current war data for tag: ${clanTag}`);
    }
    return res.json();
}

export async function GET() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const playerTag = user.user_metadata?.playerTag;
    if (!playerTag) {
        return NextResponse.json({ error: 'Player tag not found for user' }, { status: 404 });
    }

    try {
        const clanTag = await getPlayerClanTag(playerTag);
        
        if (!clanTag) {
             return NextResponse.json({ state: 'notInClan' }, { status: 200 });
        }

        const warData = await getCurrentWar(clanTag);
        
        return NextResponse.json(warData);

    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: message }, { status: 500 });
    }
} 