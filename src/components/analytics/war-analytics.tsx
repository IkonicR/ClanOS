'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { MetricCard, StatsGrid, SectionHeader } from './analytics-cards';
import { AreaChartComponent, BarChartComponent, LineChartComponent, PieChartComponent } from './chart-components';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, TrendingUp, TrendingDown, Target, Shield, Zap, Award, Users, Clock, Brain, Star } from 'lucide-react';

interface WarAnalyticsProps {
    data: any;
    isLoading: boolean;
    onRefresh: () => void;
}

export function WarAnalytics({ data, isLoading, onRefresh }: WarAnalyticsProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('avgStarsPerAttack');
    const [filterTier, setFilterTier] = useState('all');

    if (isLoading) {
        return <WarAnalyticsSkeleton />;
    }

    if (!data) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground">
                        <Shield className="mx-auto h-12 w-12 mb-4 opacity-50" />
                        <p>No war data available</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const filteredPlayers = data.memberPerformance?.allWarriors
        ?.filter((player: any) => 
            player.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            (filterTier === 'all' || 
             (filterTier === 'elite' && player.warStats.avgStarsPerAttack >= 2.5) ||
             (filterTier === 'reliable' && player.warStats.avgStarsPerAttack >= 2.0 && player.warStats.avgStarsPerAttack < 2.5) ||
             (filterTier === 'improving' && player.warStats.improvement > 25) ||
             (filterTier === 'consistent' && player.warStats.consistencyScore >= 80))
        )
        ?.sort((a: any, b: any) => {
            if (sortBy === 'avgStarsPerAttack') return b.warStats.avgStarsPerAttack - a.warStats.avgStarsPerAttack;
            if (sortBy === 'warsParticipated') return b.warStats.warsParticipated - a.warStats.warsParticipated;
            if (sortBy === 'successRate') return b.warStats.successRate - a.warStats.successRate;
            if (sortBy === 'consistencyScore') return b.warStats.consistencyScore - a.warStats.consistencyScore;
            if (sortBy === 'improvement') return b.warStats.improvement - a.warStats.improvement;
            if (sortBy === 'clutchAttacks') return b.warStats.clutchAttacks - a.warStats.clutchAttacks;
            return 0;
        }) || [];

    return (
        <div className="space-y-6">
            {/* War Summary Cards */}
            <StatsGrid>
                <MetricCard
                    title="Total Wars"
                    value={data.summary?.totalWars || 0}
                    icon={<Shield className="h-4 w-4" />}
                    change={{
                        value: data.summary?.winRate || 0,
                        type: data.summary?.winRate > 60 ? 'increase' : data.summary?.winRate < 40 ? 'decrease' : 'neutral',
                        period: '% win rate'
                    }}
                />
                <MetricCard
                    title="Win Streak"
                    value={data.summary?.streak?.count || 0}
                    icon={<Star className="h-4 w-4" />}
                    change={{
                        value: data.summary?.perfectWarRate || 0,
                        type: data.summary?.streak?.type === 'win' ? 'increase' : data.summary?.streak?.type === 'lose' ? 'decrease' : 'neutral',
                        period: data.summary?.streak?.type || 'neutral'
                    }}
                />
                <MetricCard
                    title="Active Warriors"
                    value={data.memberPerformance?.overview?.totalActiveWarriors || 0}
                    icon={<Users className="h-4 w-4" />}
                    change={{
                        value: data.memberPerformance?.overview?.averageParticipationRate || 0,
                        type: 'neutral',
                        period: '% participation'
                    }}
                />
                <MetricCard
                    title="Elite Warriors"
                    value={data.memberPerformance?.overview?.eliteCount || 0}
                    icon={<Award className="h-4 w-4" />}
                    change={{
                        value: data.memberPerformance?.overview?.consistentCount || 0,
                        type: 'neutral',
                        period: ' consistent'
                    }}
                />
            </StatsGrid>

            {/* Current War Status */}
            {data.currentWar && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5" />
                            Current War Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CurrentWarStatus currentWar={data.currentWar} />
                    </CardContent>
                </Card>
            )}

            {/* Predictions */}
            {data.predictions && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Brain className="h-5 w-5" />
                            AI War Predictions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <WarPredictions predictions={data.predictions} />
                    </CardContent>
                </Card>
            )}

            <Tabs defaultValue="performance" className="space-y-4">
                <TabsList className="grid w-full grid-cols-6 max-w-4xl mx-auto">
                    <TabsTrigger value="performance" className="hidden sm:flex">
                        <Users className="h-4 w-4 mr-1 hidden sm:block" />
                        <span className="hidden sm:inline">Member Performance</span>
                        <Users className="h-4 w-4 sm:hidden" />
                    </TabsTrigger>
                    <TabsTrigger value="histories" className="hidden sm:flex">
                        <Clock className="h-4 w-4 mr-1 hidden sm:block" />
                        <span className="hidden sm:inline">Attack Histories</span>
                        <Clock className="h-4 w-4 sm:hidden" />
                    </TabsTrigger>
                    <TabsTrigger value="trends" className="hidden sm:flex">
                        <TrendingUp className="h-4 w-4 mr-1 hidden sm:block" />
                        <span className="hidden sm:inline">Weekly Trends</span>
                        <TrendingUp className="h-4 w-4 sm:hidden" />
                    </TabsTrigger>
                    <TabsTrigger value="patterns" className="hidden sm:flex">
                        <Target className="h-4 w-4 mr-1 hidden sm:block" />
                        <span className="hidden sm:inline">Attack Patterns</span>
                        <Target className="h-4 w-4 sm:hidden" />
                    </TabsTrigger>
                    <TabsTrigger value="competitive" className="hidden sm:flex">
                        <Shield className="h-4 w-4 mr-1 hidden sm:block" />
                        <span className="hidden sm:inline">Competitive</span>
                        <Shield className="h-4 w-4 sm:hidden" />
                    </TabsTrigger>
                    <TabsTrigger value="recent" className="hidden sm:flex">
                        <Star className="h-4 w-4 mr-1 hidden sm:block" />
                        <span className="hidden sm:inline">Recent Wars</span>
                        <Star className="h-4 w-4 sm:hidden" />
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="performance" className="space-y-6">
                    <MemberPerformanceAnalysis 
                        data={data.memberPerformance}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                        filterTier={filterTier}
                        setFilterTier={setFilterTier}
                        filteredPlayers={filteredPlayers}
                    />
                </TabsContent>

                <TabsContent value="histories" className="space-y-6">
                    <MemberAttackHistories data={data.attackHistories} />
                </TabsContent>

                <TabsContent value="trends" className="space-y-6">
                    <WeeklyWarTrends data={data.weeklyTrends} />
                </TabsContent>

                <TabsContent value="patterns" className="space-y-6">
                    <AdvancedAttackPatterns data={data.attackPatterns} />
                </TabsContent>

                <TabsContent value="competitive" className="space-y-6">
                    <CompetitiveAnalysis data={data.competitiveAnalysis} />
                </TabsContent>

                <TabsContent value="recent" className="space-y-6">
                    <RecentWarsAnalysis data={data.recentWars} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function CurrentWarStatus({ currentWar }: { currentWar: any }) {
    const { our, opponent, status } = currentWar;
    
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Our Clan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span>Stars:</span>
                                <span className="font-bold">{our.stars}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Destruction:</span>
                                <span className="font-bold">{our.destruction}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Attacks Used:</span>
                                <span className="font-bold">{our.attacks}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Attacks Left:</span>
                                <span className="font-bold text-blue-600">{our.attacksRemaining}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Opponent</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span>Name:</span>
                                <span className="font-bold text-sm">{opponent.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Stars:</span>
                                <span className="font-bold">{opponent.stars}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Destruction:</span>
                                <span className="font-bold">{opponent.destruction}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Level:</span>
                                <span className="font-bold">{opponent.level}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">War Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Badge variant={status.isWinning ? "default" : "secondary"} className="w-full justify-center">
                                {status.isWinning ? "Winning" : "Losing"}
                            </Badge>
                            <div className="flex justify-between">
                                <span>Star Diff:</span>
                                <span className={`font-bold ${status.starDifference > 0 ? 'text-green-600' : status.starDifference < 0 ? 'text-red-600' : ''}`}>
                                    {status.starDifference > 0 ? '+' : ''}{status.starDifference}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Win Probability:</span>
                                <span className="font-bold text-blue-600">{status.winProbability}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Time Left:</span>
                                <span className="font-bold">{currentWar.timeRemaining}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function WarPredictions({ predictions }: { predictions: any }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Next War Prediction</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600">
                                {predictions.nextWarWinProbability}%
                            </div>
                            <div className="text-sm text-muted-foreground">Win Probability</div>
                        </div>
                        <Progress value={predictions.nextWarWinProbability} className="h-2" />
                        <div className="text-center">
                            <Badge variant={
                                predictions.momentum === 'positive' ? 'default' : 
                                predictions.momentum === 'negative' ? 'destructive' : 'secondary'
                            }>
                                {predictions.momentum} momentum
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Team Form & Strategy</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between mb-2">
                                <span>Form Score:</span>
                                <span className="font-bold">{predictions.formScore}/100</span>
                            </div>
                            <Progress value={predictions.formScore} className="h-2" />
                            <div className="text-sm text-muted-foreground mt-1">
                                Form Rating: <Badge variant="outline">{predictions.formRating}</Badge>
                            </div>
                        </div>
                        <Separator />
                        <div>
                            <div className="text-sm font-medium mb-2">Recommended Strategy:</div>
                            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                                {predictions.recommendedStrategy}
                            </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Confidence: {predictions.confidence}%
                        </div>
                    </div>
                </CardContent>
            </Card>
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
    filteredPlayers 
}: any) {
    return (
        <div className="space-y-6">
            {/* Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard
                    title="Elite Warriors"
                    value={data.overview?.eliteCount || 0}
                    icon={<Award className="h-4 w-4" />}
                    suffix=" elite"
                />
                <MetricCard
                    title="Reliable Warriors"
                    value={data.overview?.reliableCount || 0}
                    icon={<Shield className="h-4 w-4" />}
                    suffix=" reliable"
                />
                <MetricCard
                    title="Improving Players"
                    value={data.overview?.improvingCount || 0}
                    icon={<TrendingUp className="h-4 w-4" />}
                    suffix=" improving"
                />
                <MetricCard
                    title="Participation Rate"
                    value={`${data.overview?.averageParticipationRate || 0}%`}
                    icon={<Users className="h-4 w-4" />}
                    change={{
                        value: data.overview?.averageParticipationRate || 0,
                        type: 'neutral',
                        period: 'avg participation'
                    }}
                />
            </div>

            {/* Top and Struggling Performers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Award className="h-5 w-5" />
                            Top Performers
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {data.topPerformers?.slice(0, 5).map((player: any, index: number) => (
                                <div key={player.tag} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="default" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                                            {index + 1}
                                        </Badge>
                                        <div>
                                            <div className="font-medium">{player.name}</div>
                                            <div className="text-sm text-muted-foreground">TH{player.townHallLevel}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold">{player.warStats.avgStarsPerAttack}</div>
                                        <div className="text-sm text-muted-foreground">avg stars</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            Focus Areas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {data.strugglingPlayers?.slice(0, 5).map((player: any, index: number) => (
                                <div key={player.tag} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                                            !
                                        </Badge>
                                        <div>
                                            <div className="font-medium">{player.name}</div>
                                            <div className="text-sm text-muted-foreground">TH{player.townHallLevel}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold">{player.warStats.avgStarsPerAttack}</div>
                                        <div className="text-sm text-muted-foreground">needs help</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Player Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Detailed Player Analysis</CardTitle>
                    <CardDescription>Individual war performance metrics and trends</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search players..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="avgStarsPerAttack">Avg Stars per Attack</SelectItem>
                                <SelectItem value="warsParticipated">Wars Participated</SelectItem>
                                <SelectItem value="successRate">Success Rate</SelectItem>
                                <SelectItem value="consistencyScore">Consistency</SelectItem>
                                <SelectItem value="improvement">Improvement</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filterTier} onValueChange={setFilterTier}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Filter tier" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Players</SelectItem>
                                <SelectItem value="elite">Elite</SelectItem>
                                <SelectItem value="reliable">Reliable</SelectItem>
                                <SelectItem value="improving">Improving</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Player Performance Table */}
                    <div className="overflow-x-auto">
                        <div className="space-y-2">
                            {filteredPlayers.map((player: any) => (
                                <PlayerPerformanceCard key={player.tag} player={player} />
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function PlayerPerformanceCard({ player }: { player: any }) {
    const stats = player.warStats;
    const getPerformanceColor = (score: number) => {
        if (score >= 2.5) return 'text-green-600';
        if (score >= 2.0) return 'text-blue-600';
        if (score >= 1.5) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getImprovementIcon = (improvement: number) => {
        if (improvement > 10) return <TrendingUp className="h-4 w-4 text-green-600" />;
        if (improvement < -10) return <TrendingDown className="h-4 w-4 text-red-600" />;
        return null;
    };

    return (
        <div className="border rounded-lg p-4 bg-card">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                <div className="flex items-center gap-3">
                    <div>
                        <div className="font-medium">{player.name}</div>
                        <div className="text-sm text-muted-foreground">
                            TH{player.townHallLevel} • {player.role}
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <div className={`text-lg font-bold ${getPerformanceColor(stats.avgStarsPerAttack)}`}>
                        {stats.avgStarsPerAttack}
                    </div>
                    <div className="text-xs text-muted-foreground">Avg Stars</div>
                </div>

                <div className="text-center">
                    <div className="text-lg font-bold">{stats.warsParticipated}</div>
                    <div className="text-xs text-muted-foreground">Wars</div>
                </div>

                <div className="text-center">
                    <div className="text-lg font-bold">{stats.successRate}%</div>
                    <div className="text-xs text-muted-foreground">Success Rate</div>
                </div>

                <div className="text-center">
                    <div className="text-lg font-bold">{stats.consistencyScore}</div>
                    <div className="text-xs text-muted-foreground">Consistency</div>
                </div>

                <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                        {getImprovementIcon(stats.improvement)}
                        <span className="text-lg font-bold">{stats.improvement}%</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Improvement</div>
                </div>
            </div>

            {/* Recent Form Indicator */}
            {player.recentForm && player.recentForm.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                    <div className="text-sm font-medium mb-2">Recent Form:</div>
                    <div className="flex gap-1">
                        {player.recentForm.slice(0, 5).map((attack: any, index: number) => (
                            <div
                                key={index}
                                className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${
                                    attack.stars === 3 ? 'bg-green-100 text-green-800' :
                                    attack.stars === 2 ? 'bg-blue-100 text-blue-800' :
                                    attack.stars === 1 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                }`}
                            >
                                {attack.stars}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function WarPatternsAnalysis({ data }: { data: any }) {
    const warSizeData = Object.entries(data.warSizeDistribution || {}).map(([size, count]) => ({
        name: `${size}v${size}`,
        value: count
    }));

    return (
        <div className="space-y-6">
            <StatsGrid>
                <MetricCard
                    title="Average Stars"
                    value={data.averageStars || 0}
                    icon={<Star className="h-4 w-4" />}
                    suffix=" per war"
                />
                <MetricCard
                    title="Close Wars"
                    value={data.closeWars || 0}
                    icon={<Target className="h-4 w-4" />}
                    change={{
                        value: data.competitiveness?.closeWarRate || 0,
                        type: 'neutral',
                        period: '% of wars'
                    }}
                />
                <MetricCard
                    title="Dominant Wins"
                    value={data.dominantWins || 0}
                    icon={<Award className="h-4 w-4" />}
                    change={{
                        value: data.competitiveness?.dominanceRate || 0,
                        type: 'neutral',
                        period: '% win rate'
                    }}
                />
                <MetricCard
                    title="Avg Opponent Level"
                    value={data.avgOpponentLevel || 0}
                    icon={<Shield className="h-4 w-4" />}
                    suffix=" level"
                />
            </StatsGrid>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>War Size Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PieChartComponent 
                            title=""
                            data={warSizeData} 
                            nameKey="name"
                            valueKey="value"
                            height={250}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>War Competitiveness</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span>Close Wars</span>
                                    <span>{data.competitiveness?.closeWarRate || 0}%</span>
                                </div>
                                <Progress value={data.competitiveness?.closeWarRate || 0} />
                            </div>
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span>Dominance Rate</span>
                                    <span>{data.competitiveness?.dominanceRate || 0}%</span>
                                </div>
                                <Progress value={data.competitiveness?.dominanceRate || 0} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function AttackAnalysis({ data }: { data: any }) {
    const positionData = data.byPosition?.map((pos: any) => ({
        name: `#${pos.position}`,
        successRate: pos.successRate,
        avgStars: pos.avgStars,
        attempts: pos.attempts
    })) || [];

    return (
        <div className="space-y-6">
            <StatsGrid>
                <MetricCard
                    title="Total Attacks"
                    value={data.overall?.totalAttacks || 0}
                    icon={<Target className="h-4 w-4" />}
                    suffix=" attacks"
                />
                <MetricCard
                    title="Perfect Attacks"
                    value={data.overall?.perfectAttacks || 0}
                    icon={<Star className="h-4 w-4" />}
                    change={{
                        value: data.overall?.successRate || 0,
                        type: 'neutral',
                        period: '% success rate'
                    }}
                />
                <MetricCard
                    title="Good Attacks"
                    value={data.overall?.goodAttacks || 0}
                    icon={<Award className="h-4 w-4" />}
                    change={{
                        value: data.overall?.goodAttackRate || 0,
                        type: 'neutral',
                        period: '% good attacks'
                    }}
                />
                <MetricCard
                    title="Failed Attacks"
                    value={data.overall?.failedAttacks || 0}
                    icon={<Shield className="h-4 w-4" />}
                    suffix=" failed"
                />
            </StatsGrid>

            <Card>
                <CardHeader>
                    <CardTitle>Attack Success by Position</CardTitle>
                    <CardDescription>Performance analysis by map position</CardDescription>
                </CardHeader>
                <CardContent>
                                            <BarChartComponent 
                            title="Success Rate by Position"
                            data={positionData}
                            xKey="name"
                            yKey="successRate"
                            height={300}
                        />
                </CardContent>
            </Card>
        </div>
    );
}

function HistoricalTrends({ data }: { data: any }) {
    const monthlyData = data.monthlyPerformance?.map((month: any) => ({
        month: month.month,
        winRate: month.winRate,
        avgStars: month.avgStars,
        wars: month.wars
    })) || [];

    return (
        <div className="space-y-6">
            {data.trends && (
                <StatsGrid>
                    <MetricCard
                        title="Overall Trend"
                        value={data.trends.overallTrend}
                        icon={<TrendingUp className="h-4 w-4" />}
                        change={{
                            value: 6,
                            type: data.trends.overallTrend === 'improving' ? 'increase' : data.trends.overallTrend === 'declining' ? 'decrease' : 'neutral',
                            period: 'month trend'
                        }}
                    />
                    <MetricCard
                        title="Best Month"
                        value={data.trends.bestMonth?.month || 'N/A'}
                        icon={<Award className="h-4 w-4" />}
                        change={{
                            value: data.trends.bestMonth?.winRate || 0,
                            type: 'neutral',
                            period: '% win rate'
                        }}
                    />
                    <MetricCard
                        title="Worst Month"
                        value={data.trends.worstMonth?.month || 'N/A'}
                        icon={<Target className="h-4 w-4" />}
                        change={{
                            value: data.trends.worstMonth?.winRate || 0,
                            type: 'neutral',
                            period: '% win rate'
                        }}
                    />
                </StatsGrid>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Win Rate Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <LineChartComponent 
                            title="Monthly Win Rate"
                            data={monthlyData}
                            xKey="month"
                            lines={[
                                { key: 'winRate', name: 'Win Rate (%)', color: '#10b981' }
                            ]}
                            height={300}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Average Stars Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <AreaChartComponent 
                            title="Average Stars per War"
                            data={monthlyData}
                            xKey="month"
                            yKey="avgStars"
                            height={300}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function RecentWarsAnalysis({ data }: { data: any }) {
    return (
        <div className="space-y-4">
            {data?.map((war: any, index: number) => (
                <Card key={index}>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <div className="text-sm text-muted-foreground">Result</div>
                                <Badge variant={war.result === 'win' ? 'default' : war.result === 'lose' ? 'destructive' : 'secondary'}>
                                    {war.result ? war.result.toUpperCase() : 'UNKNOWN'}
                                </Badge>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Opponent</div>
                                <div className="font-medium">{war.opponent.name}</div>
                                <div className="text-xs text-muted-foreground">Level {war.opponent.level}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Performance</div>
                                <div className="font-bold">
                                    {war.performance.stars}/{war.performance.maxStars} ⭐
                                </div>
                                <div className="text-sm">
                                    {war.performance.destruction}% • {war.performance.attacks} attacks
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Margin</div>
                                <div className={`font-bold ${war.margin.stars > 0 ? 'text-green-600' : war.margin.stars < 0 ? 'text-red-600' : ''}`}>
                                    {war.margin.stars > 0 ? '+' : ''}{war.margin.stars} stars
                                </div>
                                <div className="text-sm">
                                    {war.margin.destruction > 0 ? '+' : ''}{war.margin.destruction}% destruction
                                </div>
                            </div>
                        </div>
                        {war.performance.isPerfect && (
                            <div className="mt-3 pt-3 border-t">
                                <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                    Perfect War! 🌟
                                </Badge>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

// New comprehensive component placeholders
function MemberAttackHistories({ data }: { data: any }) {
    if (!data) return <div>No attack history data available</div>;
    
    return (
        <div className="space-y-6">
            <SectionHeader title="Member Attack Histories" description="Detailed attack tracking and statistics for each member" />
            <div className="text-center text-muted-foreground py-8">
                <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Comprehensive attack histories coming soon...</p>
            </div>
        </div>
    );
}

function WeeklyWarTrends({ data }: { data: any }) {
    if (!data) return <div>No weekly trends data available</div>;
    
    return (
        <div className="space-y-6">
            <SectionHeader title="12-Week War Trends" description="Weekly performance patterns and trends analysis" />
            
            {data.weeklyPerformance && (
                <LineChartComponent
                    title="Weekly Win Rate Trends"
                    data={data.weeklyPerformance}
                    xKey="week"
                    lines={[
                        { key: "winRate", name: "Win Rate", color: "#3b82f6" },
                        { key: "avgStars", name: "Avg Stars", color: "#10b981" }
                    ]}
                    height={300}
                />
            )}
        </div>
    );
}

function AdvancedAttackPatterns({ data }: { data: any }) {
    if (!data) return <div>No attack patterns data available</div>;
    
    return (
        <div className="space-y-6">
            <SectionHeader title="Advanced Attack Patterns" description="Deep analysis of attack strategies and patterns" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Attack Order</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span>First Attacks:</span>
                                <span className="font-bold text-emerald-600">{data.attackOrder?.first || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Second Attacks:</span>
                                <span className="font-bold text-blue-600">{data.attackOrder?.second || 0}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Star Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span>3-Star Attacks:</span>
                                <span className="font-bold text-yellow-600">{data.starSecuring?.threestar || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>2-Star Attacks:</span>
                                <span className="font-bold text-orange-600">{data.starSecuring?.twostar || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>1-Star Attacks:</span>
                                <span className="font-bold text-red-600">{data.starSecuring?.onestar || 0}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Attack Types</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span>Mirror Attacks:</span>
                                <span className="font-bold text-green-600">{data.mirrorAttacks || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Up Attacks:</span>
                                <span className="font-bold text-blue-600">{data.upAttacks || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Down Attacks:</span>
                                <span className="font-bold text-purple-600">{data.downAttacks || 0}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function CompetitiveAnalysis({ data }: { data: any }) {
    if (!data) return <div>No competitive analysis data available</div>;
    
    return (
        <div className="space-y-6">
            <SectionHeader title="Competitive Performance" description="Analysis against different opponent types and strengths" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">War Outcomes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm">Close Wars</span>
                                    <span className="text-sm font-bold">{data.closeWars?.length || 0}</span>
                                </div>
                                <div className="text-xs text-muted-foreground">Star difference ≤ 3</div>
                            </div>
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm">Dominant Wins</span>
                                    <span className="text-sm font-bold text-green-600">{data.dominantPerformances?.length || 0}</span>
                                </div>
                                <div className="text-xs text-muted-foreground">Won by 10+ stars</div>
                            </div>
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm">Clutch Wins</span>
                                    <span className="text-sm font-bold text-yellow-600">{data.clutchWins?.length || 0}</span>
                                </div>
                                <div className="text-xs text-muted-foreground">Won by ≤ 2 stars</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Opponent Strength</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm">vs Stronger</span>
                                    <span className="text-sm font-bold text-red-600">{data.opponentAnalysis?.strengthComparison?.stronger || 0}</span>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm">vs Similar</span>
                                    <span className="text-sm font-bold text-yellow-600">{data.opponentAnalysis?.strengthComparison?.similar || 0}</span>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm">vs Weaker</span>
                                    <span className="text-sm font-bold text-green-600">{data.opponentAnalysis?.strengthComparison?.weaker || 0}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function WarAnalyticsSkeleton() {
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