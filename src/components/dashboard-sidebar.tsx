'use client';

import React, { memo, useMemo, useCallback, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  MessageSquare,
  Shield,
  BarChart3,
  Settings,
  Sword,
  Crown,
  Zap,
  Bell,
  Plus,
  TrendingUp,
  Activity,
  Target,
  Clock,
  Star,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton, SkeletonAvatar, SkeletonText } from '@/components/ui/skeleton';

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, prefetch: true },
  { name: 'Members', href: '/dashboard/members', icon: Users, prefetch: true },
  { name: 'Clan Feed', href: '/dashboard/clan-feed', icon: MessageSquare, prefetch: true },
  { name: 'War Room', href: '/dashboard/war-room', icon: Sword, disabled: true },
  { name: 'Management', href: '/dashboard/clan-management', icon: Shield, prefetch: true },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, prefetch: true },
] as const;

// Context-aware content for different pages
const getContextualContent = (pathname: string, isWarActive: boolean, capitalRaidsActive: boolean, clanInfo?: any) => {
  switch (pathname) {
    case '/dashboard':
      return {
        quickStats: [
          { label: 'Active Wars', value: isWarActive ? '1' : '0', icon: Sword, trend: 'neutral' },
          { label: 'Capital Raids', value: capitalRaidsActive ? 'Active' : 'Inactive', icon: Crown, trend: 'neutral' },
          { label: 'New Posts', value: '12', icon: MessageSquare, trend: 'up' },
        ],
        quickActions: [
          { name: 'Start War', icon: Sword, variant: 'default' as const, disabled: isWarActive },
          { name: 'Post Update', icon: MessageSquare, variant: 'outline' as const },
          { name: 'View Capital', icon: Crown, variant: 'outline' as const },
        ]
      };

    case '/dashboard/members':
      return {
        quickStats: [
          { label: 'Total Members', value: clanInfo?.memberCount?.toString() || '0', icon: Users, trend: 'neutral' },
          { label: 'Active Today', value: '23', icon: Activity, trend: 'up' }, // TODO: Get real active members
          { label: 'Avg. Trophies', value: '2,847', icon: Target, trend: 'up' }, // TODO: Get real avg trophies
        ],
        quickActions: [
          { name: 'Add Member', icon: Plus, variant: 'default' as const },
          { name: 'Bulk Actions', icon: Settings, variant: 'outline' as const },
          { name: 'Export Data', icon: BarChart3, variant: 'outline' as const },
        ]
      };

    case '/dashboard/clan-feed':
      return {
        quickStats: [
          { label: 'Total Posts', value: '127', icon: MessageSquare, trend: 'up' },
          { label: 'Active Users', value: '18', icon: Users, trend: 'neutral' },
          { label: 'Engagement', value: '94%', icon: TrendingUp, trend: 'up' },
        ],
        quickActions: [
          { name: 'Create Post', icon: Plus, variant: 'default' as const },
          { name: 'Filter Posts', icon: Target, variant: 'outline' as const },
          { name: 'Pin Announcement', icon: Star, variant: 'outline' as const },
        ]
      };

    case '/dashboard/clan-management':
      return {
        quickStats: [
          { label: 'Join Requests', value: '3', icon: Clock, trend: 'neutral' },
          { label: 'Requirements', value: 'TH12+', icon: Crown, trend: 'neutral' },
          { label: 'Settings', value: 'Updated', icon: Settings, trend: 'neutral' },
        ],
        quickActions: [
          { name: 'Review Requests', icon: Clock, variant: 'default' as const },
          { name: 'Update Settings', icon: Settings, variant: 'outline' as const },
          { name: 'Manage Roles', icon: Shield, variant: 'outline' as const },
        ]
      };

    case '/dashboard/analytics':
      return {
        quickStats: [
          { label: 'Win Rate', value: '68%', icon: Target, trend: 'up' },
          { label: 'Avg. Trophies', value: '2,847', icon: Star, trend: 'up' },
          { label: 'Donations', value: '1,234', icon: TrendingUp, trend: 'up' },
        ],
        quickActions: [
          { name: 'Generate Report', icon: BarChart3, variant: 'default' as const },
          { name: 'Export Data', icon: Settings, variant: 'outline' as const },
          { name: 'Set Goals', icon: Target, variant: 'outline' as const },
        ]
      };

    default:
      return {
        quickStats: [],
        quickActions: []
      };
  }
};

interface DashboardSidebarProps {
  clanName?: string;
  clanBadge?: string;
  isWarActive?: boolean;
  capitalRaidsActive?: boolean;
  clanInfo?: any;
}

