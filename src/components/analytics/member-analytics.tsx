'use client';

import React, { useState } from 'react';
import { 
    Users, 
    Trophy, 
    Gift, 
    TrendingUp,
    Award,
    Activity,
    Crown,
    Search
} from 'lucide-react';
import { MetricCard, StatsGrid, SectionHeader } from './analytics-cards';
import { BarChartComponent, PieChartComponent } from './chart-components';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface MemberAnalyticsProps {
    data: {
        memberCount: number;
        activeCount: number;
        inactiveCount: number;
        members: any[];
        performanceTiers: {
            top: { count: number; members: any[]; avgScore: number };
            mid: { count: number; avgScore: number };
            low: { count: number; members: any[]; avgScore: number };
        };
        donationAnalysis: {
            totalGiven: number;
            totalReceived: number;
            topDonators: any[];
            mostEfficient: any[];
            inactive: number;
        };
        trophyRanges: { [key: string]: number };
        townHallAnalysis: { [key: string]: any };
    };
}

export function MemberAnalytics({ data }: MemberAnalyticsProps) {
    const { memberCount, activeCount, inactiveCount, members, performanceTiers, donationAnalysis, trophyRanges, townHallAnalysis } = data;
    
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('performanceScore');
    const [filterBy, setFilterBy] = useState('all');

    // Filter and sort members
    const filteredMembers = members
        .filter(member => {
            const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = filterBy === 'all' || 
                (filterBy === 'active' && member.isActive) ||
                (filterBy === 'inactive' && !member.isActive) ||
                (filterBy === 'top' && performanceTiers.top.members.some(m => m.tag === member.tag)) ||
                (filterBy === 'low' && performanceTiers.low.members.some(m => m.tag === member.tag));
            return matchesSearch && matchesFilter;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'trophies':
                    return b.trophies - a.trophies;
                case 'donations':
                    return b.donations - a.donations;
                case 'donationEfficiency':
                    return b.donationEfficiency - a.donationEfficiency;
                default:
                    return b.performanceScore - a.performanceScore;
            }
        });

    // Prepare data for charts
    const trophyRangeData = Object.entries(trophyRanges).map(([range, count]) => ({
        name: range.replace(' (', '\n('),
        value: count
    })).filter(item => item.value > 0);

    const townHallData = Object.entries(townHallAnalysis)
        .map(([th, data]) => ({
            name: `TH${th}`,
            count: data.count,
            avgTrophies: data.avgTrophies,
            avgDonations: data.avgDonations
        }))
        .sort((a, b) => parseInt(a.name.replace('TH', '')) - parseInt(b.name.replace('TH', '')));

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const getPerformanceBadge = (score: number) => {
        if (score >= 50) return { label: 'Elite', color: 'bg-yellow-500' };
        if (score >= 30) return { label: 'Great', color: 'bg-green-500' };
        if (score >= 15) return { label: 'Good', color: 'bg-blue-500' };
        if (score >= 5) return { label: 'Fair', color: 'bg-orange-500' };
        return { label: 'Poor', color: 'bg-red-500' };
    };

    return (
        <div className="space-y-6">
            {/* Member Overview */}
            <div>
                <SectionHeader title="Member Overview" description="Activity and performance breakdown" />
                <StatsGrid className="mt-4">
                    <MetricCard
                        title="Total Members"
                        value={memberCount}
                        icon={<Users className="h-4 w-4 text-primary" />}
                        suffix="/50"
                    />
                    <MetricCard
                        title="Active Members"
                        value={activeCount}
                        icon={<Activity className="h-4 w-4 text-green-500" />}
                        change={{
                            value: Math.round((activeCount / memberCount) * 100),
                            type: 'neutral',
                            period: 'of total'
                        }}
                    />
                    <MetricCard
                        title="Top Performers"
                        value={performanceTiers.top.count}
                        icon={<Crown className="h-4 w-4 text-yellow-500" />}
                        change={{
                            value: performanceTiers.top.avgScore,
                            type: 'increase',
                            period: 'avg score'
                        }}
                    />
                    <MetricCard
                        title="Need Improvement"
                        value={performanceTiers.low.count}
                        icon={<TrendingUp className="h-4 w-4 text-orange-500" />}
                        change={{
                            value: performanceTiers.low.avgScore,
                            type: 'decrease',
                            period: 'avg score'
                        }}
                    />
                </StatsGrid>
            </div>

            {/* Donation Analytics */}
            <div>
                <SectionHeader title="Donation Analytics" description="Donation patterns and efficiency" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
                    <Card className="bg-card/75 backdrop-blur-lg border border-white/10">
                        <CardHeader>
                            <CardTitle className="text-lg">Donation Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="text-2xl font-bold text-green-500">{formatNumber(donationAnalysis.totalGiven)}</div>
                                <div className="text-sm text-muted-foreground">Total Donated</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-blue-500">{formatNumber(donationAnalysis.totalReceived)}</div>
                                <div className="text-sm text-muted-foreground">Total Received</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-orange-500">{donationAnalysis.inactive}</div>
                                <div className="text-sm text-muted-foreground">Inactive Members</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card/75 backdrop-blur-lg border border-white/10">
                        <CardHeader>
                            <CardTitle className="text-lg">Most Efficient Donators</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {donationAnalysis.mostEfficient.slice(0, 5).map((member: any, index: number) => (
                                    <div key={member.tag} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-xs font-bold text-green-500">
                                                {index + 1}
                                            </div>
                                            <span className="font-medium text-white text-sm">{member.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-green-500 text-sm">{member.donationEfficiency}x</div>
                                            <div className="text-xs text-muted-foreground">{member.donations}/{member.donationsReceived}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <BarChartComponent
                        title="Trophy Ranges"
                        data={trophyRangeData}
                        xKey="name"
                        yKey="value"
                        height={250}
                    />
                </div>
            </div>

            {/* Town Hall Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BarChartComponent
                    title="Town Hall Distribution"
                    data={townHallData}
                    xKey="name"
                    yKey="count"
                    height={300}
                />
                <BarChartComponent
                    title="Average Trophies by TH"
                    data={townHallData}
                    xKey="name"
                    yKey="avgTrophies"
                    color="#f59e0b"
                    height={300}
                />
            </div>

            {/* Member Table */}
            <div>
                <SectionHeader title="Member Details" description="Detailed member statistics and performance" />
                
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mt-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search members..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-card/50 border-white/10"
                        />
                    </div>
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-full sm:w-48 bg-card/50 border-white/10">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="performanceScore">Performance Score</SelectItem>
                            <SelectItem value="name">Name</SelectItem>
                            <SelectItem value="trophies">Trophies</SelectItem>
                            <SelectItem value="donations">Donations</SelectItem>
                            <SelectItem value="donationEfficiency">Efficiency</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filterBy} onValueChange={setFilterBy}>
                        <SelectTrigger className="w-full sm:w-48 bg-card/50 border-white/10">
                            <SelectValue placeholder="Filter by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Members</SelectItem>
                            <SelectItem value="active">Active Only</SelectItem>
                            <SelectItem value="inactive">Inactive Only</SelectItem>
                            <SelectItem value="top">Top Performers</SelectItem>
                            <SelectItem value="low">Need Improvement</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Card className="bg-card/75 backdrop-blur-lg border border-white/10">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-white/10">
                                    <TableHead className="text-white/90">Member</TableHead>
                                    <TableHead className="text-white/90">Performance</TableHead>
                                    <TableHead className="text-white/90">Trophies</TableHead>
                                    <TableHead className="text-white/90">Donations</TableHead>
                                    <TableHead className="text-white/90">Efficiency</TableHead>
                                    <TableHead className="text-white/90">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredMembers.slice(0, 20).map((member: any) => {
                                    const performanceBadge = getPerformanceBadge(member.performanceScore);
                                    return (
                                        <TableRow key={member.tag} className="border-white/5 hover:bg-white/5">
                                            <TableCell>
                                                <div className="flex items-center space-x-3">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-white">{member.name}</span>
                                                        <span className="text-xs text-muted-foreground">{member.tag}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-bold text-white">{member.performanceScore}</span>
                                                    <Badge className={`${performanceBadge.color} text-white text-xs`}>
                                                        {performanceBadge.label}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <Trophy className="h-4 w-4 text-yellow-500" />
                                                    <span className="font-medium text-white">{formatNumber(member.trophies)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <Gift className="h-4 w-4 text-green-500" />
                                                    <span className="font-medium text-white">{formatNumber(member.donations)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`font-medium ${member.donationEfficiency > 1 ? 'text-green-500' : member.donationEfficiency > 0.5 ? 'text-yellow-500' : 'text-red-500'}`}>
                                                    {member.donationEfficiency}x
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={member.isActive ? "default" : "secondary"} className="text-xs">
                                                    {member.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 