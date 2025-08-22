'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewDashboard } from '@/components/analytics/overview-dashboard';
import { MemberAnalytics } from '@/components/analytics/member-analytics';
import { WarAnalytics } from '@/components/analytics/war-analytics';
import { CapitalAnalytics } from '@/components/analytics/capital-analytics';
import { InsightsDashboard } from '@/components/analytics/insights-dashboard';
import { SelectionDashboard } from '@/components/analytics/selection-dashboard';
import { AttendanceDashboard } from '@/components/analytics/attendance-dashboard';
import { TargetsDashboard } from '@/components/analytics/targets-dashboard';
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
  const [selectionData, setSelectionData] = useState<any>(null);
  const [selectionLoading, setSelectionLoading] = useState(false);
  const [selectionError, setSelectionError] = useState<string|null>(null);
  const [teamSize, setTeamSize] = useState(15);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string|null>(null);
  const [attendanceDays, setAttendanceDays] = useState(60);
  const [targetsData, setTargetsData] = useState<any>(null);
  const [targetsLoading, setTargetsLoading] = useState(false);
  const [targetsError, setTargetsError] = useState<string|null>(null);
  
  // Loading states
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [memberLoading, setMemberLoading] = useState(true);
  const [warLoading, setWarLoading] = useState(true);
  const [capitalLoading, setCapitalLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(true);

  // Retry states
  const [overviewRetrying, setOverviewRetrying] = useState(false);
  const [memberRetrying, setMemberRetrying] = useState(false);
  const [warRetrying, setWarRetrying] = useState(false);
  
  // Error states
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [warError, setWarError] = useState<string | null>(null);
  const [capitalError, setCapitalError] = useState<string | null>(null);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  const fetchOverviewData = async (retryCount = 0) => {
    const maxRetries = 2;
    if (retryCount > 0) {
      setOverviewRetrying(true);
    } else {
      setOverviewLoading(true);
    }
    setOverviewError(null);
    try {
      const response = await fetch('/api/analytics/overview');
      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 404 && errorText.includes('clan')) {
          throw new Error('No clan linked - please link your clan in settings');
        }
        throw new Error(`Failed to fetch overview data (${response.status})`);
      }
      const data = await response.json();
      setOverviewData(data);

      // Update quick stats
      if (data.clanInfo && data.overview) {
        setQuickStats({
          totalMembers: data.overview.totalMembers,
          avgTrophies: data.overview.avgTrophies,
          totalDonations: data.overview.totalDonations,
          warWinRate: data.overview.winRate || 0
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      console.error('Overview data fetch error:', errorMessage);

      // Auto-retry for network errors, but not for clan-related errors
      if (retryCount < maxRetries && !errorMessage.includes('clan')) {
        console.log(`Retrying overview data fetch (${retryCount + 1}/${maxRetries})...`);
        setTimeout(() => fetchOverviewData(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }

      setOverviewError(errorMessage);
    } finally {
      setOverviewLoading(false);
      setOverviewRetrying(false);
    }
  };

  const fetchMemberData = async (retryCount = 0) => {
    const maxRetries = 2;
    if (retryCount > 0) {
      setMemberRetrying(true);
    } else {
      setMemberLoading(true);
    }
    setMemberError(null);
    try {
      const response = await fetch('/api/analytics/members');
      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 404 && errorText.includes('clan')) {
          throw new Error('No clan linked - please link your clan in settings');
        }
        throw new Error(`Failed to fetch member data (${response.status})`);
      }
      const data = await response.json();
      setMemberData(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      console.error('Member data fetch error:', errorMessage);

      // Auto-retry for network errors, but not for clan-related errors
      if (retryCount < maxRetries && !errorMessage.includes('clan')) {
        console.log(`Retrying member data fetch (${retryCount + 1}/${maxRetries})...`);
        setTimeout(() => fetchMemberData(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }

      setMemberError(errorMessage);
    } finally {
      setMemberLoading(false);
      setMemberRetrying(false);
    }
  };

  const fetchWarData = async (retryCount = 0) => {
    const maxRetries = 2;
    if (retryCount > 0) {
      setWarRetrying(true);
    } else {
      setWarLoading(true);
    }
    setWarError(null);
    try {
      const response = await fetch('/api/analytics/wars');
      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 404 && errorText.includes('clan')) {
          throw new Error('No clan linked - please link your clan in settings');
        }
        throw new Error(`Failed to fetch war data (${response.status})`);
      }
      const data = await response.json();
      setWarData(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      console.error('War data fetch error:', errorMessage);

      // Auto-retry for network errors, but not for clan-related errors
      if (retryCount < maxRetries && !errorMessage.includes('clan')) {
        console.log(`Retrying war data fetch (${retryCount + 1}/${maxRetries})...`);
        setTimeout(() => fetchWarData(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }

      setWarError(errorMessage);
    } finally {
      setWarLoading(false);
      setWarRetrying(false);
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

  const fetchSelectionData = async () => {
    setSelectionLoading(true);
    setSelectionError(null);
    try {
      const response = await fetch(`/api/analytics/selection?teamSize=${teamSize}`);
      if (!response.ok) throw new Error('Failed to fetch selection');
      const data = await response.json();
      setSelectionData(data);
    } catch (e:any) {
      setSelectionError(e?.message || 'Error fetching selection');
    } finally {
      setSelectionLoading(false);
    }
  };

  const fetchAttendanceData = async () => {
    setAttendanceLoading(true);
    setAttendanceError(null);
    try {
      const response = await fetch(`/api/analytics/attendance?days=${attendanceDays}`);
      if (!response.ok) throw new Error('Failed to fetch attendance');
      const data = await response.json();
      setAttendanceData(data);
    } catch (e:any) {
      setAttendanceError(e?.message || 'Error fetching attendance');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const fetchTargetsData = async () => {
    setTargetsLoading(true);
    setTargetsError(null);
    try {
      const response = await fetch(`/api/analytics/targets`);
      if (!response.ok) throw new Error('Failed to fetch targets');
      const data = await response.json();
      setTargetsData(data);
    } catch (e:any) {
      setTargetsError(e?.message || 'Error fetching targets');
    } finally {
      setTargetsLoading(false);
    }
  };

  const refreshAllData = async () => {
    setIsRefreshing(true);
    // Reset all error states before retrying
    setOverviewError(null);
    setMemberError(null);
    setWarError(null);
    setCapitalError(null);
    setInsightsError(null);

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
    // Data is preloaded, just switch tabs instantly
    // Only fetch dynamic data (selection, attendance, targets) on demand
    switch (tab) {
      case 'selection':
        if (!selectionData && !selectionLoading) fetchSelectionData();
        break;
      case 'attendance':
        if (!attendanceData && !attendanceLoading) fetchAttendanceData();
        break;
      case 'targets':
        if (!targetsData && !targetsLoading) fetchTargetsData();
        break;
    }
  };

  // Initial data fetch - preload all analytics data for instant tab switching
  useEffect(() => {
    const preloadAllData = async () => {
      setLastUpdated(new Date());
      // Fetch all data in parallel for instant tab switching
      await Promise.allSettled([
        fetchOverviewData(),
        fetchMemberData(),
        fetchWarData(),
        fetchCapitalData(),
        fetchInsightsData()
      ]);
    };

    preloadAllData();
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

  // Improved error handling - only show error if all data sources fail AND we're not loading
  const allDataFailed = !overviewLoading && !memberLoading && !warLoading &&
                       !overviewData && !memberData && !warData &&
                       (overviewError || memberError || warError);

  if (allDataFailed) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <Button variant="outline" onClick={refreshAllData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry All
          </Button>
        </div>

        <div className="bg-card/75 backdrop-blur-lg rounded-xl flex flex-col items-center justify-center p-16 text-center">
          <div className="p-6 bg-destructive/10 rounded-full mb-4">
            <BarChart3 className="h-12 w-12 text-destructive" />
          </div>
          <h3 className="text-2xl font-bold tracking-tight mb-2">Unable to Load Analytics</h3>
          <p className="text-muted-foreground max-w-md mb-4">
            {overviewError && <div>Overview: {overviewError}</div>}
            {memberError && <div>Members: {memberError}</div>}
            {warError && <div>Wars: {warError}</div>}
            <br />
            Please check your clan connection and try again.
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
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Comprehensive insights into your clan's performance</p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            type={activeTab as 'overview' | 'members' | 'wars' | 'capital' | 'insights'}
            disabled={isRefreshing || overviewRetrying || memberRetrying || warRetrying}
          />
          <Button variant="outline" onClick={refreshAllData} disabled={isRefreshing || overviewRetrying || memberRetrying || warRetrying}>
            <RefreshCw className={`w-4 h-4 mr-2 ${(isRefreshing || overviewRetrying || memberRetrying || warRetrying) ? 'animate-spin' : ''}`} />
            {(overviewRetrying || memberRetrying || warRetrying) ? 'Retrying...' : isRefreshing ? 'Refreshing...' : 'Refresh All'}
          </Button>
          {(overviewRetrying || memberRetrying || warRetrying) && (
            <div className="flex items-center text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></div>
              Auto-retrying failed requests...
            </div>
          )}
        </div>
      </div>

      {lastUpdated && (
        <div className="text-sm text-muted-foreground">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}

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
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid grid-cols-4 lg:grid-cols-8 w-full">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Members</span>
          </TabsTrigger>
          <TabsTrigger value="wars" className="flex items-center gap-2">
            <Swords className="h-4 w-4" />
            <span>Wars</span>
          </TabsTrigger>
          <TabsTrigger value="capital" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            <span>Capital</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            <span>Insights</span>
          </TabsTrigger>
          <TabsTrigger value="selection" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span>Selection</span>
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Attendance</span>
          </TabsTrigger>
          <TabsTrigger value="targets" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span>Targets</span>
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

        <TabsContent value="selection">
          {selectionLoading ? (
            <div className="space-y-6">
              <Card className="bg-card/75 backdrop-blur-lg">
                <CardHeader className="animate-pulse">
                  <div className="h-6 bg-muted rounded w-1/3"></div>
                </CardHeader>
                <CardContent className="animate-pulse space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-14 bg-muted rounded"></div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ) : selectionError ? (
            <Card className="bg-card/75 backdrop-blur-lg border-destructive/20">
              <CardContent className="flex items-center justify-center p-8">
                <div className="text-center">
                  <p className="text-destructive mb-4">Error loading selection: {selectionError}</p>
                  <Button onClick={fetchSelectionData} variant="outline">Try Again</Button>
                </div>
              </CardContent>
            </Card>
          ) : selectionData ? (
            <SelectionDashboard data={selectionData} teamSize={teamSize} setTeamSize={(n)=>{ setTeamSize(n); fetchSelectionData(); }} onRefresh={fetchSelectionData} />
          ) : (
            <Card className="bg-card/75 backdrop-blur-lg">
              <CardContent className="flex items-center justify-center p-8">
                <Button onClick={fetchSelectionData} variant="outline">Load Selection</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="attendance">
          {attendanceLoading ? (
            <div className="space-y-6">
              <Card className="bg-card/75 backdrop-blur-lg">
                <CardHeader className="animate-pulse">
                  <div className="h-6 bg-muted rounded w-1/3"></div>
                </CardHeader>
                <CardContent className="animate-pulse space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-14 bg-muted rounded"></div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ) : attendanceError ? (
            <Card className="bg-card/75 backdrop-blur-lg border-destructive/20">
              <CardContent className="flex items-center justify-center p-8">
                <div className="text-center">
                  <p className="text-destructive mb-4">Error loading attendance: {attendanceError}</p>
                  <Button onClick={fetchAttendanceData} variant="outline">Try Again</Button>
                </div>
              </CardContent>
            </Card>
          ) : attendanceData ? (
            <AttendanceDashboard data={attendanceData} days={attendanceDays} setDays={(n)=>{ setAttendanceDays(n); fetchAttendanceData(); }} onRefresh={fetchAttendanceData} />
          ) : (
            <Card className="bg-card/75 backdrop-blur-lg">
              <CardContent className="flex items-center justify-center p-8">
                <Button onClick={fetchAttendanceData} variant="outline">Load Attendance</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="targets">
          {targetsLoading ? (
            <div className="space-y-6">
              <Card className="bg-card/75 backdrop-blur-lg">
                <CardHeader className="animate-pulse">
                  <div className="h-6 bg-muted rounded w-1/3"></div>
                </CardHeader>
                <CardContent className="animate-pulse space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-14 bg-muted rounded"></div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ) : targetsError ? (
            <Card className="bg-card/75 backdrop-blur-lg border-destructive/20">
              <CardContent className="flex items-center justify-center p-8">
                <div className="text-center">
                  <p className="text-destructive mb-4">Error loading targets: {targetsError}</p>
                  <Button onClick={fetchTargetsData} variant="outline">Try Again</Button>
                </div>
              </CardContent>
            </Card>
          ) : targetsData ? (
            <TargetsDashboard data={targetsData} onRefresh={fetchTargetsData} />
          ) : (
            <Card className="bg-card/75 backdrop-blur-lg">
              <CardContent className="flex items-center justify-center p-8">
                <Button onClick={fetchTargetsData} variant="outline">Load Targets</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 