'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/lib/hooks/useUser';
import { 
  Users, 
  Settings, 
  Shield, 
  UserPlus, 
  Globe, 
  Crown,
  BarChart3,
  MessageSquare,
  Link as LinkIcon,
  KeyRound,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

interface AdminStats {
  totalMembers: number;
  pendingInvites: number;
  clanRelationships: number;
  recentPosts: number;
}

const AdminDashboard = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userClan, setUserClan] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats>({
    totalMembers: 0,
    pendingInvites: 0,
    clanRelationships: 0,
    recentPosts: 0
  });
  const [loading, setLoading] = useState(true);

  const supabase = createClient();
  const { user } = useUser();

  useEffect(() => {
    fetchUserProfile();
  }, [user, fetchUserProfile]);

  useEffect(() => {
    if (userRole && ['admin', 'leader', 'coLeader', 'elder'].includes(userRole)) {
      fetchAdminStats();
    }
  }, [userRole, userClan, fetchAdminStats]);

  const fetchUserProfile = useCallback(async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, clan_tag')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserRole(profile.role);
        setUserClan(profile.clan_tag);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  const fetchAdminStats = useCallback(async () => {
    if (!userClan) return;

    try {
      // Get clan member count
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('clan_tag', userClan);

      // Get pending invites (if you have this feature)
      // const { data: invites } = await supabase
      //   .from('invites')
      //   .select('id')
      //   .eq('status', 'pending');

      // Get clan relationships
      const { data: relationships } = await supabase
        .from('clan_relationships')
        .select('id')
        .or(`clan_tag_1.eq.${userClan},clan_tag_2.eq.${userClan}`)
        .eq('is_active', true);

      // Get recent posts (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: posts } = await supabase
        .from('posts')
        .select('id')
        .eq('clan_tag', userClan)
        .gte('created_at', sevenDaysAgo.toISOString());

      setStats({
        totalMembers: profiles?.length || 0,
        pendingInvites: 0, // invites?.length || 0,
        clanRelationships: relationships?.length || 0,
        recentPosts: posts?.length || 0
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  }, [userClan, supabase]);

  const canAccess = userRole && ['admin', 'leader', 'coLeader', 'elder'].includes(userRole);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Access Required</h2>
            <p className="text-muted-foreground">Please log in to access the admin dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-2xl font-bold mb-2">Admin Access Required</h2>
            <p className="text-muted-foreground">
              Only clan leaders, co-leaders, and admins can access this dashboard.
            </p>
            <Badge variant="outline" className="mt-4 capitalize">
              Current Role: {userRole || 'Member'}
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  const adminCards = [
    {
      title: 'Sister Clan Relationships',
      description: 'Manage allied, sister, and feeder clan relationships',
      icon: LinkIcon,
      href: '/dashboard/admin/clan-relationships',
      stat: stats.clanRelationships,
      statLabel: 'relationships',
      variant: 'default' as const
    },
    {
      title: 'Invite Codes',
      description: 'Generate and manage invite codes',
      icon: KeyRound,
      href: '/dashboard/admin/invites',
      stat: null,
      statLabel: '',
      variant: 'default' as const
    },
    {
      title: 'Member Management',
      description: 'View and manage members, linked Clash accounts, and roles',
      icon: Users,
      href: '/dashboard/admin/members',
      stat: stats.totalMembers,
      statLabel: 'members',
      variant: 'default' as const
    },
    {
      title: 'Member Invites',
      description: 'View and manage member recruitment',
      icon: UserPlus,
      href: '/dashboard/members', // Regular clan member management
      stat: stats.totalMembers,
      statLabel: 'members',
      variant: 'default' as const
    },
    {
      title: 'Content Moderation',
      description: 'Review posts, comments, and moderate content',
      icon: MessageSquare,
      href: '/dashboard/admin/moderation',
      stat: stats.recentPosts,
      statLabel: 'recent posts',
      variant: 'default' as const,
      comingSoon: true
    },
    {
      title: 'Clan Profile',
      description: 'Edit clan information, description, and settings',
      icon: Crown,
      href: '/dashboard/admin/clan-profile',
      stat: null,
      statLabel: '',
      variant: 'default' as const,
      comingSoon: true
    },
    {
      title: 'Analytics',
      description: 'View clan activity, member engagement, and statistics',
      icon: BarChart3,
      href: '/dashboard/admin/analytics',
      stat: null,
      statLabel: '',
      variant: 'default' as const,
      comingSoon: true
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Badge variant="outline" className="capitalize">
            {userRole}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Manage your clan settings, members, and relationships from this central hub.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Members</p>
                <p className="text-2xl font-bold">{stats.totalMembers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Allied Clans</p>
                <p className="text-2xl font-bold">{stats.clanRelationships}</p>
              </div>
                              <LinkIcon className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recent Posts</p>
                <p className="text-2xl font-bold">{stats.recentPosts}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Invites</p>
                <p className="text-2xl font-bold">{stats.pendingInvites}</p>
              </div>
              <UserPlus className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Functions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {adminCards.map((card) => (
          <Card key={card.title} className="relative overflow-hidden">
            {card.comingSoon && (
              <div className="absolute top-4 right-4">
                <Badge variant="secondary" className="text-xs">
                  Coming Soon
                </Badge>
              </div>
            )}
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-lg">
                <card.icon className="h-5 w-5" />
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {card.description}
              </p>
              {card.stat !== null && (
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold">{card.stat}</span>
                  <span className="text-sm text-muted-foreground">{card.statLabel}</span>
                </div>
              )}
                             {card.comingSoon ? (
                 <Button 
                   variant="secondary" 
                   className="w-full"
                   disabled={true}
                 >
                   Coming Soon
                 </Button>
               ) : (
                 <Link href={card.href}>
                   <Button 
                     variant="default" 
                     className="w-full"
                   >
                     Manage
                     <ChevronRight className="h-4 w-4 ml-2" />
                   </Button>
                 </Link>
               )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
                         <Link href="/dashboard/admin/clan-relationships">
               <Button variant="outline" className="w-full justify-start">
                 <LinkIcon className="h-4 w-4 mr-2" />
                 Add Sister Clan
               </Button>
             </Link>
            <Link href="/dashboard/admin/members">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Manage Members
              </Button>
            </Link>
            <Link href="/dashboard/clan-feed">
              <Button variant="outline" className="w-full justify-start">
                <Globe className="h-4 w-4 mr-2" />
                View Clan Feed
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Super Admin Section - Only for platform admins */}
      {userRole === 'admin' && (
        <div className="mt-12 border-t pt-8">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Crown className="h-6 w-6 text-yellow-500" />
              <h2 className="text-2xl font-bold">Platform Administration</h2>
              <Badge variant="destructive">Restricted Access</Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              These features are only available to platform administrators and affect the entire application.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-yellow-200 dark:border-yellow-800">
              <CardContent className="py-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                    <UserPlus className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Invite Code Generation</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Generate and manage platform invite codes for new user registration.
                    </p>
                    <Link href="/dashboard/admin/invites">
                      <Button size="sm" variant="outline" className="border-yellow-200 text-yellow-700 hover:bg-yellow-50">
                        Manage Codes
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200 dark:border-red-800">
              <CardContent className="py-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                    <Settings className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">System Administration</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Advanced system settings, user management, and platform configuration.
                    </p>
                    <Button size="sm" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" disabled>
                      Coming Soon
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard; 