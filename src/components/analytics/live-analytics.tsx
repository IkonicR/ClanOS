'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Zap, Wifi, WifiOff, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";

interface LiveMetric {
    name: string;
    current: number;
    previous: number;
    change: number;
    changeType: 'increase' | 'decrease' | 'stable';
    unit?: string;
    icon?: React.ReactNode;
}

interface LiveUpdate {
    timestamp: string;
    message: string;
    type: 'info' | 'warning' | 'success';
    metric?: string;
}

interface LiveAnalyticsProps {
    clanTag?: string;
    onDataUpdate?: (data: any) => void;
}

export function LiveAnalytics({ clanTag, onDataUpdate }: LiveAnalyticsProps) {
    const [isLive, setIsLive] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [liveMetrics, setLiveMetrics] = useState<LiveMetric[]>([]);
    const [recentUpdates, setRecentUpdates] = useState<LiveUpdate[]>([]);
    const [updateCount, setUpdateCount] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastDataRef = useRef<any>(null);

    const fetchLiveData = async () => {
        if (!clanTag) return;

        try {
            setIsConnected(true);
            const response = await fetch('/api/analytics/overview');
            if (!response.ok) throw new Error('Failed to fetch live data');
            
            const newData = await response.json();
            
            // Compare with previous data to detect changes
            if (lastDataRef.current) {
                const changes = detectChanges(lastDataRef.current, newData);
                if (changes.length > 0) {
                    updateMetricsAndNotifications(changes);
                    setUpdateCount(prev => prev + 1);
                    
                    // Call parent callback if provided
                    if (onDataUpdate) {
                        onDataUpdate(newData);
                    }
                }
            }
            
            lastDataRef.current = newData;
        } catch (error) {
            console.error('Live data fetch error:', error);
            setIsConnected(false);
            addUpdate({
                timestamp: new Date().toISOString(),
                message: 'Connection lost - retrying...',
                type: 'warning'
            });
        }
    };

    const detectChanges = (oldData: any, newData: any): LiveMetric[] => {
        const changes: LiveMetric[] = [];
        
        // Member count changes
        if (oldData.clanMetrics?.totalMembers !== newData.clanMetrics?.totalMembers) {
            const current = newData.clanMetrics?.totalMembers || 0;
            const previous = oldData.clanMetrics?.totalMembers || 0;
            changes.push({
                name: 'Members',
                current,
                previous,
                change: current - previous,
                changeType: current > previous ? 'increase' : 'decrease',
                icon: <Activity className="h-4 w-4" />
            });
        }

        // Trophy changes
        if (oldData.memberPerformance?.averageTrophies !== newData.memberPerformance?.averageTrophies) {
            const current = Math.round(newData.memberPerformance?.averageTrophies || 0);
            const previous = Math.round(oldData.memberPerformance?.averageTrophies || 0);
            changes.push({
                name: 'Avg Trophies',
                current,
                previous,
                change: current - previous,
                changeType: current > previous ? 'increase' : 'decrease',
                icon: <TrendingUp className="h-4 w-4" />
            });
        }

        // Donation changes
        if (oldData.clanMetrics?.totalDonations !== newData.clanMetrics?.totalDonations) {
            const current = newData.clanMetrics?.totalDonations || 0;
            const previous = oldData.clanMetrics?.totalDonations || 0;
            changes.push({
                name: 'Donations',
                current,
                previous,
                change: current - previous,
                changeType: current > previous ? 'increase' : 'decrease',
                icon: <TrendingUp className="h-4 w-4" />
            });
        }

        return changes;
    };

    const updateMetricsAndNotifications = (changes: LiveMetric[]) => {
        setLiveMetrics(prev => {
            const updated = [...prev];
            
            changes.forEach(change => {
                const existingIndex = updated.findIndex(m => m.name === change.name);
                if (existingIndex >= 0) {
                    updated[existingIndex] = change;
                } else {
                    updated.push(change);
                }
            });
            
            // Keep only the most recent 5 metrics
            return updated.slice(-5);
        });

        // Add notifications for significant changes
        changes.forEach(change => {
            let message = '';
            let type: 'info' | 'warning' | 'success' = 'info';

            if (change.name === 'Members') {
                if (change.changeType === 'increase') {
                    message = `New member joined! Total: ${change.current}`;
                    type = 'success';
                } else {
                    message = `Member left. Total: ${change.current}`;
                    type = 'warning';
                }
            } else if (change.name === 'Avg Trophies') {
                if (Math.abs(change.change) > 50) {
                    message = `Average trophies ${change.changeType === 'increase' ? 'increased' : 'decreased'} by ${Math.abs(change.change)}`;
                    type = change.changeType === 'increase' ? 'success' : 'warning';
                }
            } else if (change.name === 'Donations') {
                if (change.change > 100) {
                    message = `Donation activity spike! +${change.change} donations`;
                    type = 'success';
                }
            }

            if (message) {
                addUpdate({
                    timestamp: new Date().toISOString(),
                    message,
                    type,
                    metric: change.name
                });
            }
        });
    };

    const addUpdate = (update: LiveUpdate) => {
        setRecentUpdates(prev => {
            const updated = [update, ...prev];
            return updated.slice(0, 10); // Keep only the 10 most recent updates
        });
    };

    const toggleLive = () => {
        if (isLive) {
            // Stop live updates
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            setIsLive(false);
            setIsConnected(false);
            addUpdate({
                timestamp: new Date().toISOString(),
                message: 'Live updates disabled',
                type: 'info'
            });
        } else {
            // Start live updates
            setIsLive(true);
            fetchLiveData(); // Initial fetch
            
            intervalRef.current = setInterval(() => {
                fetchLiveData();
            }, 30000); // Update every 30 seconds
            
            addUpdate({
                timestamp: new Date().toISOString(),
                message: 'Live updates enabled',
                type: 'success'
            });
        }
    };

    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    const getChangeIcon = (changeType: string) => {
        switch (changeType) {
            case 'increase':
                return <TrendingUp className="h-3 w-3 text-green-500" />;
            case 'decrease':
                return <TrendingDown className="h-3 w-3 text-red-500" />;
            default:
                return <Activity className="h-3 w-3 text-blue-500" />;
        }
    };

    const getUpdateIcon = (type: string) => {
        switch (type) {
            case 'success':
                return '✅';
            case 'warning':
                return '⚠️';
            default:
                return 'ℹ️';
        }
    };

    return (
        <div className="space-y-4">
            {/* Live Controls */}
            <Card className="bg-card/75 backdrop-blur-lg border border-white/10">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center space-x-2">
                            <Zap className="h-5 w-5 text-yellow-500" />
                            <span>Live Analytics</span>
                            {isLive && (
                                <Badge variant={isConnected ? 'default' : 'destructive'} className="ml-2">
                                    {isConnected ? (
                                        <>
                                            <Wifi className="h-3 w-3 mr-1" />
                                            Live
                                        </>
                                    ) : (
                                        <>
                                            <WifiOff className="h-3 w-3 mr-1" />
                                            Reconnecting
                                        </>
                                    )}
                                </Badge>
                            )}
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-muted-foreground">
                                {isLive ? 'On' : 'Off'}
                            </span>
                            <Switch
                                checked={isLive}
                                onCheckedChange={toggleLive}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground">
                        {isLive ? (
                            <>
                                Real-time updates every 30 seconds • {updateCount} updates received
                            </>
                        ) : (
                            'Enable live updates to monitor clan changes in real-time'
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Live Metrics */}
            {liveMetrics.length > 0 && (
                <Card className="bg-card/75 backdrop-blur-lg border border-white/10">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Recent Changes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {liveMetrics.map((metric, index) => (
                                <div key={`${metric.name}-${index}`} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                    <div className="flex items-center space-x-3">
                                        {metric.icon}
                                        <div>
                                            <div className="font-medium text-white">{metric.name}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {metric.previous} → {metric.current}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {getChangeIcon(metric.changeType)}
                                        <span className={`text-sm font-medium ${
                                            metric.changeType === 'increase' ? 'text-green-500' : 
                                            metric.changeType === 'decrease' ? 'text-red-500' : 'text-blue-500'
                                        }`}>
                                            {metric.changeType === 'increase' ? '+' : ''}
                                            {metric.change}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recent Updates */}
            {recentUpdates.length > 0 && (
                <Card className="bg-card/75 backdrop-blur-lg border border-white/10">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Activity Feed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {recentUpdates.map((update, index) => (
                                <Alert key={index} className="py-2">
                                    <AlertDescription className="flex items-center space-x-2">
                                        <span>{getUpdateIcon(update.type)}</span>
                                        <span className="flex-1">{update.message}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(update.timestamp).toLocaleTimeString()}
                                        </span>
                                    </AlertDescription>
                                </Alert>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
} 