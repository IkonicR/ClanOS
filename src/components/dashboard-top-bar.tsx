'use client';

import React, { useState, useEffect } from 'react';
import { Search, Bell, User, Settings, LogOut, ChevronDown, Command, Zap, Crown, MessageSquare, TrendingUp, Clock, Plus, Filter, Star, Target } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useUser } from '@/lib/hooks/useUser';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface DashboardTopBarProps {
  userName?: string;
  userAvatar?: string;
  userRole?: string;
  notificationCount?: number;
}

// Enhanced search with command palette
const searchCommands = [
  { name: 'Create Post', icon: Plus, shortcut: '⌘N', action: () => console.log('Create post') },
  { name: 'Search Members', icon: User, shortcut: '⌘M', action: () => console.log('Search members') },
  { name: 'View Analytics', icon: TrendingUp, shortcut: '⌘A', action: () => console.log('View analytics') },
  { name: 'Open Settings', icon: Settings, shortcut: '⌘,', action: () => console.log('Open settings') },
];

// Context-aware key metrics
const getKeyMetrics = (pathname: string) => {
  switch (pathname) {
    case '/dashboard':
      return [
        { label: 'Donations', value: '1,234', icon: Star, trend: 'up' },
        { label: 'War Status', value: 'Active', icon: Zap, status: 'active' },
        { label: 'New Posts', value: '12', icon: MessageSquare, trend: 'up' },
      ];
    case '/dashboard/members':
      return [
        { label: 'Total Members', value: '45', icon: User, trend: 'neutral' },
        { label: 'Active Today', value: '23', icon: TrendingUp, trend: 'up' },
        { label: 'Avg. Trophies', value: '2,847', icon: Star, trend: 'up' },
      ];
    case '/dashboard/clan-feed':
      return [
        { label: 'Total Posts', value: '127', icon: MessageSquare, trend: 'up' },
        { label: 'Engagement', value: '94%', icon: TrendingUp, trend: 'up' },
        { label: 'Active Users', value: '18', icon: User, trend: 'neutral' },
      ];
    case '/dashboard/analytics':
      return [
        { label: 'Win Rate', value: '68%', icon: Target, trend: 'up' },
        { label: 'Donations', value: '1,234', icon: Star, trend: 'up' },
        { label: 'Avg. Trophies', value: '2,847', icon: Crown, trend: 'up' },
      ];
    default:
      return [];
  }
};

export function DashboardTopBar({
  userName = 'User',
  userAvatar,
  userRole = 'Member',
  notificationCount = 0
}: DashboardTopBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const keyMetrics = getKeyMetrics(pathname);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault();
            setIsCommandPaletteOpen(true);
            break;
          case 'n':
            e.preventDefault();
            console.log('Quick create post');
            break;
          case ',':
            e.preventDefault();
            router.push('/dashboard/settings');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Enhanced search with smart filtering
    if (searchQuery.startsWith('#')) {
      // Search for player tags
      console.log('Searching for player tag:', searchQuery);
    } else if (searchQuery.startsWith('@')) {
      // Search for mentions
      console.log('Searching for mentions:', searchQuery);
    } else {
      // General search
      console.log('General search:', searchQuery);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'leader':
      case 'coleader':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'elder':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="flex h-16 items-center justify-between border-b bg-background px-6">
      {/* Left side - Enhanced Search & Key Metrics */}
      <div className="flex items-center gap-6">
        {/* Enhanced Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <form onSubmit={handleSearch} className="hidden sm:block">
            <Input
              type="search"
              placeholder="Search everything... (posts, members, analytics)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 lg:w-80 pl-9 pr-4 bg-muted/50 border-0 focus-visible:ring-1"
            />
          </form>
        </div>

        {/* Mobile Search Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCommandPaletteOpen(true)}
          className="sm:hidden flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <Search className="w-4 h-4" />
        </Button>

        {/* Command Palette Trigger */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCommandPaletteOpen(true)}
          className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <Command className="w-4 h-4" />
          <span className="text-xs">Cmd+K</span>
        </Button>

        {/* Key Metrics */}
        {keyMetrics.length > 0 && (
          <div className="hidden lg:flex items-center gap-4">
            <Separator orientation="vertical" className="h-6" />
            {keyMetrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Icon className={cn(
                      "w-4 h-4",
                      metric.status === 'active' && "text-green-500",
                      metric.trend === 'up' && "text-green-500",
                      metric.trend === 'down' && "text-red-500"
                    )} />
                    <span className="text-muted-foreground">{metric.label}:</span>
                    <span className="font-medium">{metric.value}</span>
                    {metric.trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
                    {metric.trend === 'down' && <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />}
                  </div>
                  {index < keyMetrics.length - 1 && (
                    <Separator orientation="vertical" className="h-4" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right side - Actions & User */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          {notificationCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {notificationCount > 99 ? '99+' : notificationCount}
            </Badge>
          )}
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-2 px-2">
              <Avatar className="w-7 h-7">
                <AvatarImage src={userAvatar} />
                <AvatarFallback>
                  {userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium truncate max-w-24">
                  {userName}
                </span>
                <Badge
                  variant="secondary"
                  className={`text-xs px-1 py-0 ${getRoleColor(userRole)}`}
                >
                  {userRole}
                </Badge>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{userName}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>My Profile</span>
            </DropdownMenuItem>

            <DropdownMenuItem className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleSignOut}
              className="flex items-center gap-2 text-red-600 focus:text-red-600"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
