'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Users, Crown, Star, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';

interface Clan {
  id: string;
  name: string;
  tag: string;
  badgeUrl: string;
  memberCount: number;
  role: 'admin' | 'leader' | 'coLeader' | 'elder' | 'member';
}

interface WorkspaceSwitcherProps {
  currentClan?: Clan;
  onClanSwitch?: (clan: Clan) => void;
  availableClans?: Clan[];
  userRole?: string;
}

const mockClans: Clan[] = [
  {
    id: '1',
    name: 'The Warriors',
    tag: '#2P0J2YQJ',
    badgeUrl: '/town-hall-icons/Town_Hall_15.png',
    memberCount: 45,
    role: 'leader'
  },
  {
    id: '2',
    name: 'Elite Fighters',
    tag: '#2Q0J8YQJ',
    badgeUrl: '/town-hall-icons/Town_Hall_14.png',
    memberCount: 50,
    role: 'coLeader'
  },
  {
    id: '3',
    name: 'Dragon Slayers',
    tag: '#2R0J9YQJ',
    badgeUrl: '/town-hall-icons/Town_Hall_16.png',
    memberCount: 48,
    role: 'elder'
  }
];

export function WorkspaceSwitcher({
  currentClan,
  onClanSwitch,
  availableClans,
  userRole
}: WorkspaceSwitcherProps) {
  const [clans, setClans] = useState<Clan[]>(availableClans || []);
  const supabase = createClient();

  // Use provided clans
  useEffect(() => {
    if (availableClans && availableClans.length > 0) {
      setClans(availableClans);
    }
  }, [availableClans]);

  // Default to first available clan or current clan
  const activeClan = currentClan || (clans.length > 0 ? clans[0] : {
    id: 'default',
    name: 'Loading...',
    tag: '#0000',
    badgeUrl: '',
    memberCount: 0,
    role: 'member' as const
  });

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return Shield;
      case 'leader':
        return Crown;
      case 'coleader':
        return Star;
      case 'elder':
        return Shield;
      default:
        return Users;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'text-red-600';
      case 'leader':
      case 'coleader':
        return 'text-purple-600';
      case 'elder':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleClanSwitch = (clan: Clan) => {
    if (onClanSwitch) {
      onClanSwitch(clan);
    }
  };

  const RoleIcon = getRoleIcon(activeClan.role);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 px-2 h-9"
        >
          <Avatar className="w-6 h-6">
            <AvatarImage src={activeClan.badgeUrl} />
            <AvatarFallback>
              {(activeClan.name && activeClan.name.charAt(0)) || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="hidden lg:flex flex-col items-start min-w-0">
            <span className="text-sm font-medium truncate max-w-32">
              {activeClan.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {activeClan.tag}
            </span>
          </div>
          <RoleIcon className={`w-4 h-4 ${getRoleColor(activeClan.role)}`} />
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-80">
        <div className="px-2 py-1.5 border-b">
          <h3 className="text-sm font-semibold">Switch Clan</h3>
          <p className="text-xs text-muted-foreground">Select a clan to manage</p>
        </div>

        <div className="py-1">
          {clans.map((clan) => {
            const ClanRoleIcon = getRoleIcon(clan.role);
            const isCurrent = clan.id === activeClan.id;

            return (
              <DropdownMenuItem
                key={clan.id}
                onClick={() => handleClanSwitch(clan)}
                className={`flex items-center gap-3 p-3 cursor-pointer ${
                  isCurrent ? 'bg-muted' : ''
                }`}
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={clan.badgeUrl} />
                  <AvatarFallback>
                    {(clan.name && clan.name.charAt(0)) || '?'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{clan.name}</p>
                    {isCurrent && (
                      <Badge variant="secondary" className="text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {clan.tag}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    {clan.memberCount}
                  </div>
                  <ClanRoleIcon className={`w-4 h-4 ${getRoleColor(clan.role)}`} />
                </div>
              </DropdownMenuItem>
            );
          })}
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem className="flex items-center gap-3 p-3 cursor-pointer">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <Plus className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Join New Clan</p>
            <p className="text-xs text-muted-foreground">Add another clan to manage</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
