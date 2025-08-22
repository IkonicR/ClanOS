'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardClient } from '@/app/dashboard/dashboard-client';
import ClanProfilePage from '@/app/dashboard/clan-profile/page';
import ClanFeedPage from '@/app/dashboard/clan-feed/page';
import MembersPage from '@/app/dashboard/members/page';
// WarRoomPage temporarily disabled due to tldraw dependency issue
import ClanManagementPage from '@/app/dashboard/clan-management/page';
import AnalyticsPage from '@/app/dashboard/analytics/page';
import { createClient } from '@/lib/supabase/server';

interface DashboardData {
  clanInfo: any;
  warData: any;
  playerTag: string;
}

export function DashboardTabNavigation() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  // Map pathname to tab
  useEffect(() => {
    const pathMap: Record<string, string> = {
      '/dashboard': 'dashboard',
      '/dashboard/clan-profile': 'clan-profile',
      '/dashboard/clan-feed': 'clan-feed',
      '/dashboard/members': 'members',
      '/dashboard/clan-management': 'clan-management',
      '/dashboard/analytics': 'analytics',
    };

    const matchedTab = pathMap[pathname] || 'dashboard';
    setActiveTab(matchedTab);
  }, [pathname]);

  // Load initial dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard-data');
        if (response.ok) {
          const data = await response.json();
          setDashboardData(data);
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update URL without page reload
    const pathMap: Record<string, string> = {
      'dashboard': '/dashboard',
      'clan-profile': '/dashboard/clan-profile',
      'clan-feed': '/dashboard/clan-feed',
      'members': '/dashboard/members',
      'clan-management': '/dashboard/clan-management',
      'analytics': '/dashboard/analytics',
    };

    router.replace(pathMap[value] || '/dashboard', { scroll: false });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="clan-profile">Profile</TabsTrigger>
          <TabsTrigger value="clan-feed">Feed</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="clan-management">Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          {dashboardData && <DashboardClient data={dashboardData} />}
        </TabsContent>

        <TabsContent value="clan-profile" className="mt-6">
          <ClanProfilePage />
        </TabsContent>

        <TabsContent value="clan-feed" className="mt-6">
          <ClanFeedPage />
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <MembersPage />
        </TabsContent>

        <TabsContent value="clan-management" className="mt-6">
          <ClanManagementPage />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <AnalyticsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
