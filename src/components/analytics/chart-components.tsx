'use client';

import React from 'react';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Custom tooltip component for charts
const CustomTooltip = ({ active, payload, label, formatter }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card/95 backdrop-blur-lg border border-white/20 rounded-lg p-3 shadow-lg">
                <p className="text-sm text-white/90 font-medium">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                        {entry.name}: {formatter ? formatter(entry.value) : entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

interface ChartCardProps {
    title: string;
    children: React.ReactNode;
    className?: string;
}

function ChartCard({ title, children, className }: ChartCardProps) {
    return (
        <Card className={`bg-card/75 backdrop-blur-lg border border-white/10 ${className}`}>
            <CardHeader>
                <CardTitle className="text-white/90">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {children}
            </CardContent>
        </Card>
    );
}

// Colors for charts
const COLORS = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // yellow
    '#ef4444', // red
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // orange
    '#ec4899', // pink
    '#6b7280'  // gray
];

interface AreaChartComponentProps {
    title: string;
    data: any[];
    xKey: string;
    yKey: string;
    color?: string;
    height?: number;
    formatter?: (value: any) => string;
}

export function AreaChartComponent({ 
    title, 
    data, 
    xKey, 
    yKey, 
    color = COLORS[0], 
    height = 300,
    formatter 
}: AreaChartComponentProps) {
    return (
        <ChartCard title={title}>
            <ResponsiveContainer width="100%" height={height}>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id={`gradient-${yKey}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                        dataKey={xKey} 
                        stroke="rgba(255,255,255,0.5)"
                        fontSize={12}
                    />
                    <YAxis 
                        stroke="rgba(255,255,255,0.5)"
                        fontSize={12}
                    />
                    <Tooltip content={<CustomTooltip formatter={formatter} />} />
                    <Area
                        type="monotone"
                        dataKey={yKey}
                        stroke={color}
                        fill={`url(#gradient-${yKey})`}
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </ChartCard>
    );
}

interface BarChartComponentProps {
    title: string;
    data: any[];
    xKey: string;
    yKey: string;
    color?: string;
    height?: number;
    formatter?: (value: any) => string;
}

export function BarChartComponent({ 
    title, 
    data, 
    xKey, 
    yKey, 
    color = COLORS[1], 
    height = 300,
    formatter 
}: BarChartComponentProps) {
    return (
        <ChartCard title={title}>
            <ResponsiveContainer width="100%" height={height}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                        dataKey={xKey} 
                        stroke="rgba(255,255,255,0.5)"
                        fontSize={12}
                    />
                    <YAxis 
                        stroke="rgba(255,255,255,0.5)"
                        fontSize={12}
                    />
                    <Tooltip content={<CustomTooltip formatter={formatter} />} />
                    <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </ChartCard>
    );
}

interface PieChartComponentProps {
    title: string;
    data: any[];
    nameKey: string;
    valueKey: string;
    height?: number;
    showLegend?: boolean;
}

export function PieChartComponent({ 
    title, 
    data, 
    nameKey, 
    valueKey, 
    height = 300,
    showLegend = true 
}: PieChartComponentProps) {
    return (
        <ChartCard title={title}>
            <ResponsiveContainer width="100%" height={height}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey={valueKey}
                        nameKey={nameKey}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    {showLegend && (
                        <Legend 
                            wrapperStyle={{ 
                                color: 'rgba(255,255,255,0.8)', 
                                fontSize: '12px' 
                            }} 
                        />
                    )}
                </PieChart>
            </ResponsiveContainer>
        </ChartCard>
    );
}

interface LineChartComponentProps {
    title: string;
    data: any[];
    xKey: string;
    lines: {
        key: string;
        name: string;
        color?: string;
    }[];
    height?: number;
    formatter?: (value: any) => string;
}

export function LineChartComponent({ 
    title, 
    data, 
    xKey, 
    lines, 
    height = 300,
    formatter 
}: LineChartComponentProps) {
    return (
        <ChartCard title={title}>
            <ResponsiveContainer width="100%" height={height}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                        dataKey={xKey} 
                        stroke="rgba(255,255,255,0.5)"
                        fontSize={12}
                    />
                    <YAxis 
                        stroke="rgba(255,255,255,0.5)"
                        fontSize={12}
                    />
                    <Tooltip content={<CustomTooltip formatter={formatter} />} />
                    <Legend 
                        wrapperStyle={{ 
                            color: 'rgba(255,255,255,0.8)', 
                            fontSize: '12px' 
                        }} 
                    />
                    {lines.map((line, index) => (
                        <Line
                            key={line.key}
                            type="monotone"
                            dataKey={line.key}
                            stroke={line.color || COLORS[index % COLORS.length]}
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            name={line.name}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </ChartCard>
    );
} 