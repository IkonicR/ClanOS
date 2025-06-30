'use client';

import React from 'react';
import { 
    Users, 
    Trophy, 
    Target, 
    Gift, 
    Crown, 
    Shield,
    TrendingUp,
    Swords,
    Star,
    Activity
} from 'lucide-react';
import { MetricCard, StatsGrid, SectionHeader } from './analytics-cards';
import { PieChartComponent, BarChartComponent } from './chart-components';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface OverviewDashboardProps {
    data: {
        clanInfo: {
            name: string;
            tag: string;
            level: number;
            badgeUrl: string;
            description: string;
            warLeague: string;
            clanPoints: number;
            clanVersusPoints: number;
        };
        overview: {
            totalMembers: number;
            totalTrophies: number;
            avgTrophies: number;
            totalDonations: number;
            totalReceived: number;
            donationRatio: number;
            winRate: number;
            warWinStreak: number;
        };
        warStats: {
            totalWars: number;
            wins: number;
            losses: number;
            ties: number;
        };
        distributions: {
            leagues: { [key: string]: number };
            townHalls: { [key: string]: number };
            roles: { [key: string]: number };
        };
        topPerformers: {
            donators: Array<{
                name: string;
                tag: string;
                donations: number;
                received: number;
            }>;
            trophyEarners: Array<{
                name: string;
                tag: string;
                trophies: number;
                league: string;
            }>;
        };
        currentWar: {
            state: string;
            teamSize: number;
            ourStars: number;
            ourDestruction: number;
            opponentStars: number;
            opponentDestruction: number;
            opponentName: string;
            timeLeft: string;
        } | null;
    };
}

