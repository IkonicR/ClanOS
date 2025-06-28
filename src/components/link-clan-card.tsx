'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';

export function LinkClanCard() {
  const [playerTag, setPlayerTag] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const handleLinkClan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!playerTag.startsWith('#')) {
      toast({
        title: 'Invalid Player Tag',
        description: 'Player tags must start with a #.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
        setLoading(false);
        return;
    }
    
    // 1. Fetch player data from CoC API to get clan tag
    const res = await fetch(`/api/players/${encodeURIComponent(playerTag)}`);
    if (!res.ok) {
        const errorData = await res.json();
        toast({ title: 'Error fetching player data', description: errorData.message || 'Could not find player.', variant: 'destructive' });
        setLoading(false);
        return;
    }
    const playerData = await res.json();

    if (!playerData.clan || !playerData.clan.tag) {
        toast({ title: 'Not in a clan', description: 'The provided player tag is not currently in a clan.', variant: 'destructive' });
        setLoading(false);
        return;
    }

    const clanTag = playerData.clan.tag;

    // 2. Update the user's profile table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ player_tag: playerTag, clan_tag: clanTag })
      .eq('id', user.id);

    if (profileError) {
        toast({ title: 'Error updating profile', description: profileError.message, variant: 'destructive' });
        setLoading(false);
        return;
    }

    // 3. Update auth user metadata (optional, but good for consistency)
    const { error: userError } = await supabase.auth.updateUser({
        data: { playerTag: playerTag, clanTag: clanTag }
    })

    if (userError) {
        // This is not critical, so just log it
        console.warn('Could not update user metadata:', userError.message);
    }
    
    toast({
      title: 'Success!',
      description: `Your profile has been linked to clan ${playerData.clan.name}.`,
    });
    setPlayerTag('');
    setLoading(false);
     // Reload the page to reflect changes
     window.location.reload();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Link Your Clan</CardTitle>
        <CardDescription>
          Enter your Clash of Clans player tag to link your profile to your clan.
          This will unlock clan-specific features.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLinkClan} className="flex gap-2">
          <Input
            placeholder="#YOURPLAYERTAG"
            value={playerTag}
            onChange={(e) => setPlayerTag(e.target.value)}
            disabled={loading}
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Linking...' : 'Link Clan'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 