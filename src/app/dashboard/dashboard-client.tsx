'use client';

import React from 'react';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import DonationLeaderboard from '@/components/donation-leaderboard';
import { CompactClanHeader } from '@/components/compact-clan-header';
import { CurrentWarStatus } from '@/components/current-war-status';
import MobileWarStatus from '@/components/mobile-war-status';
import { ClanOverviewCard } from '@/components/clan-overview-card';
import { Clan, War, Member as ClanMember } from '@/lib/types';

interface DashboardClientProps {
  data: {
    clanInfo: Clan & { memberList: ClanMember[], warLeague: { name: string }, warWinStreak: number, members: number, warFrequency: string, clanPoints: number, clanVersusPoints: number, requiredTrophies: number, requiredTownhallLevel: number };
    warData: War;
    playerTag: string;
  }
}

export function DashboardClient({ data }: DashboardClientProps) {
    const isDesktop = useMediaQuery('(min-width: 768px)');
    const { clanInfo, warData, playerTag } = data;

    const totalDonations = clanInfo.memberList.reduce((acc: number, member: ClanMember) => acc + member.donations, 0);
    const totalDonationsReceived = clanInfo.memberList.reduce((acc: number, member: ClanMember) => acc + member.donationsReceived, 0);
    const donationRatio = totalDonationsReceived > 0 ? (totalDonations / totalDonationsReceived) : 0;

    const pulseStats = {
        name: clanInfo.name,
        level: clanInfo.clanLevel,
        badgeUrl: clanInfo.badgeUrls.medium,
        warLeague: clanInfo.warLeague.name,
        warWinStreak: clanInfo.warWinStreak,
        members: clanInfo.members,
        donationRatio: donationRatio,
    };

    const clanStats = {
        warFrequency: clanInfo.warFrequency,
        clanPoints: clanInfo.clanPoints,
        clanVersusPoints: clanInfo.clanVersusPoints,
        requiredTrophies: clanInfo.requiredTrophies,
        requiredTownhallLevel: clanInfo.requiredTownhallLevel,
    };

    return (
        <div className="container mx-auto p-2 sm:p-6 lg:p-8">
            <div className="flex items-center justify-between space-y-2 mb-4">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            </div>

            {isDesktop ? (
                <div className="mb-6">
                  <ClanOverviewCard clanInfo={clanInfo} />
                </div>
            ) : (
                <CompactClanHeader pulseStats={pulseStats} clanStats={clanStats} />
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <div className="lg:col-span-4">
                    {isDesktop ? (
                        <CurrentWarStatus clan={clanInfo} currentWar={warData} userPlayerTag={playerTag} />
                    ) : (
                        <MobileWarStatus warData={warData} userPlayerTag={playerTag} />
                    )}
                </div>
                <div className="lg:col-span-3">
                    <DonationLeaderboard members={clanInfo.memberList} playerTag={playerTag} />
                </div>
            </div>
        </div>
    );
}; 