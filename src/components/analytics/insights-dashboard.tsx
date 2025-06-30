'use client';

import React from 'react';
import { 
    Brain, 
    TrendingUp, 
    TrendingDown, 
    AlertTriangle,
    CheckCircle,
    XCircle,
    Users,
    Trophy,
    Gift,
    Swords,
    Target,
    Crown,
    Clock,
    Zap,
    Heart,
    Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MetricCard, StatsGrid, SectionHeader } from './analytics-cards';

interface InsightsDashboardProps {
    data: {
        memberInsights: {
            activityRate: number;
            donationBalance: number;
            trophyConsistency: number;
            highPerformers: number;
            lowPerformers: number;
            promotionCandidates: Array<{
                name: string;
                tag: string;
                trophies: number;
                donations: number;
                reason: string;
            }>;
            inactiveMembers: Array<{
                name: string;
                tag: string;
                daysInactive: string;
                lastSeen: string;
            }>;
        };
        warInsights: {
            overallWinRate: number;
            trend: 'improving' | 'declining' | 'stable';
            mostCommonWarSize: number | null;
            performanceBySize: Array<{
                size: number;
                count: number;
                winRate: number;
            }>;
            avgStarEfficiency: number;
            perfectWars: number;
            closeWars: number;
        } | null;
        healthInsights: {
            overallScore: number;
            membership: {
                current: number;
                capacity: number;
                utilizationRate: number;
            };
            activity: {
                activeMembers: number;
                activityRate: number;
                status: 'excellent' | 'good' | 'needs_improvement';
            };
            donations: {
                avgPerMember: number;
                health: number;
                status: 'excellent' | 'good' | 'needs_improvement';
            };
            wars: {
                participationRate: number;
                status: 'excellent' | 'good' | 'needs_improvement';
            };
        };
        predictions: {
            trophyGrowth: {
                potential: number;
                timeframe: string;
                confidence: number;
            };
            nextWarWin: {
                probability: number;
                confidence: number;
            };
            membershipStability: {
                score: number;
                riskLevel: 'low' | 'medium' | 'high';
            };
        };
        recommendations: Array<{
            type: string;
            priority: 'high' | 'medium' | 'low';
            title: string;
            description: string;
            action: string;
        }>;
    };
}

