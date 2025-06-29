import { createClient } from '@/lib/supabase/server';
import { getClanInfo } from '@/lib/coc-api';

interface Profile {
  id: string;
  clan_tag: string | null;
  player_tag: string | null;
  role: string | null;
  in_game_name: string | null;
  active_profile_id: string | null;
}

interface LinkedProfile {
  id: string;
  user_id: string;
  player_tag: string;
  clan_tag: string | null;
  role: string | null;
  in_game_name: string | null;
  is_active: boolean;
}

export async function autoSyncUserRole(userId: string): Promise<{ success: boolean; updated?: boolean; error?: string }> {
  try {
    const supabase = createClient();
    
    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return { success: false, error: 'Profile not found' };
    }

    // Get the active linked profile
    const { data: activeLinkedProfile, error: linkedProfileError } = await supabase
      .from('linked_profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    // If no active linked profile exists, use the main profile data (backward compatibility)
    const targetProfile = activeLinkedProfile || {
      clan_tag: profile.clan_tag,
      player_tag: profile.player_tag,
      role: profile.role,
      in_game_name: profile.in_game_name
    };

    // Skip if no clan_tag or player_tag
    if (!targetProfile.clan_tag || !targetProfile.player_tag) {
      return { success: true, updated: false };
    }

    // Fetch clan data from COC API
    const clanData = await getClanInfo(targetProfile.clan_tag);
    const member = clanData.memberList?.find((m: any) => m.tag === targetProfile.player_tag);

    if (!member) {
      // Player not found in clan - this could mean they left the clan
      // We could optionally clear their clan_tag here, but for now just skip
      return { success: true, updated: false };
    }

    // Map COC role to our role system
    let newRole: string;
    switch (member.role.toLowerCase()) {
      case 'leader':
        newRole = 'leader';
        break;
      case 'co-leader':
      case 'coleader':
        newRole = 'coLeader';
        break;
      case 'elder':
        newRole = 'elder';
        break;
      case 'member':
      default:
        newRole = 'user';
        break;
    }

    let hasUpdates = false;

    // Update linked profile if it exists and values changed
    if (activeLinkedProfile && 
        (activeLinkedProfile.role !== newRole || activeLinkedProfile.in_game_name !== member.name)) {
      
      const { error: linkedUpdateError } = await supabase
        .from('linked_profiles')
        .update({ 
          role: newRole,
          in_game_name: member.name
        })
        .eq('id', activeLinkedProfile.id);

      if (linkedUpdateError) {
        console.error('Error updating linked profile role:', linkedUpdateError);
        return { success: false, error: 'Failed to update linked profile role' };
      }
      
      hasUpdates = true;
    }

    // Update main profile if values changed
    if (profile.role !== newRole || profile.in_game_name !== member.name) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          role: newRole,
          in_game_name: member.name
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating profile role:', updateError);
        return { success: false, error: 'Failed to update role' };
      }

      hasUpdates = true;
    }

    return { success: true, updated: hasUpdates };

  } catch (error) {
    console.error('Error in autoSyncUserRole:', error);
    return { success: false, error: 'Internal error during role sync' };
  }
} 