export function OverviewDashboard({ data }: OverviewDashboardProps) {
    const { clanInfo, overview, warStats, distributions, topPerformers, currentWar } = data;

    // Prepare data for charts
    const leagueData = Object.entries(distributions.leagues).map(([name, count]) => ({
        name: name.replace(' League', '').replace(' III', '').replace(' II', '').replace(' I', ''),
        value: count
    })).filter(item => item.value > 0);

    const townHallData = Object.entries(distributions.townHalls)
        .map(([th, count]) => ({ name: th, value: count }))
        .sort((a, b) => parseInt(a.name.replace('TH', '')) - parseInt(b.name.replace('TH', '')));

    const roleData = Object.entries(distributions.roles).map(([role, count]) => ({
        name: role,
        value: count
    }));

    const formatNumber = (num: number) => {
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(1)}M`;
        }
        if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K`;
        }
        return num.toString();
    };

    const formatPercentage = (num: number) => `${num}%`;

    return (
        <div className="space-y-6">
            {/* Clan Header */}
            <Card className="bg-card/75 backdrop-blur-lg border border-white/10">
                <CardHeader>
                    <div className="flex items-center space-x-4">
                        <img 
                            src={clanInfo.badgeUrl} 
                            alt={`${clanInfo.name} badge`}
                            className="w-16 h-16 rounded-lg"
                        />
                        <div className="flex-1">
                            <div className="flex items-center space-x-2">
                                <CardTitle className="text-2xl text-white">
                                    {clanInfo.name}
                                </CardTitle>
                                <Badge variant="secondary">{clanInfo.tag}</Badge>
                                <Badge variant="outline">Level {clanInfo.level}</Badge>
                            </div>
                            <p className="text-muted-foreground mt-1">
                                {clanInfo.description}
                            </p>
                            <div className="flex items-center space-x-4 mt-2">
                                <span className="text-sm text-white/80">
                                    War League: <span className="font-medium text-primary">{clanInfo.warLeague}</span>
                                </span>
                                <span className="text-sm text-white/80">
                                    Clan Points: <span className="font-medium">{formatNumber(clanInfo.clanPoints)}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Key Metrics */}
            <div>
                <SectionHeader title="Key Metrics" description="Overview of your clan's performance" />
                <StatsGrid className="mt-4">
                    <MetricCard
                        title="Total Members"
                        value={overview.totalMembers}
                        icon={<Users className="h-4 w-4 text-primary" />}
                        suffix="/50"
                    />
                    <MetricCard
                        title="Average Trophies"
                        value={formatNumber(overview.avgTrophies)}
                        icon={<Trophy className="h-4 w-4 text-yellow-500" />}
                    />
                    <MetricCard
                        title="War Win Rate"
                        value={overview.winRate}
                        icon={<Target className="h-4 w-4 text-green-500" />}
                        suffix="%"
                    />
                    <MetricCard
                        title="Donation Ratio"
                        value={overview.donationRatio}
                        icon={<Gift className="h-4 w-4 text-blue-500" />}
                    />
                </StatsGrid>
            </div>

            {/* Current War Status */}
            {currentWar && (
                <div>
                    <SectionHeader title="Current War" description="Live war status and progress" />
                    <Card className="bg-card/75 backdrop-blur-lg border border-white/10 mt-4">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Swords className="h-5 w-5 text-red-500" />
                                <span>vs {currentWar.opponentName}</span>
                                <Badge variant="outline">{currentWar.teamSize}v{currentWar.teamSize}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-500">
                                        {currentWar.ourStars} ⭐
                                    </div>
                                    <div className="text-sm text-muted-foreground">Our Stars</div>
                                    <div className="text-lg font-semibold text-white mt-1">
                                        {currentWar.ourDestruction}%
                                    </div>
                                    <div className="text-xs text-muted-foreground">Destruction</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-red-500">
                                        {currentWar.opponentStars} ⭐
                                    </div>
                                    <div className="text-sm text-muted-foreground">Enemy Stars</div>
                                    <div className="text-lg font-semibold text-white mt-1">
                                        {currentWar.opponentDestruction}%
                                    </div>
                                    <div className="text-xs text-muted-foreground">Destruction</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* War Statistics */}
            <div>
                <SectionHeader title="War Performance" description="Recent war statistics and trends" />
                <StatsGrid className="mt-4">
                    <MetricCard
                        title="Total Wars"
                        value={warStats.totalWars}
                        icon={<Shield className="h-4 w-4 text-blue-500" />}
                    />
                    <MetricCard
                        title="Wins"
                        value={warStats.wins}
                        icon={<Crown className="h-4 w-4 text-green-500" />}
                    />
                    <MetricCard
                        title="Win Streak"
                        value={overview.warWinStreak}
                        icon={<Star className="h-4 w-4 text-yellow-500" />}
                    />
                    <MetricCard
                        title="Activity Score"
                        value={Math.round(overview.donationRatio * overview.winRate)}
                        icon={<Activity className="h-4 w-4 text-purple-500" />}
                    />
                </StatsGrid>
            </div>

            {/* Distribution Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <PieChartComponent
                    title="League Distribution"
                    data={leagueData}
                    nameKey="name"
                    valueKey="value"
                    height={250}
                />
                <BarChartComponent
                    title="Town Hall Levels"
                    data={townHallData}
                    xKey="name"
                    yKey="value"
                    height={250}
                />
                <PieChartComponent
                    title="Role Distribution"
                    data={roleData}
                    nameKey="name"
                    valueKey="value"
                    height={250}
                />
            </div>

            {/* Top Performers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-card/75 backdrop-blur-lg border border-white/10">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Gift className="h-5 w-5 text-primary" />
                            <span>Top Donators</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {topPerformers.donators.slice(0, 5).map((member, index) => (
                                <div key={member.tag} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                            {index + 1}
                                        </div>
                                        <span className="font-medium text-white">{member.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-primary">{formatNumber(member.donations)}</div>
                                        <div className="text-xs text-muted-foreground">donated</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card/75 backdrop-blur-lg border border-white/10">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            <span>Top Trophy Earners</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {topPerformers.trophyEarners.slice(0, 5).map((member, index) => (
                                <div key={member.tag} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center text-xs font-bold text-yellow-500">
                                            {index + 1}
                                        </div>
                                        <span className="font-medium text-white">{member.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-yellow-500">{formatNumber(member.trophies)}</div>
                                        <div className="text-xs text-muted-foreground">{member.league}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 