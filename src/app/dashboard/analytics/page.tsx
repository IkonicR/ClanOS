'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewDashboard } from '@/components/analytics/overview-dashboard';
import { MemberAnalytics } from '@/components/analytics/member-analytics';
import { WarAnalytics } from '@/components/analytics/war-analytics';
import { CapitalAnalytics } from '@/components/analytics/capital-analytics';
import { InsightsDashboard } from '@/components/analytics/insights-dashboard';
import { 
  BarChart3, 
  Users, 
  Swords, 
  RefreshCw,
  TrendingUp,
  Trophy,
  Target,
  Brain
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from '@/components/analytics/analytics-cards';
import { ExportButton } from '@/components/analytics/export-button';
import { LiveAnalytics } from '@/components/analytics/live-analytics';

interface QuickStats {
    totalMembers: number;
    avgTrophies: number;
    totalDonations: number;
    warWinRate: number;
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Data states
  const [overviewData, setOverviewData] = useState<any>(null);
  const [memberData, setMemberData] = useState<any>(null);
  const [warData, setWarData] = useState<any>(null);
  const [capitalData, setCapitalData] = useState<any>(null);
  const [insightsData, setInsightsData] = useState<any>(null);
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  
  // Loading states
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [memberLoading, setMemberLoading] = useState(true);
  const [warLoading, setWarLoading] = useState(true);
  const [capitalLoading, setCapitalLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(true);
  
  // Error states
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [warError, setWarError] = useState<string | null>(null);
  const [capitalError, setCapitalError] = useState<string | null>(null);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  const fetchOverviewData = async () => {
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const response = await fetch('/api/analytics/overview');
      if (!response.ok) throw new Error('Failed to fetch overview data');
      const data = await response.json();
      setOverviewData(data);
      
      // Update quick stats
      if (data.clanMetrics && data.memberPerformance) {
        setQuickStats({
          totalMembers: data.clanMetrics.totalMembers,
          avgTrophies: Math.round(data.memberPerformance.averageTrophies),
          totalDonations: data.clanMetrics.totalDonations,
          warWinRate: data.warStats?.winRate || 0
        });
      }
    } catch (error) {
      setOverviewError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setOverviewLoading(false);
    }
  };

  const fetchMemberData = async () => {
    setMemberLoading(true);
    setMemberError(null);
    try {
      const response = await fetch('/api/analytics/members');
      if (!response.ok) throw new Error('Failed to fetch member data');
      const data = await response.json();
      setMemberData(data);
    } catch (error) {
      setMemberError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setMemberLoading(false);
    }
  };

  const fetchWarData = async () => {
    setWarLoading(true);
    setWarError(null);
    try {
      const response = await fetch('/api/analytics/wars');
      if (!response.ok) throw new Error('Failed to fetch war data');
      const data = await response.json();
      setWarData(data);
    } catch (error) {
      setWarError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setWarLoading(false);
    }
  };

  const fetchCapitalData = async () => {
    setCapitalLoading(true);
    setCapitalError(null);
    try {
      const response = await fetch('/api/analytics/capital');
      if (!response.ok) throw new Error('Failed to fetch capital data');
      const data = await response.json();
      setCapitalData(data);
    } catch (error) {
      setCapitalError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setCapitalLoading(false);
    }
  };

  const fetchInsightsData = async () => {
    setInsightsLoading(true);
    setInsightsError(null);
    try {
      const response = await fetch('/api/analytics/insights');
      if (!response.ok) throw new Error('Failed to fetch insights data');
      const data = await response.json();
      setInsightsData(data);
    } catch (error) {
      setInsightsError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setInsightsLoading(false);
    }
  };

  const refreshAllData = async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchOverviewData(),
      fetchMemberData(),
      fetchWarData(),
      fetchCapitalData(),
      fetchInsightsData()
    ]);
    setLastUpdated(new Date());
    setIsRefreshing(false);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Fetch data for the selected tab if not already loaded
    switch (tab) {
      case 'overview':
        if (!overviewData && !overviewLoading) fetchOverviewData();
        break;
      case 'members':
        if (!memberData && !memberLoading) fetchMemberData();
        break;
      case 'wars':
        if (!warData && !warLoading) fetchWarData();
        break;
      case 'capital':
        if (!capitalData && !capitalLoading) fetchCapitalData();
        break;
      case 'insights':
        if (!insightsData && !insightsLoading) fetchInsightsData();
        break;
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchOverviewData();
    fetchInsightsData(); // Load insights by default for quick stats
    setLastUpdated(new Date());
  }, []);

  if (isRefreshing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <Button variant="outline" disabled>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Refreshing...
          </Button>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-card/75 backdrop-blur-lg">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-8 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-card/75 backdrop-blur-lg rounded-xl flex flex-col items-center justify-center p-16 text-center">
          <div className="p-6 bg-primary/10 rounded-full mb-4">
            <BarChart3 className="h-12 w-12 text-primary animate-pulse" />
          </div>
          <h3 className="text-2xl font-bold tracking-tight mb-2">Refreshing Analytics...</h3>
          <p className="text-muted-foreground max-w-md">
            Fetching your clan&apos;s performance data and generating insights...
          </p>
        </div>
      </div>
    );
  }

  if (!overviewData && !memberData && !warData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <Button variant="outline" onClick={refreshAllData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
        
        <div className="bg-card/75 backdrop-blur-lg rounded-xl flex flex-col items-center justify-center p-16 text-center">
          <div className="p-6 bg-destructive/10 rounded-full mb-4">
            <BarChart3 className="h-12 w-12 text-destructive" />
          </div>
          <h3 className="text-2xl font-bold tracking-tight mb-2">Unable to Load Analytics</h3>
          <p className="text-muted-foreground max-w-md mb-4">
            There was an issue loading your clan&apos;s analytics data. Please make sure you&apos;re in a clan and try again.
          </p>
          <Button onClick={refreshAllData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Comprehensive insights into your clan&apos;s performance
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          {lastUpdated && (
            <div className="text-xs sm:text-sm text-muted-foreground order-last sm:order-first">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
          <div className="flex items-center gap-2 sm:gap-3">
            <ExportButton 
              type={activeTab as 'overview' | 'members' | 'wars' | 'capital' | 'insights'} 
              disabled={isRefreshing}
            />
            <Button variant="outline" onClick={refreshAllData} disabled={isRefreshing} className="flex-shrink-0">
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''} sm:mr-2`} />
              <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh All'}</span>
              <span className="sm:hidden">{isRefreshing ? 'Refresh...' : 'Refresh'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {quickStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Members"
            value={quickStats.totalMembers}
            icon={<Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
            change={{
              value: Math.round((quickStats.totalMembers / 50) * 100),
              type: 'increase',
              period: 'capacity'
            }}
          />
          <MetricCard
            title="Average Trophies"
            value={quickStats.avgTrophies}
            icon={<TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
            change={{
              value: quickStats.avgTrophies > 3000 ? 15 : -5,
              type: quickStats.avgTrophies > 3000 ? 'increase' : 'decrease',
              period: 'vs. benchmark'
            }}
          />
          <MetricCard
            title="Total Donations"
            value={quickStats.totalDonations}
            icon={<TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
            change={{
              value: Math.round(quickStats.totalDonations / quickStats.totalMembers),
              type: 'increase',
              period: 'per member'
            }}
          />
          <MetricCard
            title="War Win Rate"
            value={quickStats.warWinRate}
            icon={<Swords className="h-4 w-4 text-red-600 dark:text-red-400" />}
            suffix="%"
            change={{
              value: quickStats.warWinRate > 70 ? 10 : -5,
              type: quickStats.warWinRate > 70 ? 'increase' : 'decrease',
              period: 'vs. benchmark'
            }}
          />
        </div>
      )}

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Members</span>
          </TabsTrigger>
          <TabsTrigger value="wars" className="flex items-center space-x-2">
            <Swords className="h-4 w-4" />
            <span className="hidden sm:inline">Wars</span>
          </TabsTrigger>
          <TabsTrigger value="capital" className="flex items-center space-x-2">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Capital</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">Insights</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {overviewLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="bg-card/75 backdrop-blur-lg">
                    <CardHeader className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent className="animate-pulse">
                      <div className="h-8 bg-muted rounded w-3/4"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : overviewError ? (
            <Card className="bg-card/75 backdrop-blur-lg border-destructive/20">
              <CardContent className="flex items-center justify-center p-8">
                <div className="text-center">
                  <p className="text-destructive mb-4">Error loading overview data: {overviewError}</p>
                  <Button onClick={fetchOverviewData} variant="outline">
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : overviewData ? (
            <OverviewDashboard data={overviewData} />
          ) : null}
        </TabsContent>

        <TabsContent value="members">
          {memberLoading ? (
            <div className="space-y-6">
              <Card className="bg-card/75 backdrop-blur-lg">
                <CardHeader className="animate-pulse">
                  <div className="h-6 bg-muted rounded w-1/3"></div>
                </CardHeader>
                <CardContent className="animate-pulse space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted rounded"></div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ) : memberError ? (
            <Card className="bg-card/75 backdrop-blur-lg border-destructive/20">
              <CardContent className="flex items-center justify-center p-8">
                <div className="text-center">
                  <p className="text-destructive mb-4">Error loading member data: {memberError}</p>
                  <Button onClick={fetchMemberData} variant="outline">
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : memberData ? (
            <MemberAnalytics data={memberData} />
          ) : (
            <Card className="bg-card/75 backdrop-blur-lg">
              <CardContent className="flex items-center justify-center p-8">
                <Button onClick={fetchMemberData} variant="outline">
                  Load Member Analytics
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="wars">
          {warLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="bg-card/75 backdrop-blur-lg">
                    <CardHeader className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent className="animate-pulse">
                      <div className="h-48 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : warError ? (
            <Card className="bg-card/75 backdrop-blur-lg border-destructive/20">
              <CardContent className="flex items-center justify-center p-8">
                <div className="text-center">
                  <p className="text-destructive mb-4">Error loading war data: {warError}</p>
                  <Button onClick={fetchWarData} variant="outline">
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : warData ? (
            <WarAnalytics data={warData} isLoading={warLoading} onRefresh={fetchWarData} />
          ) : (
            <Card className="bg-card/75 backdrop-blur-lg">
              <CardContent className="flex items-center justify-center p-8">
                <Button onClick={fetchWarData} variant="outline">
                  Load War Analytics
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="capital">
          {capitalLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="bg-card/75 backdrop-blur-lg">
                    <CardHeader className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent className="animate-pulse">
                      <div className="h-48 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : capitalError ? (
            <Card className="bg-card/75 backdrop-blur-lg border-destructive/20">
              <CardContent className="flex items-center justify-center p-8">
                <div className="text-center">
                  <p className="text-destructive mb-4">Error loading capital data: {capitalError}</p>
                  <Button onClick={fetchCapitalData} variant="outline">
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : capitalData ? (
            <CapitalAnalytics data={capitalData} isLoading={capitalLoading} onRefresh={fetchCapitalData} />
          ) : (
            <Card className="bg-card/75 backdrop-blur-lg">
              <CardContent className="flex items-center justify-center p-8">
                <Button onClick={fetchCapitalData} variant="outline">
                  Load Capital Analytics
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="insights">
          {insightsLoading ? (
            <div className="space-y-6">
              <Card className="bg-card/75 backdrop-blur-lg">
                <CardHeader className="animate-pulse">
                  <div className="h-6 bg-muted rounded w-1/3"></div>
                </CardHeader>
                <CardContent className="animate-pulse space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-24 bg-muted rounded"></div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ) : insightsError ? (
            <Card className="bg-card/75 backdrop-blur-lg border-destructive/20">
              <CardContent className="flex items-center justify-center p-8">
                <div className="text-center">
                  <p className="text-destructive mb-4">Error loading insights data: {insightsError}</p>
                  <Button onClick={fetchInsightsData} variant="outline">
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : insightsData ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <InsightsDashboard data={insightsData} />
              </div>
              <div>
                <LiveAnalytics clanTag={quickStats ? 'clan-tag' : undefined} onDataUpdate={fetchOverviewData} />
              </div>
            </div>
          ) : (
            <Card className="bg-card/75 backdrop-blur-lg">
              <CardContent className="flex items-center justify-center p-8">
                <Button onClick={fetchInsightsData} variant="outline">
                  Load AI Insights
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 