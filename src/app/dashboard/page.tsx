import React from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { InstantPulse } from '@/components/instant-pulse';
import CurrentWarStatus from '@/components/current-war-status';
import DonationLeaderboard, { Member as ClanMember } from '@/components/donation-leaderboard';
import { 
    Users, 
    Star, 
    Shield, 
    Trophy, 
    ArrowUp, 
    ArrowDown, 
    MapPin,
    BarChart,
    Swords,
    ArrowUpCircle
} from 'lucide-react';
import { User } from '@supabase/supabase-js';

type ClanInfo = {
  name: string;
  clanLevel: number;
  badgeUrls: { medium: string };
  warLeague: { name: string };
  warWinStreak: number;
  members: number;
  memberList: ClanMember[];
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

async function getClanDataForDashboard(user: User): Promise<{ error: string | null, data: Partial<ClanData> | null }> {
    const playerTag = user.user_metadata?.playerTag;
    if (!playerTag) {
        return { error: 'Player tag not found', data: null };
    }

    const cocApiToken = process.env.CLASH_OF_CLANS_API_TOKEN;
    if (!cocApiToken) {
        throw new Error('Clash of Clans API token is not configured on the server.');
    }

    const encodedPlayerTag = encodeURIComponent(playerTag);
    const playerRes = await fetch(`https://cocproxy.royaleapi.dev/v1/players/${encodedPlayerTag}`, {
        headers: { 'Authorization': `Bearer ${cocApiToken}` },
        next: { revalidate: 300 }
    });

    if (!playerRes.ok) throw new Error(`Failed to fetch player data for tag: ${playerTag}`);
    
    const playerInfo: PlayerInfo = await playerRes.json();

    if (!playerInfo.clan) {
        return { error: 'Not in a clan', data: { playerInfo } };
    }
    
    const encodedClanTag = encodeURIComponent(playerInfo.clan.tag);
    const clanRes = await fetch(`https://cocproxy.royaleapi.dev/v1/clans/${encodedClanTag}`, {
        headers: { 'Authorization': `Bearer ${cocApiToken}` },
        next: { revalidate: 60 }
    });

    if (!clanRes.ok) throw new Error(`Failed to fetch clan data for tag: ${playerInfo.clan.tag}`);
    
    const clanInfo: ClanInfo = await clanRes.json();

    return { error: null, data: { playerTag, playerInfo, clanInfo } };
}

export default async function DashboardPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect('/login');
    }

    try {
        const { error, data } = await getClanDataForDashboard(user);
        
        if (error === 'Player tag not found') {
            return (
                <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                    <Card className="text-center bg-card/75 backdrop-blur-lg border-border/50">
                        <CardHeader>
                            <CardTitle>Player Tag Not Found</CardTitle>
                            <CardDescription>
                                We couldn&apos;t find a Clash of Clans Player Tag in your profile. 
                                Please sign up again to link your account.
                            </CardDescription>
                        </CardHeader>
                        <CardContent><a href="/signup" className="text-primary hover:underline">Return to Sign Up</a></CardContent>
                    </Card>
                </div>
            )
        }
        
        if (error === 'Not in a clan' && data?.playerInfo) {
            return (
                <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                     <Card className="text-center bg-card/75 backdrop-blur-lg border-border/50">
                        <CardHeader>
                            <CardTitle>Welcome, {data.playerInfo.name}!</CardTitle>
                            <CardDescription>
                                You are not currently part of a clan. Join a clan to see more details.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            )
        }

        if (error || !data || !data.playerTag || !data.clanInfo) {
             throw new Error(error || 'Failed to fetch required data.');
        }

        const { playerTag, clanInfo } = data;
        const totalDonations = clanInfo.memberList.reduce((acc: number, member: ClanMember) => acc + member.donations, 0);
        const totalDonationsReceived = clanInfo.memberList.reduce((acc: number, member: ClanMember) => acc + member.donationsReceived, 0);
        const donationRatio = totalDonationsReceived > 0 ? (totalDonations / totalDonationsReceived) : 0;

        const initialPulseStats = {
            name: clanInfo.name,
            level: clanInfo.clanLevel,
            badgeUrl: clanInfo.badgeUrls.medium,
            warLeague: clanInfo.warLeague.name,
            warWinStreak: clanInfo.warWinStreak,
            members: clanInfo.members,
            donationRatio: donationRatio,
        };

        return (
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="flex items-center justify-between space-y-2 mb-4">
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                </div>

                <InstantPulse initialStats={initialPulseStats} />

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mt-6">
                    <div className="lg:col-span-4">
                        <CurrentWarStatus />
                    </div>
                    <div className="lg:col-span-3">
                        <DonationLeaderboard members={clanInfo.memberList} playerTag={playerTag} />
                    </div>
                </div>
            </div>
        );

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return (
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <Card className="bg-card/75 backdrop-blur-lg border-border/50">
                    <CardHeader>
                        <CardTitle className="text-destructive">An Error Occurred</CardTitle>
                        <CardDescription>{errorMessage}</CardDescription>
                    </CardHeader>
                    <CardContent><p>Please try refreshing the page.</p></CardContent>
                </Card>
            </div>
        )
    }
} 