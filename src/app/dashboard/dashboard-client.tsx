'use client';

import React from 'react';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import DonationLeaderboard from '@/components/donation-leaderboard';
import { CurrentWarStatus } from '@/components/current-war-status';
import MobileWarStatus from '@/components/mobile-war-status';
import { ClanOverviewCard } from '@/components/clan-overview-card';
import { Clan, War, Member as ClanMember } from '@/lib/types';
import {
  Users,
  Trophy,
  Sword,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Crown,
  Zap,
  MessageSquare
} from 'lucide-react';

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

    // Calculate key metrics
    const activeWar = warData?.state === 'inWar' || warData?.state === 'preparation';
    const warStatus = activeWar ?
        (warData?.state === 'inWar' ? 'In War' : 'Preparation') : 'Not in War';
    const warStatusColor = activeWar ? 'destructive' : 'secondary';

    const capitalRaidActive = false; // TODO: Add capital raid detection
    const lowActivityMembers = clanInfo.memberList.filter(m => m.donations < 50).length;

    return (
        <div className="space-y-6">
            {/* Status Overview Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">War Status</CardTitle>
                        <Sword className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <Badge variant={warStatusColor as any} className="text-xs">
                                {warStatus}
                            </Badge>
                            {activeWar && (
                                <Button size="sm" variant="outline">
                                    View War
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Capital Raid</CardTitle>
                        <Crown className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <Badge variant={capitalRaidActive ? 'default' : 'secondary'} className="text-xs">
                                {capitalRaidActive ? 'Active' : 'Inactive'}
                            </Badge>
                            <Button size="sm" variant="outline" disabled={!capitalRaidActive}>
                                View Raid
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Low Activity</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold">{lowActivityMembers}</span>
                            <span className="text-xs text-muted-foreground">members</span>
                        </div>
                        <Progress value={(clanInfo.members - lowActivityMembers) / clanInfo.members * 100} className="mt-2" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Donation Ratio</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold">{donationRatio.toFixed(2)}</span>
                            <span className="text-xs text-muted-foreground">ratio</span>
                        </div>
                        <Progress value={Math.min(donationRatio * 20, 100)} className="mt-2" />
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        Quick Actions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                        <Button variant="outline" className="justify-start">
                            <Users className="mr-2 h-4 w-4" />
                            View Members
                        </Button>
                        <Button variant="outline" className="justify-start">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Post Update
                        </Button>
                        <Button variant="outline" className="justify-start" disabled={!activeWar}>
                            <Sword className="mr-2 h-4 w-4" />
                            War Log
                        </Button>
                        <Button variant="outline" className="justify-start">
                            <Trophy className="mr-2 h-4 w-4" />
                            Achievements
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-7">
                <div className="lg:col-span-4 space-y-6">
                    {/* War Status */}
                    {activeWar && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Sword className="h-5 w-5" />
                                    Current War Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isDesktop ? (
                                    <CurrentWarStatus clan={clanInfo} currentWar={warData} userPlayerTag={playerTag} />
                                ) : (
                                    <MobileWarStatus warData={warData} userPlayerTag={playerTag} />
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Recent Activity */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    <div className="flex-1">
                                        <p className="text-sm">War completed successfully</p>
                                        <p className="text-xs text-muted-foreground">2 hours ago</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Users className="h-4 w-4 text-blue-500" />
                                    <div className="flex-1">
                                        <p className="text-sm">New member joined</p>
                                        <p className="text-xs text-muted-foreground">5 hours ago</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Trophy className="h-4 w-4 text-yellow-500" />
                                    <div className="flex-1">
                                        <p className="text-sm">Clan reached 2000 points</p>
                                        <p className="text-xs text-muted-foreground">1 day ago</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Donation Leaderboard</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <DonationLeaderboard members={clanInfo.memberList} playerTag={playerTag} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
} 