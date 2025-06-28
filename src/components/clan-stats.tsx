'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Trophy, Shield, GitCommit, Award } from 'lucide-react';

interface ClanStatsProps {
    stats: {
        warFrequency: string;
        clanPoints: number;
        clanVersusPoints: number;
        requiredTrophies: number;
        requiredTownhallLevel: number;
    };
}

const StatCard = ({ icon, title, value }: { icon: React.ReactNode, title: string, value: string | number }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

export function ClanStats({ stats }: ClanStatsProps) {
    const { warFrequency, clanPoints, clanVersusPoints, requiredTrophies, requiredTownhallLevel } = stats;

    const formattedWarFrequency = warFrequency
        .split(/(?=[A-Z])/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mt-6">
            <StatCard icon={<Shield className="h-4 w-4 text-muted-foreground" />} title="War Frequency" value={formattedWarFrequency} />
            <StatCard icon={<Trophy className="h-4 w-4 text-muted-foreground" />} title="Clan Points" value={clanPoints} />
            <StatCard icon={<GitCommit className="h-4 w-4 text-muted-foreground" />} title="Clan Versus Points" value={clanVersusPoints} />
            <StatCard icon={<Award className="h-4 w-4 text-muted-foreground" />} title="Required Trophies" value={requiredTrophies} />
            <StatCard icon={<Users className="h-4 w-4 text-muted-foreground" />} title="Required Townhall" value={requiredTownhallLevel} />
        </div>
    );
} 