// Memoized Navigation Item Component
const NavigationItem = memo(({ item, isActive, onClick }: {
  item: typeof navigationItems[number],
  isActive: boolean,
  onClick?: () => void
}) => {
  const Icon = item.icon;

  if (item.disabled) {
    return (
      <div className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground/50 cursor-not-allowed">
        <Icon className="w-5 h-5" />
        <span>{item.name}</span>
        <Badge variant="secondary" className="ml-auto text-xs">Soon</Badge>
      </div>
    );
  }

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <Link
      href={item.href}
      prefetch={item.prefetch}
      onClick={handleClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-200 group relative overflow-hidden",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:shadow-sm"
      )}
    >
      <Icon className={cn(
        "w-5 h-5 transition-transform duration-200",
        isActive ? "scale-100" : "group-hover:scale-110"
      )} />
      <span className="relative z-10">{item.name}</span>
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg" />
      )}
    </Link>
  );
});

NavigationItem.displayName = 'NavigationItem';

// Memoized Quick Action Component
const QuickAction = memo(({ action }: { action: any }) => {
  const Icon = action.icon;

  return (
    <Button
      variant={action.variant}
      size="sm"
      disabled={action.disabled}
      className={cn(
        "justify-start h-8 text-xs transition-all duration-200 hover:scale-[1.02] relative overflow-hidden group",
        action.variant === 'default' && "shadow-sm hover:shadow-md"
      )}
    >
      <Icon className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
      {action.name}
      {action.variant === 'default' && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      )}
    </Button>
  );
});

QuickAction.displayName = 'QuickAction';

export const DashboardSidebar = memo(function DashboardSidebar({
  clanName = 'Loading...',
  clanBadge,
  isWarActive = false,
  capitalRaidsActive = false,
  clanInfo
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const contextualContent = useMemo(
    () => getContextualContent(pathname, isWarActive, capitalRaidsActive, clanInfo),
    [pathname, isWarActive, capitalRaidsActive, clanInfo]
  );

  // Loading state
  if (clanName === 'Loading...') {
    return (
      <div className="flex h-full w-64 flex-col bg-card/50 backdrop-blur-sm border-r border-border/50 shadow-lg">
        {/* Loading Clan Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border/50 bg-background/50 backdrop-blur-sm">
          <SkeletonAvatar />
          <div className="flex-1 min-w-0">
            <Skeleton className="h-4 w-32 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>

        {/* Loading Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </nav>

        <Separator />

        {/* Loading Quick Actions */}
        <div className="p-4 space-y-2">
          <Skeleton className="h-3 w-20" />
          <div className="grid grid-cols-1 gap-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex h-full flex-col bg-card/50 backdrop-blur-sm border-r border-border/50 shadow-lg transition-all duration-300",
      "w-64 md:w-56 sm:w-48",
      "md:relative fixed inset-y-0 left-0 z-50 md:z-auto",
      "md:translate-x-0",
      isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      {/* ClanOS Branding - Top Left */}
      <div className="flex items-center gap-3 p-4 border-b border-border/50 bg-background/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">C</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              ClanOS
            </span>
            <span className="text-xs text-muted-foreground -mt-1">Clan Management</span>
          </div>
        </div>
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden absolute -right-12 top-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="shadow-lg"
        >
          {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Current Clan Info */}
      <div className="flex items-center gap-3 p-4 border-b border-border/50 bg-muted/30">
        {clanBadge && (
          <img
            src={clanBadge}
            alt={`${clanName} badge`}
            className="w-10 h-10 rounded-lg shadow-sm transition-transform hover:scale-105"
          />
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold truncate bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            {clanName}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            {isWarActive && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0 animate-pulse">
                <Zap className="w-3 h-3 mr-1" />
                War
              </Badge>
            )}
            {capitalRaidsActive && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-gradient-to-r from-yellow-500 to-orange-500">
                <Crown className="w-3 h-3 mr-1" />
                Capital
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <NavigationItem
              key={item.href}
              item={item}
              isActive={isActive}
              onClick={() => setIsMobileMenuOpen(false)}
            />
          );
        })}
      </nav>

      <Separator />

      {/* Contextual Stats */}
      {contextualContent.quickStats.length > 0 && (
        <div className="p-4 space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Quick Stats
          </h3>
          <div className="space-y-2">
            {contextualContent.quickStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{stat.label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{stat.value}</span>
                    {stat.trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
                    {stat.trend === 'down' && <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Separator />

      {/* Contextual Actions */}
      <div className="p-4 space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 gap-2">
          {contextualContent.quickActions.map((action) => (
            <QuickAction key={action.name} action={action} />
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="p-4 border-t">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </Link>
      </div>
    </div>
  );
});

DashboardSidebar.displayName = 'DashboardSidebar';
