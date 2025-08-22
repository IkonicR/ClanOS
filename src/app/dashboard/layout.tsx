import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { DashboardTopBar } from '@/components/dashboard-top-bar';
import { WorkspaceSwitcher } from '@/components/workspace-switcher';
import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Clock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side guard as a second layer in addition to middleware
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Get user profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get all linked profiles for the user
  let allLinkedProfiles = [];
  let activeLinkedProfile = null;
  try {
    const { data } = await supabase
      .from('linked_profiles')
      .select('*')
      .eq('user_id', user.id);
    allLinkedProfiles = data || [];
    activeLinkedProfile = allLinkedProfiles.find(profile => profile.is_active) || null;
  } catch (error) {
    // Handle case where no linked profiles exist
    allLinkedProfiles = [];
    activeLinkedProfile = null;
  }

  // Use active linked profile data if available
  const currentProfile = activeLinkedProfile || profile;

  // Get all clan data for linked profiles
  let clanInfo = null;
  let availableClans = [];

  // Get active clan info
  if (currentProfile?.clan_tag) {
    const { data: clan } = await supabase
      .from('clans')
      .select('*')
      .eq('tag', currentProfile.clan_tag)
      .single();
    clanInfo = clan;
  }

  // Get all clans for linked profiles
  if (allLinkedProfiles.length > 0) {
    const clanTags = allLinkedProfiles.map(profile => profile.clan_tag).filter(Boolean);
    if (clanTags.length > 0) {
      const { data: clans } = await supabase
        .from('clans')
        .select('*')
        .in('tag', clanTags);
      availableClans = clans || [];
    }
  }

  return (
    <div className="flex h-screen bg-background relative overflow-hidden md:pl-0 pl-0">
      {/* Background Gradient Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5 pointer-events-none" />

      {/* Sidebar */}
      <div className="relative z-10">
        <DashboardSidebar
          clanName={clanInfo?.name || 'Loading Clan...'}
          clanBadge={clanInfo?.badgeUrl}
          isWarActive={false} // TODO: Get from war data
          capitalRaidsActive={false} // TODO: Get from capital data
          clanInfo={clanInfo}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 relative z-10">
        {/* Top Bar with Glassmorphism */}
        <div className="backdrop-blur-sm bg-background/80 border-b border-border/50 shadow-sm">
          <DashboardTopBar
            userName={currentProfile?.in_game_name || profile?.username || user.email}
            userAvatar={currentProfile?.avatar_url}
            userRole={currentProfile?.role || 'user'}
            notificationCount={0} // TODO: Get from notifications
          />
        </div>

        {/* Top Header */}
        <div className="flex items-center px-6 py-3 border-b border-border/50 bg-muted/30 backdrop-blur-sm">
          <WorkspaceSwitcher
            currentClan={clanInfo ? {
              id: clanInfo.tag,
              name: clanInfo.name,
              tag: clanInfo.tag,
              badgeUrl: clanInfo.badgeUrl,
              memberCount: clanInfo.memberCount || 0,
              role: (currentProfile?.role as 'admin' | 'leader' | 'coLeader' | 'elder' | 'member') || 'member'
            } : {
              id: 'loading',
              name: 'Loading Clan...',
              tag: '#LOADING',
              badgeUrl: '',
              memberCount: 0,
              role: 'member' as const
            }}
            availableClans={availableClans.map(clan => {
              // Find the corresponding linked profile to get the role
              const linkedProfile = allLinkedProfiles.find(profile => profile.clan_tag === clan.tag);
              return {
                id: clan.tag,
                name: clan.name,
                tag: clan.tag,
                badgeUrl: clan.badgeUrl,
                memberCount: clan.memberCount || 0,
                role: (linkedProfile?.role as 'admin' | 'leader' | 'coLeader' | 'elder' | 'member') || 'member'
              };
            })}
            userRole={currentProfile?.role}
          />
          <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Online</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>

        {/* Main Content with Enhanced Styling */}
        <main className="flex-1 overflow-auto bg-background/50 backdrop-blur-[1px] relative">
          {/* Subtle grid pattern overlay */}
          <div className="absolute inset-0 bg-grid-small opacity-[0.02] pointer-events-none" />

          <div className="relative z-10 p-6 h-full">
            {/* Page transition wrapper for smooth animations */}
            <div className="transition-all duration-300 ease-in-out">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}