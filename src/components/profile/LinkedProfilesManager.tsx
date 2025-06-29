'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Plus, Users, Crown, Shield, Star, User as UserIcon, RefreshCw, Key, ChevronDown, ChevronUp } from 'lucide-react';

interface LinkedProfile {
  id: string;
  player_tag: string;
  clan_tag: string | null;
  in_game_name: string | null;
  role: string | null;
  is_active: boolean;
  created_at: string;
}

export function LinkedProfilesManager() {
  const [linkedProfiles, setLinkedProfiles] = useState<LinkedProfile[]>([]);
  const [newPlayerTag, setNewPlayerTag] = useState('');
  const [claimPlayerTag, setClaimPlayerTag] = useState('');
  const [claimApiToken, setClaimApiToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [addingProfile, setAddingProfile] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

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
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch linked profiles',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error fetching linked profiles:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch linked profiles',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const addLinkedProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerTag.trim()) return;

    setAddingProfile(true);
    try {
      const response = await fetch('/api/profile/linked-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerTag: newPlayerTag.trim() })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Profile linked successfully!'
        });
        setNewPlayerTag('');
        fetchLinkedProfiles(); // Refresh the list
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to link profile',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error adding linked profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to link profile',
        variant: 'destructive'
      });
    } finally {
      setAddingProfile(false);
    }
  };

  const claimAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimPlayerTag.trim() || !claimApiToken.trim()) return;

    setClaiming(true);
    try {
      const response = await fetch('/api/profile/claim-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          playerTag: claimPlayerTag.trim(),
          apiToken: claimApiToken.trim()
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Account Claimed!',
          description: `Successfully claimed ${data.archivedAccount}!`
        });
        setClaimPlayerTag('');
        setClaimApiToken('');
        setShowClaimForm(false);
        fetchLinkedProfiles(); // Refresh the list
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to claim account',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error claiming account:', error);
      toast({
        title: 'Error',
        description: 'Failed to claim account',
        variant: 'destructive'
      });
    } finally {
      setClaiming(false);
    }
  };

  const forceTransferAccount = async () => {
    if (!claimPlayerTag.trim()) return;

    const confirmed = window.confirm(
      `Are you sure you want to transfer ${claimPlayerTag} to this account?\n\nThis will remove the COC data from the original account and link it to your current account. This action cannot be undone.`
    );

    if (!confirmed) return;

    setClaiming(true);
    try {
      const response = await fetch('/api/profile/force-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          playerTag: claimPlayerTag.trim(),
          confirmTransfer: true
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Account Transferred!',
          description: `Successfully transferred ${data.transferredFrom}!`
        });
        setClaimPlayerTag('');
        setClaimApiToken('');
        setShowClaimForm(false);
        fetchLinkedProfiles(); // Refresh the list
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to transfer account',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error transferring account:', error);
      toast({
        title: 'Error',
        description: 'Failed to transfer account',
        variant: 'destructive'
      });
    } finally {
      setClaiming(false);
    }
  };

  const switchProfile = async (profileId: string) => {
    try {
      const response = await fetch('/api/profile/switch-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Profile switched successfully!'
        });
        fetchLinkedProfiles(); // Refresh to show new active state
        // Trigger a page refresh to update all profile-dependent data
        window.location.reload();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to switch profile',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error switching profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to switch profile',
        variant: 'destructive'
      });
    }
  };

  const getRoleIcon = (role: string | null) => {
    switch (role) {
      case 'leader': return <Crown className="h-4 w-4" />;
      case 'coLeader': return <Shield className="h-4 w-4" />;
      case 'elder': return <Star className="h-4 w-4" />;
      case 'admin': return <Users className="h-4 w-4" />;
      default: return <UserIcon className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string | null): "default" | "destructive" | "outline" | "secondary" => {
    switch (role) {
      case 'leader': return 'default';
      case 'coLeader': return 'secondary';
      case 'elder': return 'outline';
      case 'admin': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Linked Accounts
          </CardTitle>
          <CardDescription>
            Loading your linked Clash of Clans accounts...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Linked Accounts
        </CardTitle>
        <CardDescription>
          Manage multiple Clash of Clans accounts and switch between them
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Profile Form */}
        <div className="space-y-4">
          <form onSubmit={addLinkedProfile} className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter player tag (e.g., #ABC123)"
              value={newPlayerTag}
              onChange={(e) => setNewPlayerTag(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={addingProfile || !newPlayerTag.trim()}>
              {addingProfile ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add Account
            </Button>
          </form>

          {/* Toggle Claim Form */}
          <div className="text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClaimForm(!showClaimForm)}
              className="text-xs"
            >
              <Key className="h-3 w-3 mr-1" />
              Already have an account to claim?
              {showClaimForm ? (
                <ChevronUp className="h-3 w-3 ml-1" />
              ) : (
                <ChevronDown className="h-3 w-3 ml-1" />
              )}
            </Button>
          </div>

          {/* Claim Account Form */}
          {showClaimForm && (
            <div className="border rounded-lg p-4 bg-muted/20">
              <div className="text-sm text-muted-foreground mb-3">
                <p className="font-medium mb-1">Claim an existing account</p>
                <p>If you already have an account on this platform with a different email, you can claim it by providing your COC API token for verification.</p>
              </div>
              <form onSubmit={claimAccount} className="space-y-3">
                <Input
                  type="text"
                  placeholder="Player tag to claim (e.g., #ABC123)"
                  value={claimPlayerTag}
                  onChange={(e) => setClaimPlayerTag(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Your COC API token for verification"
                  value={claimApiToken}
                  onChange={(e) => setClaimApiToken(e.target.value)}
                />
                <div className="text-xs text-muted-foreground">
                  <p>Get your API token from: <a href="https://developer.clashofclans.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">developer.clashofclans.com</a></p>
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      disabled={claiming || !claimPlayerTag.trim() || !claimApiToken.trim()}
                      className="flex-1"
                    >
                      {claiming ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Key className="h-4 w-4" />
                      )}
                      Verify & Claim
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowClaimForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                  <div className="text-center">
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="sm"
                      disabled={claiming || !claimPlayerTag.trim()}
                      onClick={forceTransferAccount}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Or transfer without verification (if you own both accounts)
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Linked Profiles List */}
        {linkedProfiles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No linked accounts yet</p>
            <p className="text-sm">Add your first Clash of Clans account above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {linkedProfiles.map((profile) => (
              <div
                key={profile.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                  profile.is_active 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:bg-accent/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(profile.role)}
                    <span className="font-medium">
                      {profile.in_game_name || 'Unknown'}
                    </span>
                  </div>
                  <Badge variant={getRoleBadgeVariant(profile.role)}>
                    {profile.role === 'coLeader' ? 'Co-Leader' : profile.role || 'Member'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {profile.player_tag}
                  </span>
                  {profile.is_active && (
                    <Badge variant="default" className="bg-green-500">
                      Active
                    </Badge>
                  )}
                </div>
                
                {!profile.is_active && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => switchProfile(profile.id)}
                  >
                    Switch To
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 