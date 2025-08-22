'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/lib/hooks/useUser';
import { Trash2, Plus, Users, AlertTriangle, MessageSquare } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ClanRelationship {
  id: string;
  clan_tag_1: string;
  clan_tag_2: string;
  relationship_type: string;
  created_at: string;
  is_active: boolean;
  status: 'pending' | 'accepted' | 'rejected';
  invited_by: string | null;
  created_by: string | null;
}

const ClanRelationshipsPage = () => {
  const [relationships, setRelationships] = useState<ClanRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingRelationship, setIsAddingRelationship] = useState(false);
  const [newClanTag, setNewClanTag] = useState('');
  const [relationshipType, setRelationshipType] = useState('sister');
  const [userClanTag, setUserClanTag] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  const supabase = createClient();
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user, fetchUserProfile]);

  useEffect(() => {
    if (userClanTag) {
      fetchRelationships();
    }
  }, [userClanTag, fetchRelationships]);

  const fetchUserProfile = useCallback(async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('clan_tag, role')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserClanTag(profile.clan_tag);
        setUserRole(profile.role);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }, [user, supabase]);

  const fetchRelationships = useCallback(async () => {
    if (!userClanTag) return;

    try {
      console.log('Fetching relationships for clan:', userClanTag);

      const { data, error } = await supabase
        .from('clan_relationships')
        .select('*')
        .or(`clan_tag_1.eq.${userClanTag},clan_tag_2.eq.${userClanTag}`)
        .order('created_at', { ascending: false });

      console.log('Fetch relationships result:', { data: data?.length, error });
      console.log('All relationships:', data);

      if (error) throw error;
      setRelationships(data || []);
    } catch (error) {
      console.error('Error fetching relationships:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch clan relationships',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [userClanTag, supabase, toast]);

  const addRelationship = async () => {
    if (!newClanTag.trim() || !userClanTag) return;

    // Ensure tags are in alphabetical order for the database constraint
    const tag1 = userClanTag < newClanTag ? userClanTag : newClanTag;
    const tag2 = userClanTag < newClanTag ? newClanTag : userClanTag;

    try {
      setIsAddingRelationship(true);
      
      const { error } = await supabase
        .from('clan_relationships')
        .insert({
          clan_tag_1: tag1,
          clan_tag_2: tag2,
          relationship_type: relationshipType,
          created_by: user?.id,
          invited_by: user?.id,
          status: 'pending',
          is_active: false // Only becomes active when accepted
        });

      if (error) throw error;

      toast({
        title: 'Invite Sent!',
        description: `Sent ${relationshipType} invite to ${newClanTag}. They need to accept it for the relationship to become active.`,
      });

      setNewClanTag('');
      setRelationshipType('sister');
      fetchRelationships();
    } catch (error) {
      console.error('Error sending invite:', error);
      toast({
        title: 'Error',
        description: 'Failed to send clan relationship invite. It may already exist.',
        variant: 'destructive',
      });
    } finally {
      setIsAddingRelationship(false);
    }
  };

  const acceptInvite = async (relationshipId: string) => {
    try {
      const { data, error } = await supabase
        .from('clan_relationships')
        .update({ status: 'accepted', is_active: true })
        .eq('id', relationshipId)
        .select();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Clan relationship accepted!',
      });

      fetchRelationships();
    } catch (error) {
      console.error('Error accepting invite:', error);
      toast({
        title: 'Error',
        description: `Failed to accept clan relationship: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  const rejectInvite = async (relationshipId: string) => {
    try {
      const { data, error } = await supabase
        .from('clan_relationships')
        .update({ status: 'rejected', is_active: false })
        .eq('id', relationshipId)
        .select();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Clan relationship rejected',
      });

      fetchRelationships();
    } catch (error) {
      console.error('Error rejecting invite:', error);
      toast({
        title: 'Error',
        description: `Failed to reject clan relationship: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  const removeRelationship = async (relationshipId: string, isPendingInvite = false) => {
    try {
      console.log('Removing relationship ID:', relationshipId, 'isPendingInvite:', isPendingInvite);
      console.log('Current relationships:', relationships);
      
      // Find the relationship to debug
      const relationshipToDelete = relationships.find(r => r.id === relationshipId);
      console.log('Relationship to delete:', relationshipToDelete);
      
      let result;
      if (isPendingInvite) {
        // For pending invites, actually delete the record
        result = await supabase
          .from('clan_relationships')
          .delete()
          .eq('id', relationshipId)
          .select();
      } else {
        // For active relationships, mark as inactive/rejected
        result = await supabase
          .from('clan_relationships')
          .update({ is_active: false, status: 'rejected' })
          .eq('id', relationshipId)
          .select();
      }

      const { data, error } = result;
      console.log('Remove result:', { data, error, dataLength: data?.length });

      if (error) throw error;

      // Check if the operation actually affected any rows
      if (data && data.length === 0) {
        console.warn('No rows were affected by the delete/update operation');
        // Still show success message but let's see what happens
      }

      toast({
        title: 'Success',
        description: isPendingInvite ? 'Invite cancelled' : 'Clan relationship removed',
      });

      fetchRelationships();
    } catch (error) {
      console.error('Error removing relationship:', error);
      toast({
        title: 'Error',
        description: `Failed to remove clan relationship: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  const getOtherClanTag = (relationship: ClanRelationship) => {
    return relationship.clan_tag_1 === userClanTag ? relationship.clan_tag_2 : relationship.clan_tag_1;
  };

  const isInviteSentByMe = (relationship: ClanRelationship) => {
    // If invited_by is null, fall back to created_by
    const inviter = relationship.invited_by || relationship.created_by;
    return inviter === user?.id;
  };

  const isInviteForMe = (relationship: ClanRelationship) => {
    // An invite is "for me" if:
    // 1. I didn't send it (invited_by/created_by !== my user id)
    // 2. It's pending
    // 3. My clan is one of the participants
    const inviter = relationship.invited_by || relationship.created_by;
    return inviter !== user?.id && 
           relationship.status === 'pending' &&
           (relationship.clan_tag_1 === userClanTag || relationship.clan_tag_2 === userClanTag);
  };

  // Separate relationships by type
  const activeRelationships = relationships.filter(r => r.status === 'accepted' && r.is_active);
  const sentInvites = relationships.filter(r => isInviteSentByMe(r) && r.status === 'pending');
  const receivedInvites = relationships.filter(r => isInviteForMe(r));

  // Check if user is admin/leader/coLeader/elder
  const canManageRelationships = userRole && ['admin', 'leader', 'coLeader', 'elder'].includes(userRole);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Please log in to manage clan relationships.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canManageRelationships) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Only clan leaders, co-leaders, and admins can manage clan relationships.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Sister Clan Relationships</h1>
        <p className="text-muted-foreground">
          Manage allied and sister clan relationships. Posts from allied clans will appear in the Group Feed.
        </p>
      </div>

      {/* Add New Relationship */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Send Relationship Invite
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Send an invite to another clan to establish a relationship. They must accept it for posts to appear in Group Feed.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="clanTag">Clan Tag</Label>
              <Input
                id="clanTag"
                placeholder="#CLAN123"
                value={newClanTag}
                onChange={(e) => setNewClanTag(e.target.value)}
                disabled={isAddingRelationship}
              />
            </div>
            <div>
              <Label htmlFor="relationshipType">Relationship Type</Label>
              <Select value={relationshipType} onValueChange={setRelationshipType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sister">Sister Clan</SelectItem>
                  <SelectItem value="feeder">Feeder Clan</SelectItem>
                  <SelectItem value="cwl">CWL Partner</SelectItem>
                  <SelectItem value="allied">Allied Clan</SelectItem>
                  <SelectItem value="friendly">Friendly Clan</SelectItem>
                  <SelectItem value="academy">Academy Clan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={addRelationship}
                disabled={!newClanTag.trim() || isAddingRelationship}
                className="w-full"
              >
                {isAddingRelationship ? 'Sending...' : 'Send Invite'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Invites Received */}
      {receivedInvites.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Pending Invites ({receivedInvites.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              These clans want to establish a relationship with you. Accept or reject their invites.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {receivedInvites.map((relationship) => (
                <div key={relationship.id} className="flex items-center justify-between p-4 border rounded-lg bg-orange-50 dark:bg-orange-950/20">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-semibold">{getOtherClanTag(relationship)}</p>
                      <p className="text-sm text-muted-foreground">
                        Invited {new Date(relationship.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {relationship.relationship_type}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => acceptInvite(relationship.id)}>
                      Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => rejectInvite(relationship.id)}>
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Relationships */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Active Relationships ({activeRelationships.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading relationships...</p>
            </div>
          ) : activeRelationships.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No active relationships yet. Send invites above!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeRelationships.map((relationship) => (
                <div key={relationship.id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-semibold">{getOtherClanTag(relationship)}</p>
                      <p className="text-sm text-muted-foreground">
                        Active since {new Date(relationship.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {relationship.relationship_type}
                    </Badge>
                    <Badge variant="default" className="bg-green-500">
                      Active
                    </Badge>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Clan Relationship</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove the relationship with {getOtherClanTag(relationship)}? 
                          Their posts will no longer appear in your Group Feed.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => removeRelationship(relationship.id)}>
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sent Invites */}
      {sentInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              Sent Invites ({sentInvites.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Invites you&apos;ve sent that are waiting for a response.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sentInvites.map((relationship) => (
                <div key={relationship.id} className="flex items-center justify-between p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-semibold">{getOtherClanTag(relationship)}</p>
                      <p className="text-sm text-muted-foreground">
                        Sent {new Date(relationship.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {relationship.relationship_type}
                    </Badge>
                    <Badge variant="secondary">
                      Pending
                    </Badge>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Invite</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to cancel the invite to {getOtherClanTag(relationship)}?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Invite</AlertDialogCancel>
                        <AlertDialogAction onClick={() => removeRelationship(relationship.id, true)}>
                          Cancel Invite
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClanRelationshipsPage; 