export function InsightsDashboard({ data }: InsightsDashboardProps) {
    const { memberInsights, warInsights, healthInsights, predictions, recommendations } = data;

    const getHealthColor = (score: number) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getHealthIcon = (status: string) => {
        switch (status) {
            case 'excellent':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'good':
                return <CheckCircle className="h-5 w-5 text-yellow-500" />;
            default:
                return <XCircle className="h-5 w-5 text-red-500" />;
        }
    };

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'improving':
                return <TrendingUp className="h-4 w-4 text-green-500" />;
            case 'declining':
                return <TrendingDown className="h-4 w-4 text-red-500" />;
            default:
                return <TrendingUp className="h-4 w-4 text-blue-500" />;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'border-red-500 bg-red-500/10';
            case 'medium':
                return 'border-yellow-500 bg-yellow-500/10';
            default:
                return 'border-blue-500 bg-blue-500/10';
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'high':
                return <AlertTriangle className="h-4 w-4 text-red-500" />;
            case 'medium':
                return <Clock className="h-4 w-4 text-yellow-500" />;
            default:
                return <Zap className="h-4 w-4 text-blue-500" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Clan Health Overview */}
            <div>
                <SectionHeader 
                    title="Clan Health Score" 
                    description="Overall assessment of your clan's performance and activity"
                />
                <Card className="bg-card/75 backdrop-blur-lg border border-white/10 mt-4">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center space-x-2">
                                <Heart className="h-5 w-5 text-red-500" />
                                <span>Overall Health</span>
                            </CardTitle>
                            <div className={`text-3xl font-bold ${getHealthColor(healthInsights.overallScore)}`}>
                                {healthInsights.overallScore}/100
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="text-center">
                                <div className="flex items-center justify-center space-x-2 mb-2">
                                    {getHealthIcon(healthInsights.activity.status)}
                                    <span className="font-semibold text-white">Activity</span>
                                </div>
                                <div className="text-2xl font-bold text-white mb-1">
                                    {healthInsights.activity.activityRate}%
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {healthInsights.activity.activeMembers} active members
                                </div>
                            </div>

                            <div className="text-center">
                                <div className="flex items-center justify-center space-x-2 mb-2">
                                    {getHealthIcon(healthInsights.donations.status)}
                                    <span className="font-semibold text-white">Donations</span>
                                </div>
                                <div className="text-2xl font-bold text-white mb-1">
                                    {healthInsights.donations.health}%
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {healthInsights.donations.avgPerMember} avg/member
                                </div>
                            </div>

                            <div className="text-center">
                                <div className="flex items-center justify-center space-x-2 mb-2">
                                    {getHealthIcon(healthInsights.wars.status)}
                                    <span className="font-semibold text-white">Wars</span>
                                </div>
                                <div className="text-2xl font-bold text-white mb-1">
                                    {healthInsights.wars.participationRate}%
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    participation rate
                                </div>
                            </div>

                            <div className="text-center">
                                <div className="flex items-center justify-center space-x-2 mb-2">
                                    <Users className="h-5 w-5 text-blue-500" />
                                    <span className="font-semibold text-white">Capacity</span>
                                </div>
                                <div className="text-2xl font-bold text-white mb-1">
                                    {healthInsights.membership.current}/50
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {healthInsights.membership.utilizationRate}% full
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Member Performance Insights */}
            <div>
                <SectionHeader title="Member Performance Analysis" description="Deep insights into member activity and performance patterns" />
                <StatsGrid className="mt-4">
                    <MetricCard
                        title="Activity Rate"
                        value={memberInsights.activityRate}
                        icon={<Users className="h-4 w-4 text-green-500" />}
                        suffix="%"
                        change={{
                            value: memberInsights.activityRate > 80 ? 10 : -5,
                            type: memberInsights.activityRate > 80 ? 'increase' : 'decrease',
                            period: 'vs. benchmark'
                        }}
                    />
                    <MetricCard
                        title="Donation Balance"
                        value={memberInsights.donationBalance}
                        icon={<Gift className="h-4 w-4 text-blue-500" />}
                        change={{
                            value: memberInsights.donationBalance > 1 ? 15 : -10,
                            type: memberInsights.donationBalance > 1 ? 'increase' : 'decrease',
                            period: 'ideal ratio'
                        }}
                    />
                    <MetricCard
                        title="Trophy Consistency"
                        value={memberInsights.trophyConsistency}
                        icon={<Trophy className="h-4 w-4 text-yellow-500" />}
                        suffix="%"
                        change={{
                            value: memberInsights.highPerformers,
                            type: 'increase',
                            period: 'high performers'
                        }}
                    />
                    <MetricCard
                        title="Performance Issues"
                        value={memberInsights.lowPerformers}
                        icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
                        change={{
                            value: memberInsights.inactiveMembers.length,
                            type: 'decrease',
                            period: 'inactive'
                        }}
                    />
                </StatsGrid>
            </div>

            {/* War Performance Insights */}
            {warInsights && (
                <div>
                    <SectionHeader title="War Strategy Analysis" description="Performance patterns and strategic insights from recent wars" />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                        <Card className="bg-card/75 backdrop-blur-lg border border-white/10">
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Swords className="h-5 w-5 text-red-500" />
                                    <span>War Performance</span>
                                    {getTrendIcon(warInsights.trend)}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <div className="text-2xl font-bold text-white">{warInsights.overallWinRate}%</div>
                                    <div className="text-sm text-muted-foreground">Overall Win Rate</div>
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-white">{warInsights.avgStarEfficiency}</div>
                                    <div className="text-sm text-muted-foreground">Stars per Attack</div>
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-white">{warInsights.perfectWars}</div>
                                    <div className="text-sm text-muted-foreground">Perfect Wars</div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-card/75 backdrop-blur-lg border border-white/10">
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Target className="h-5 w-5 text-blue-500" />
                                    <span>War Size Performance</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {warInsights.performanceBySize.map((size) => (
                                        <div key={size.size} className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <Badge variant="outline">{size.size}v{size.size}</Badge>
                                                <span className="text-sm text-muted-foreground">({size.count} wars)</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <div className="w-20">
                                                    <Progress value={size.winRate} className="h-2" />
                                                </div>
                                                <span className="text-sm font-medium text-white">{Math.round(size.winRate)}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* Predictions */}
            <div>
                <SectionHeader title="Performance Predictions" description="AI-powered predictions based on current trends" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
                    <Card className="bg-card/75 backdrop-blur-lg border border-white/10">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Trophy className="h-5 w-5 text-yellow-500" />
                                <span>Trophy Growth</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white mb-2">
                                {predictions.trophyGrowth.potential} members
                            </div>
                            <div className="text-sm text-muted-foreground mb-3">
                                Expected to improve in {predictions.trophyGrowth.timeframe}
                            </div>
                            <div className="flex items-center space-x-2">
                                <Progress value={predictions.trophyGrowth.confidence} className="flex-1 h-2" />
                                <span className="text-xs text-muted-foreground">{predictions.trophyGrowth.confidence}% confident</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card/75 backdrop-blur-lg border border-white/10">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Swords className="h-5 w-5 text-red-500" />
                                <span>Next War</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white mb-2">
                                {predictions.nextWarWin.probability}%
                            </div>
                            <div className="text-sm text-muted-foreground mb-3">
                                Win probability
                            </div>
                            <div className="flex items-center space-x-2">
                                <Progress value={predictions.nextWarWin.confidence} className="flex-1 h-2" />
                                <span className="text-xs text-muted-foreground">{predictions.nextWarWin.confidence}% confident</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card/75 backdrop-blur-lg border border-white/10">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Users className="h-5 w-5 text-blue-500" />
                                <span>Membership</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white mb-2">
                                {predictions.membershipStability.score}%
                            </div>
                            <div className="text-sm text-muted-foreground mb-3">
                                Stability score
                            </div>
                            <Badge 
                                variant={predictions.membershipStability.riskLevel === 'low' ? 'default' : 
                                        predictions.membershipStability.riskLevel === 'medium' ? 'secondary' : 'destructive'}
                            >
                                {predictions.membershipStability.riskLevel} risk
                            </Badge>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Strategic Recommendations */}
            <div>
                <SectionHeader title="Strategic Recommendations" description="AI-generated action items to improve clan performance" />
                <div className="space-y-4 mt-4">
                    {recommendations.map((rec, index) => (
                        <Alert key={index} className={`border-l-4 ${getPriorityColor(rec.priority)}`}>
                            <div className="flex items-start space-x-3">
                                {getPriorityIcon(rec.priority)}
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <h4 className="font-semibold text-white">{rec.title}</h4>
                                        <Badge variant={rec.priority === 'high' ? 'destructive' : 
                                                      rec.priority === 'medium' ? 'secondary' : 'default'}>
                                            {rec.priority}
                                        </Badge>
                                    </div>
                                    <AlertDescription className="text-muted-foreground mb-2">
                                        {rec.description}
                                    </AlertDescription>
                                    <div className="text-sm font-medium text-primary">
                                        💡 Action: {rec.action}
                                    </div>
                                </div>
                            </div>
                        </Alert>
                    ))}
                </div>
            </div>

            {/* Promotion Candidates */}
            {memberInsights.promotionCandidates.length > 0 && (
                <div>
                    <SectionHeader title="Promotion Candidates" description="Members who may be ready for leadership roles" />
                    <Card className="bg-card/75 backdrop-blur-lg border border-white/10 mt-4">
                        <CardContent className="p-0">
                            <div className="divide-y divide-white/10">
                                {memberInsights.promotionCandidates.map((candidate, index) => (
                                    <div key={candidate.tag} className="p-4 hover:bg-white/5 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                                    <Crown className="h-4 w-4 text-yellow-500" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-white">{candidate.name}</div>
                                                    <div className="text-sm text-muted-foreground">{candidate.reason}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-medium text-white">
                                                    🏆 {candidate.trophies.toLocaleString()}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    🎁 {candidate.donations} donated
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
} 