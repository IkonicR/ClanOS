import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User } from '@supabase/supabase-js';
import { DashboardClient } from './dashboard-client';
import { LinkClanCard } from '@/components/link-clan-card';
import { Member as ClanMember } from '@/lib/types';
import { Clan, War } from '@/lib/types';

type ClanInfo = Clan & {
  name: string;
  clanLevel: number;
  badgeUrls: { medium: string };
  warLeague: { name: string };
  warWinStreak: number;
  members: number;
  memberList: ClanMember[];
  warFrequency: string;
  clanPoints: number;
  clanVersusPoints: number;
  requiredTrophies: number;
  requiredTownhallLevel: number;
};

type PlayerInfo = {
    name: string;
    clan?: {
        tag: string;
    }
};

type ClanData = {
    playerTag: string;
    playerInfo: PlayerInfo;
    clanInfo: ClanInfo;
}

type DashboardData = {
    clanInfo: ClanInfo;
    warData: War;
    playerTag: string;
}

async function getClanData(user: User): Promise<{ error: string | null, data: Partial<ClanData> | null }> {
    const supabase = createClient();
    
    // Get user's profile data (prioritizing active linked profile)
    const { data: userProfile } = await supabase
        .from('profiles')
        .select('player_tag, clan_tag')
        .eq('id', user.id)
        .single();

    // Check for active linked profile
    const { data: activeLinkedProfile } = await supabase
        .from('linked_profiles')
        .select('player_tag, clan_tag')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

    // Use active linked profile's data if available
    const playerTag = activeLinkedProfile?.player_tag || userProfile?.player_tag;
    const clanTag = activeLinkedProfile?.clan_tag || userProfile?.clan_tag;
    
    if (!playerTag) {
        return { error: 'Player tag not found', data: null };
    }

    if (!clanTag) {
        return { error: 'Not in a clan', data: { playerTag } };
    }

    const cocApiToken = process.env.CLASH_OF_CLANS_API_TOKEN;
    if (!cocApiToken) {
        throw new Error('Clash of Clans API token is not configured on the server.');
    }

    // Get player info for display name
    const encodedPlayerTag = encodeURIComponent(playerTag);
    const playerRes = await fetch(`https://cocproxy.royaleapi.dev/v1/players/${encodedPlayerTag}`, {
        headers: { 'Authorization': `Bearer ${cocApiToken}` },
        next: { revalidate: 300 }
    });

    if (!playerRes.ok) throw new Error(`Failed to fetch player data for tag: ${playerTag}`);
    
    const playerInfo: PlayerInfo = await playerRes.json();
    
    // Get clan info using the clan_tag from profile/linked profile
    const encodedClanTag = encodeURIComponent(clanTag);
    const clanRes = await fetch(`https://cocproxy.royaleapi.dev/v1/clans/${encodedClanTag}`, {
        headers: { 'Authorization': `Bearer ${cocApiToken}` },
        next: { revalidate: 60 }
    });

    if (!clanRes.ok) throw new Error(`Failed to fetch clan data for tag: ${clanTag}`);
    
    const clanInfo: ClanInfo = await clanRes.json();

    return { error: null, data: { playerTag, playerInfo, clanInfo } };
}

async function getCurrentWar(clanTag: string): Promise<War> {
    const cocApiToken = process.env.CLASH_OF_CLANS_API_TOKEN;
    if (!cocApiToken) {
        throw new Error('COC API token not configured');
    }
    const encodedClanTag = encodeURIComponent(clanTag);
    const res = await fetch(`https://cocproxy.royaleapi.dev/v1/clans/${encodedClanTag}/currentwar`, {
        headers: {
            'Authorization': `Bearer ${cocApiToken}`,
        },
        next: { revalidate: 60 }
    });

     if (!res.ok) {
        if (res.status === 404) {
            return { state: 'notInWar' } as War;
        }
        throw new Error(`Failed to fetch current war data for tag: ${clanTag}`);
    }
    return res.json();
}

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect('/login');
    }
    
    const { error, data } = await getClanData(user);

    if (error || !data?.playerTag || !data.clanInfo || !data.clanInfo.tag) {
        return (
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <Card className="text-center">
                    <CardHeader>
                        <CardTitle>{error === 'Player tag not found' ? 'Player Tag Not Found' : 'Error'}</CardTitle>
                        <CardDescription>
                            {error === 'Player tag not found' 
                                ? "We couldn't find a Clash of Clans Player Tag in your profile. Link your player to continue." 
                                : error === 'Not in a clan' 
                                ? `Welcome, ${data?.playerInfo?.name}! You are not currently part of a clan.`
                                : "Failed to load clan data."}
                        </CardDescription>
                    </CardHeader>
                    {error === 'Player tag not found' && (
                        <CardContent>
                            <div className="max-w-md mx-auto">
                                <LinkClanCard />
                            </div>
                        </CardContent>
                    )}
                </Card>
            </div>
        );
    }

    const warData = await getCurrentWar(data.clanInfo.tag);

    const dashboardData: DashboardData = {
        clanInfo: data.clanInfo,
        warData: warData,
        playerTag: data.playerTag
    };

    return <DashboardClient data={dashboardData} />;
} 