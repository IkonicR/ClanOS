'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
    Users, 
    Trophy, 
    ArrowUpCircle,
    Loader
} from 'lucide-react';

interface ClanStats {
    name: string;
    level: number;
    badgeUrl: string;
    warLeague: string;
    warWinStreak: number;
    members: number;
    donationRatio: number;
}

interface InstantPulseProps {
    initialStats: ClanStats;
}

const StatCard = ({ title, value, subtext, icon }: { title: string, value: string | number, subtext: string, icon: React.ReactNode }) => (
    <Card className="bg-card/75 backdrop-blur-lg border border-white/10 transition-all duration-300 hover:border-white/25 hover:shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{subtext}</p>
        </CardContent>
    </Card>
);

const LoadingCard = ({ title }: { title: string }) => (
     <Card className="bg-card/75 backdrop-blur-lg border border-white/10 transition-all duration-300 hover:border-white/25 hover:shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Loader className="h-4 w-4 text-muted-foreground animate-spin" />
        </CardHeader>
        <CardContent>
            <div className="h-8 w-1/2 bg-muted-foreground/20 rounded-md animate-pulse" />
            <div className="h-4 w-3/4 bg-muted-foreground/20 rounded-md animate-pulse mt-2" />
        </CardContent>
    </Card>
)

export const InstantPulse = ({ initialStats }: InstantPulseProps) => {
    const [stats, setStats] = useState<ClanStats>(initialStats);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setIsLoading(true);
                const res = await fetch('/api/clan-stats');
                if (!res.ok) {
                    throw new Error('Failed to fetch stats');
                }
                const newStats = await res.json();
                setStats(newStats);
            } catch (error) {
                console.error("Failed to refresh clan stats:", error);
            } finally {
                setIsLoading(false);
            }
        };

        const interval = setInterval(fetchStats, 60000); // Refresh every 60 seconds

        return () => clearInterval(interval);
    }, []);

    if (isLoading && !stats) {
         return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <LoadingCard title="Clan" />
                <LoadingCard title="War League" />
                <LoadingCard title="Members" />
                <LoadingCard title="Donation Ratio" />
            </div>
        );
    }
    
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
             <StatCard 
                title="Clan" 
                value={stats.name}
                subtext={`Level ${stats.level}`}
                icon={<Image src={stats.badgeUrl} alt="Clan Badge" width={40} height={40} />}
            />
            <StatCard 
                title="War League" 
                value={stats.warLeague}
                subtext={`${stats.warWinStreak} win streak`}
                icon={<Trophy className="h-4 w-4 text-primary" />}
            />
            <StatCard 
                title="Members" 
                value={`${stats.members}/50`}
                subtext="Ready for war"
                icon={<Users className="h-4 w-4 text-primary" />}
            />
            <StatCard 
                title="Donation Ratio" 
                value={stats.donationRatio.toFixed(2)}
                subtext="Donated vs Received"
                icon={<ArrowUpCircle className="h-4 w-4 text-primary" />}
            />
        </div>
    );
}; 