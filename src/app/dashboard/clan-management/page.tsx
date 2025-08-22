'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Shield,
  Users,
  Settings,
  UserPlus,
  Crown,
  AlertTriangle,
  TrendingUp,
  Target,
  Bell
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ClanManagementPage() {
  const [clanData, setClanData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const supabase = createClient();

  useEffect(() => {
    const fetchClanData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('clan_tag, role')
          .eq('id', user.id)
          .single();

        if (!profile?.clan_tag) return;

        // Mock data for now - replace with actual API call
        setClanData({
          name: 'Sample Clan',
          tag: profile.clan_tag,
          members: 45,
          pendingRequests: 3,
          settings: {
            requiredTrophies: 2000,
            requiredTownhall: 12,
            warFrequency: 'always'
          }
        });
      } catch (error) {
        console.error('Error fetching clan data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClanData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 w-3/4 rounded-md bg-muted" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-4 w-full rounded-md bg-muted" />
                <div className="h-4 w-5/6 rounded-md bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clan Management</h1>
          <p className="text-muted-foreground">Manage your clan settings, members, and operations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </Button>
          <Button>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clanData?.members || 0}/50</div>
            <Progress value={((clanData?.members || 0) / 50) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Join Requests</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clanData?.pendingRequests || 0}</div>
            <p className="text-xs text-muted-foreground">Pending approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requirements</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">TH{clanData?.settings?.requiredTownhall || 0}</div>
            <p className="text-xs text-muted-foreground">{clanData?.settings?.requiredTrophies || 0}+ trophies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">War Frequency</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium capitalize">{clanData?.settings?.warFrequency || 'Unknown'}</div>
            <p className="text-xs text-muted-foreground">Active participation</p>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Member Management</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="requests">Join Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Management Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Members
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Crown className="w-4 h-4 mr-2" />
                  Manage Roles
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  View Reports
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Clan Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Clan Level</span>
                  <Badge variant="outline">15</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">War League</span>
                  <Badge variant="secondary">Crystal League</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Clan Points</span>
                  <Badge variant="default">45,231</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Member Management</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
              <Crown className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Advanced Member Management</h3>
              <p className="text-muted-foreground mb-4">
                Bulk actions, role management, and member analytics coming soon.
              </p>
              <Button>View All Members</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clan Settings</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
              <Settings className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Clan Configuration</h3>
              <p className="text-muted-foreground mb-4">
                Requirements, rules, and preferences management.
              </p>
              <Button>Configure Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Join Requests</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
              <UserPlus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Join Request Management</h3>
              <p className="text-muted-foreground mb-4">
                Review and approve new member applications.
              </p>
              <Button>View Requests ({clanData?.pendingRequests || 0})</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 