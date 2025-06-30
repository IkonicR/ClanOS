'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MetricCard, StatsGrid, SectionHeader } from './analytics-cards';
import { AreaChartComponent, BarChartComponent, LineChartComponent } from './chart-components';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, TrendingUp, TrendingDown, Target, Shield, Zap, Award, Users, Clock, Coins, Castle, Gem } from 'lucide-react';

interface CapitalAnalyticsProps {
    data: any;
    isLoading: boolean;
    onRefresh: () => void;
}

export function CapitalAnalytics({ data, isLoading, onRefresh }: CapitalAnalyticsProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('totalCapitalGold');
    const [filterTier, setFilterTier] = useState('all');

    if (isLoading) {
        return <CapitalAnalyticsSkeleton />;
    }

    if (!data) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground">
                        <Castle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                        <p>No capital raid data available</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const filteredMembers = data.memberPerformance?.activeRaiders
        ?.filter((member: any) => 
            member.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            (filterTier === 'all' || 
             (filterTier === 'top' && data.memberPerformance.topRaiders.includes(member)) ||
             (filterTier === 'consistent' && data.memberPerformance.consistentRaiders.includes(member)) ||
             (filterTier === 'casual' && data.memberPerformance.casualRaiders.includes(member)))
        )
        ?.sort((a: any, b: any) => {
            if (sortBy === 'totalCapitalGold') return b.capitalStats.totalCapitalGold - a.capitalStats.totalCapitalGold;
            if (sortBy === 'participationRate') return b.capitalStats.participationRate - a.capitalStats.participationRate;
            if (sortBy === 'averageGoldPerAttack') return b.capitalStats.averageGoldPerAttack - a.capitalStats.averageGoldPerAttack;
            if (sortBy === 'consistency') return b.capitalStats.consistency - a.capitalStats.consistency;
            return 0;
        }) || [];

    return (
        <div className="space-y-6">
            {/* Capital Raid Summary Cards */}
            <StatsGrid>
                <MetricCard
                    title="Total Raids"
                    value={data.summary?.totalRaids || 0}
                    icon={<Castle className="h-4 w-4" />}
                    change={{
                        value: data.memberPerformance?.overview?.averageParticipationRate || 0,
                        type: data.memberPerformance?.overview?.averageParticipationRate > 75 ? 'increase' : data.memberPerformance?.overview?.averageParticipationRate < 50 ? 'decrease' : 'neutral',
                        period: '% avg participation'
                    }}
                />
                <MetricCard
                    title="Capital Gold"
                    value={data.summary?.totalCapitalGold || 0}
                    icon={<Coins className="h-4 w-4" />}
                    suffix=" total"
                />
                <MetricCard
                    title="Raid Medals"
                    value={data.summary?.averageRaidMedals || 0}
                    icon={<Gem className="h-4 w-4" />}
                    suffix=" avg/raid"
                />
                <MetricCard
                    title="Active Raiders"
                    value={data.summary?.activeRaiders || 0}
                    icon={<Users className="h-4 w-4" />}
                    change={{
                        value: data.memberPerformance?.overview?.consistentRaidersCount || 0,
                        type: 'neutral',
                        period: ' consistent'
                    }}
                />
            </StatsGrid>

            {/* Current Week Status */}
            {data.summary?.currentWeekStatus && typeof data.summary.currentWeekStatus === 'object' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5" />
                            Current Raid Week Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CurrentWeekStatus status={data.summary.currentWeekStatus} />
                    </CardContent>
                </Card>
            )}

            <Tabs defaultValue="members" className="space-y-4">
                <TabsList className="grid w-full grid-cols-5 max-w-3xl mx-auto">
                    <TabsTrigger value="members" className="flex items-center justify-center px-2 py-2">
                        <Users className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Members</span>
                    </TabsTrigger>
                    <TabsTrigger value="recent" className="flex items-center justify-center px-2 py-2">
                        <Clock className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Recent</span>
                    </TabsTrigger>
                    <TabsTrigger value="trends" className="flex items-center justify-center px-2 py-2">
                        <TrendingUp className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Trends</span>
                    </TabsTrigger>
                    <TabsTrigger value="efficiency" className="flex items-center justify-center px-2 py-2">
                        <Target className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Efficiency</span>
                    </TabsTrigger>
                    <TabsTrigger value="progression" className="flex items-center justify-center px-2 py-2">
                        <Castle className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Progress</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="members" className="space-y-6">
                    <MemberPerformanceAnalysis 
                        data={data.memberPerformance}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                        filterTier={filterTier}
                        setFilterTier={setFilterTier}
                        filteredMembers={filteredMembers}
                    />
                </TabsContent>

                <TabsContent value="recent" className="space-y-6">
                    <RecentRaidsAnalysis data={data.recentRaids} />
                </TabsContent>

                <TabsContent value="trends" className="space-y-6">
                    <WeeklyTrendsAnalysis data={data.weeklyTrends} />
                </TabsContent>

                <TabsContent value="efficiency" className="space-y-6">
                    <AttackEfficiencyAnalysis data={data.attackEfficiency} />
                </TabsContent>

                <TabsContent value="progression" className="space-y-6">
                    <CapitalProgressionAnalysis data={data.capitalProgression} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function CurrentWeekStatus({ status }: { status: any }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold">{status.state}</div>
                <div className="text-sm text-muted-foreground">Status</div>
            </div>
            <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold">{status.participants}</div>
                <div className="text-sm text-muted-foreground">Participants</div>
            </div>
            <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold">{status.totalAttacks}</div>
                <div className="text-sm text-muted-foreground">Total Attacks</div>
            </div>
            <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold">
                    {status.endTime ? new Date(status.endTime).toLocaleDateString() : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">End Date</div>
            </div>
        </div>
    );
}

function MemberPerformanceAnalysis({ 
    data, 
    searchTerm, 
    setSearchTerm, 
    sortBy, 
    setSortBy, 
    filterTier, 
    setFilterTier, 
    filteredMembers 
}: any) {
    return (
        <div className="space-y-6">
            <SectionHeader 
                title="Member Capital Performance" 
                description="Individual raider statistics and performance metrics"
            />

            <StatsGrid>
                <MetricCard
                    title="Top Raiders"
                    value={data?.topRaiders?.length || 0}
                    icon={<Award className="h-4 w-4" />}
                    suffix=" elite"
                />
                <MetricCard
                    title="Consistent Raiders"
                    value={data?.consistentRaiders?.length || 0}
                    icon={<Shield className="h-4 w-4" />}
                    suffix=" reliable"
                />
                <MetricCard
                    title="Casual Raiders"
                    value={data?.casualRaiders?.length || 0}
                    icon={<Clock className="h-4 w-4" />}
                    suffix=" casual"
                />
                <MetricCard
                    title="Avg Participation"
                    value={data?.overview?.averageParticipationRate || 0}
                    icon={<Target className="h-4 w-4" />}
                    suffix="%"
                />
            </StatsGrid>

            {/* Search and Filter Controls */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search raiders..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-4">
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-full sm:w-48">
                            <SelectValue placeholder="Sort by..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="totalCapitalGold">Capital Gold</SelectItem>
                            <SelectItem value="participationRate">Participation</SelectItem>
                            <SelectItem value="averageGoldPerAttack">Efficiency</SelectItem>
                            <SelectItem value="consistency">Consistency</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filterTier} onValueChange={setFilterTier}>
                        <SelectTrigger className="w-full sm:w-48">
                            <SelectValue placeholder="Filter..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Raiders</SelectItem>
                            <SelectItem value="top">Top Raiders</SelectItem>
                            <SelectItem value="consistent">Consistent</SelectItem>
                            <SelectItem value="casual">Casual</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Member Performance Table */}
            <div className="grid gap-4">
                {filteredMembers.map((member: any, index: number) => (
                    <CapitalMemberCard key={member.tag} member={member} rank={index + 1} />
                ))}
            </div>
        </div>
    );
}

