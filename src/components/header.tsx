'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Swords, Settings as SettingsIcon, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FriendRequestsDropdown } from './friend-requests-dropdown';
import { Profile } from '@/lib/types';

const navItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Clan Feed', href: '/dashboard/clan-feed' },
    { label: 'Members', href: '/dashboard/members' },
    { label: 'War Room', href: '/dashboard/war-room' },
    { label: 'Clan Management', href: '/dashboard/clan-management' },
    { label: 'Analytics', href: '/dashboard/analytics' },
    { label: 'Admin', href: '/dashboard/admin/invites', adminOnly: true },
];

function NavLink({ href, children }: { href: string, children: React.ReactNode }) {
    const pathname = usePathname();
    const isActive = pathname === href;
    return (
        <Link
            href={href}
            className={cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive 
                    ? "text-primary" 
                    : "text-muted-foreground/70 hover:text-foreground dark:text-muted-foreground dark:hover:text-secondary-foreground"
            )}
        >
            {children}
        </Link>
    )
}

export function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(profileData);
      }
    };
    fetchUserAndProfile();
  }, [supabase, supabase.auth]);

  const getInitials = (name: string) => {
    return name?.split(' ').map((n) => n[0]).join('') ?? '';
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-sm text-foreground">
        <div className="container flex h-16 items-center">
            {/* Mobile Nav Trigger */}
            <div className="md:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="h-5 w-5 text-zinc-300" />
                            <span className="sr-only">Open Menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[240px]">
                        <div className='mt-6'>
                            <Link href="/dashboard" className="mb-8 flex items-center space-x-2">
                                <Swords className="h-6 w-6 text-primary" />
                                <span className="font-bold text-lg">ClanOS</span>
                            </Link>
                            <div className="flex flex-col space-y-2">
                                {navItems.filter(item => !item.adminOnly || profile?.role === 'admin').map((item) => (
                                    <NavLink key={item.href} href={item.href}>
                                        {item.label}
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Desktop Logo (Left) */}
            <Link href="/dashboard" className="mr-8 hidden items-center space-x-2 md:flex">
                <Swords className="h-6 w-6 text-primary" />
                <span className="font-bold">
                ClanOS
                </span>
            </Link>
            
            {/* Desktop Nav (Center) */}
            <nav className="hidden items-center justify-center gap-2 md:flex flex-1">
                {navItems.filter(item => !item.adminOnly || profile?.role === 'admin').map((item) => (
                    <NavLink key={item.href} href={item.href}>
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            {/* User Menu (Right) */}
            <div className="flex items-center justify-end ml-4">
                {user ? (
                    <>
                        <FriendRequestsDropdown />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                <Avatar className="h-9 w-9 border-2 border-transparent hover:border-primary/50 transition-colors">
                                    <AvatarImage src={user.user_metadata.avatar_url} alt={user.user_metadata.name ?? 'User'} />
                                    <AvatarFallback>{getInitials(user.user_metadata.name)}</AvatarFallback>
                                </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user.user_metadata.name}</p>
                                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {profile?.role === 'admin' && (
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/admin/invites" className="flex items-center cursor-pointer">
                                            <Shield className="w-4 h-4 mr-2" />
                                            <span>Admin Panel</span>
                                        </Link>
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard/settings" className="flex items-center cursor-pointer">
                                        <SettingsIcon className="w-4 h-4 mr-2" />
                                        <span>Settings</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <form action="/auth/sign-out" method="post">
                                  <button type="submit" className="w-full text-left">
                                      <DropdownMenuItem>
                                      Sign out
                                      </DropdownMenuItem>
                                  </button>
                                </form>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </>
                ) : (
                    <Button asChild>
                        <Link href="/login">Sign In</Link>
                    </Button>
                )}
            </div>
        </div>
    </header>
  );
} 