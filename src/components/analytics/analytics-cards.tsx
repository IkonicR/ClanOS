'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    change?: {
        value: number;
        type: 'increase' | 'decrease' | 'neutral';
        period?: string;
    };
    suffix?: string;
    className?: string;
}

export function MetricCard({ title, value, icon, change, suffix, className }: MetricCardProps) {
    const getTrendIcon = () => {
        if (!change) return null;
        
        switch (change.type) {
            case 'increase':
                return <TrendingUp className="h-4 w-4 text-green-500" />;
            case 'decrease':
                return <TrendingDown className="h-4 w-4 text-red-500" />;
            default:
                return <Minus className="h-4 w-4 text-muted-foreground" />;
        }
    };

    const getTrendColor = () => {
        if (!change) return '';
        
        switch (change.type) {
            case 'increase':
                return 'text-green-500';
            case 'decrease':
                return 'text-red-500';
            default:
                return 'text-muted-foreground';
        }
    };

    return (
        <Card className={`bg-card/75 backdrop-blur-lg border border-white/10 ${className}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/90">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-white">
                    {value}{suffix}
                </div>
                {change && (
                    <div className={`flex items-center space-x-1 text-xs ${getTrendColor()}`}>
                        {getTrendIcon()}
                        <span>
                            {change.value > 0 ? '+' : ''}{change.value}
                            {change.period && ` ${change.period}`}
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

interface StatsGridProps {
    children: React.ReactNode;
    className?: string;
}

export function StatsGrid({ children, className }: StatsGridProps) {
    return (
        <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
            {children}
        </div>
    );
}

interface SectionHeaderProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export function SectionHeader({ title, description, action }: SectionHeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <h3 className="text-lg font-semibold text-white/90">{title}</h3>
                {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                )}
            </div>
            {action}
        </div>
    );
} 