function CapitalMemberCard({ member, rank }: { member: any; rank: number }) {
    const stats = member.capitalStats;
    
    const getParticipationColor = (rate: number) => {
        if (rate >= 80) return 'text-emerald-600 dark:text-emerald-400';
        if (rate >= 60) return 'text-amber-600 dark:text-amber-400';
        return 'text-red-600 dark:text-red-400';
    };

    const getTierBadge = (member: any) => {
        if (stats.participationRate >= 80 && stats.totalRaids >= 4) {
            return <Badge variant="default">Consistent</Badge>;
        }
        if (stats.totalCapitalGold >= 50000) {
            return <Badge variant="secondary">Top Raider</Badge>;
        }
        if (stats.participationRate < 50) {
            return <Badge variant="outline">Casual</Badge>;
        }
        return <Badge variant="outline">Regular</Badge>;
    };

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4 gap-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {rank}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="font-semibold truncate">{member.name}</div>
                            <div className="text-sm text-muted-foreground">{member.role}</div>
                        </div>
                    </div>
                    <div className="flex-shrink-0">
                        {getTierBadge(member)}
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <div className="text-sm text-muted-foreground">Capital Gold</div>
                        <div className="font-bold text-lg">{stats.totalCapitalGold.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{stats.averageGoldPerRaid}/raid</div>
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground">Participation</div>
                        <div className={`font-bold text-lg ${getParticipationColor(stats.participationRate)}`}>
                            {stats.participationRate}%
                        </div>
                        <div className="text-xs text-muted-foreground">{stats.totalRaids} raids</div>
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground">Efficiency</div>
                        <div className="font-bold text-lg">{stats.averageGoldPerAttack}</div>
                        <div className="text-xs text-muted-foreground">gold/attack</div>
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground">Raid Medals</div>
                        <div className="font-bold text-lg">{stats.totalRaidMedals}</div>
                        <div className="text-xs text-muted-foreground">{stats.totalAttacks} attacks</div>
                    </div>
                </div>

                {/* Recent Form */}
                {stats.recentForm && stats.recentForm.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                        <div className="text-sm text-muted-foreground mb-2">Recent Form (Last 8 Raids)</div>
                        <div className="flex gap-1">
                            {stats.recentForm.slice(0, 8).map((raid: any, index: number) => (
                                <div
                                    key={index}
                                    className={`w-4 h-4 rounded-sm ${
                                        raid.attacks >= 6 ? 'bg-emerald-500 dark:bg-emerald-400' : 
                                        raid.attacks >= 4 ? 'bg-amber-500 dark:bg-amber-400' : 
                                        raid.attacks > 0 ? 'bg-orange-500 dark:bg-orange-400' : 'bg-red-500 dark:bg-red-400'
                                    }`}
                                    title={`${raid.attacks} attacks, ${raid.capitalGold} gold`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function RecentRaidsAnalysis({ data }: { data: any[] }) {
    if (!data || data.length === 0) {
        return (
            <div className="text-center text-muted-foreground">
                <Castle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No recent raid data available</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <SectionHeader 
                title="Recent Capital Raids" 
                description="Performance breakdown for the last 8 raid weekends"
            />

            {data.map((raid: any, index: number) => (
                <Card key={index}>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                            <div className="col-span-2 sm:col-span-1">
                                <div className="text-sm text-muted-foreground">Date</div>
                                <div className="font-medium">
                                    {raid.endTime ? new Date(raid.endTime).toLocaleDateString() : 'Unknown'}
                                </div>
                                <div className="text-xs text-muted-foreground capitalize">{raid.state}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Participants</div>
                                <div className="font-bold">{raid.participatingMembers}</div>
                                <div className="text-xs text-muted-foreground">{raid.totalAttacks} attacks</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Capital Gold</div>
                                <div className="font-bold text-emerald-600 dark:text-emerald-400">{raid.totalCapitalGold.toLocaleString()}</div>
                                <div className="text-xs text-muted-foreground">{raid.averageGoldPerMember}/member</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Raid Medals</div>
                                <div className="font-bold text-violet-600 dark:text-violet-400">{raid.totalRaidMedals.toLocaleString()}</div>
                                <div className="text-xs text-muted-foreground">Total earned</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Efficiency</div>
                                <div className="font-bold">{raid.efficiency}</div>
                                <div className="text-xs text-muted-foreground">gold/attack</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function WeeklyTrendsAnalysis({ data }: { data: any }) {
    if (!data?.weeklyData || data.weeklyData.length === 0) {
        return (
            <div className="text-center text-muted-foreground">
                <TrendingUp className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Insufficient data for trend analysis</p>
            </div>
        );
    }

    const weeklyData = data.weeklyData.map((week: any) => ({
        week: new Date(week.endTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        participation: week.participationRate,
        gold: week.totalGold,
        efficiency: week.averageGoldPerAttack,
        attacks: week.totalAttacks
    }));

    return (
        <div className="space-y-6">
            <SectionHeader 
                title="Weekly Raid Trends" 
                description="12-week performance trends and patterns"
            />

            <StatsGrid>
                <MetricCard
                    title="Participation Trend"
                    value={data.trends?.participationTrend || 'stable'}
                    icon={data.trends?.participationTrend === 'improving' ? <TrendingUp className="h-4 w-4" /> : 
                          data.trends?.participationTrend === 'declining' ? <TrendingDown className="h-4 w-4" /> : 
                          <Target className="h-4 w-4" />}
                />
                <MetricCard
                    title="Gold Trend"
                    value={data.trends?.goldTrend || 'stable'}
                    icon={data.trends?.goldTrend === 'improving' ? <TrendingUp className="h-4 w-4" /> : 
                          data.trends?.goldTrend === 'declining' ? <TrendingDown className="h-4 w-4" /> : 
                          <Target className="h-4 w-4" />}
                />
                <MetricCard
                    title="Efficiency Trend"
                    value={data.trends?.efficiencyTrend || 'stable'}
                    icon={data.trends?.efficiencyTrend === 'improving' ? <TrendingUp className="h-4 w-4" /> : 
                          data.trends?.efficiencyTrend === 'declining' ? <TrendingDown className="h-4 w-4" /> : 
                          <Target className="h-4 w-4" />}
                />
            </StatsGrid>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Participation Rate Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <LineChartComponent 
                            title="Weekly Participation Rate"
                            data={weeklyData}
                            xKey="week"
                            lines={[
                                { key: 'participation', name: 'Participation (%)', color: '#10b981' }
                            ]}
                            height={250}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Capital Gold Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <AreaChartComponent 
                            title="Weekly Capital Gold Earned"
                            data={weeklyData}
                            xKey="week"
                            yKey="gold"
                            height={250}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function AttackEfficiencyAnalysis({ data }: { data: any }) {
    if (!data?.efficiencyData || data.efficiencyData.length === 0) {
        return (
            <div className="text-center text-muted-foreground">
                <Target className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No efficiency data available</p>
            </div>
        );
    }

    const efficiencyData = data.efficiencyData.map((week: any) => ({
        week: new Date(week.endTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        efficiency: week.averageGoldPerAttack,
        attacks: week.totalAttacks,
        level: week.efficiency
    }));

    return (
        <div className="space-y-6">
            <SectionHeader 
                title="Attack Efficiency Analysis" 
                description="Gold earned per attack and efficiency patterns"
            />

            <StatsGrid>
                <MetricCard
                    title="Overall Efficiency"
                    value={data.overallEfficiency || 0}
                    icon={<Target className="h-4 w-4" />}
                    suffix=" gold/attack"
                />
            </StatsGrid>

            <Card>
                <CardHeader>
                    <CardTitle>Weekly Attack Efficiency</CardTitle>
                </CardHeader>
                <CardContent>
                                            <BarChartComponent 
                            title="Gold per Attack by Week"
                            data={efficiencyData}
                            xKey="week"
                            yKey="efficiency"
                            height={300}
                        />
                </CardContent>
            </Card>
        </div>
    );
}

function CapitalProgressionAnalysis({ data }: { data: any }) {
    if (!data?.progressionData || data.progressionData.length === 0) {
        return (
            <div className="text-center text-muted-foreground">
                <Castle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No progression data available</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <SectionHeader 
                title="Capital Progression" 
                description="Long-term capital development and medal accumulation"
            />

            <StatsGrid>
                <MetricCard
                    title="Total Capital Gold"
                    value={data.totalCapitalGoldEarned || 0}
                    icon={<Coins className="h-4 w-4" />}
                    suffix=" total"
                />
                <MetricCard
                    title="Total Raid Medals"
                    value={data.totalRaidMedalsEarned || 0}
                    icon={<Gem className="h-4 w-4" />}
                    suffix=" earned"
                />
            </StatsGrid>

            <Card>
                <CardHeader>
                    <CardTitle>Capital Development Timeline</CardTitle>
                    <CardDescription>Historical progress over the last 24 raids</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground">
                        <Castle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                        <p>Capital progression tracking coming soon</p>
                        <p className="text-sm">We're working on advanced capital level tracking features</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function CapitalAnalyticsSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardContent className="pt-6">
                            <Skeleton className="h-8 w-16 mb-2" />
                            <Skeleton className="h-4 w-24" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
        </div>
    );
} 