'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Crown, Shield, Star, User as UserIcon, RefreshCw, Users2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LinkedProfile {
  id: string;
  player_tag: string;
  clan_tag: string | null;
  in_game_name: string | null;
  role: string | null;
  is_active: boolean;
}

export function ProfileSwitcher() {
  const [linkedProfiles, setLinkedProfiles] = useState<LinkedProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [switchingProfile, setSwitchingProfile] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchLinkedProfiles();
  }, []);

  const fetchLinkedProfiles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/profile/linked-profiles');
      const data = await response.json();
      
      if (response.ok) {
        setLinkedProfiles(data.linkedProfiles || []);
      }
    } catch (error) {
      console.error('Error fetching linked profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchProfile = async (profileId: string) => {
    setSwitchingProfile(profileId);
    
    try {
      // Show immediate feedback
      toast({
        title: 'Switching Profile...',
        description: 'Please wait while we switch your account',
      });

      const response = await fetch('/api/profile/switch-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Profile Switched!',
          description: `Successfully switched to ${data.activeProfile.in_game_name}`,
        });
        
        // Update the local state immediately
        setLinkedProfiles(prev => prev.map(p => ({
          ...p,
          is_active: p.id === profileId
        })));
        
        // Use router refresh for better UX instead of full page reload
        setTimeout(() => {
          router.refresh();
          setSwitchingProfile(null);
        }, 500);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to switch profile',
          variant: 'destructive'
        });
        setSwitchingProfile(null);
      }
    } catch (error) {
      console.error('Error switching profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to switch profile',
        variant: 'destructive'
      });
      setSwitchingProfile(null);
    }
  };

  const getRoleIcon = (role: string | null) => {
    switch (role) {
      case 'leader': return <Crown className="h-3 w-3" />;
      case 'coLeader': return <Shield className="h-3 w-3" />;
      case 'elder': return <Star className="h-3 w-3" />;
      default: return <UserIcon className="h-3 w-3" />;
    }
  };

  const activeProfile = linkedProfiles.find(p => p.is_active);
  const inactiveProfiles = linkedProfiles.filter(p => !p.is_active);

  // Don't show if user has only one profile or no profiles
  if (linkedProfiles.length <= 1) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
        <Users2 className="h-3 w-3" />
        <span>Active Account</span>
      </div>
      
      {activeProfile && (
        <div className="flex items-center justify-between px-2 py-1 rounded-md bg-primary/10">
          <div className="flex items-center gap-2">
            {getRoleIcon(activeProfile.role)}
            <span className="font-medium text-sm">{activeProfile.in_game_name}</span>
            <Badge variant="outline" className="text-xs py-0 px-1">
              {activeProfile.role === 'coLeader' ? 'Co-Leader' : activeProfile.role}
            </Badge>
          </div>
        </div>
      )}

      {inactiveProfiles.length > 0 && (
        <>
          <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
            <span>Switch To</span>
          </div>
          {inactiveProfiles.map((profile) => (
            <Button
              key={profile.id}
              variant="ghost"
              size="sm"
              className="w-full justify-start h-auto p-2 text-left"
              onClick={() => switchProfile(profile.id)}
              disabled={switchingProfile !== null}
            >
              <div className="flex items-center gap-2">
                {switchingProfile === profile.id ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  getRoleIcon(profile.role)
                )}
                <span className="text-sm">
                  {switchingProfile === profile.id ? 'Switching...' : profile.in_game_name}
                </span>
                {switchingProfile !== profile.id && (
                  <Badge variant="outline" className="text-xs py-0 px-1">
                    {profile.role === 'coLeader' ? 'Co-Leader' : profile.role}
                  </Badge>
                )}
              </div>
            </Button>
          ))}
        </>
      )}
    </div>
  );
} 