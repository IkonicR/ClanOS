import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { getPlayerInfo } from '@/lib/coc-api';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const adminSupabase = createAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { playerTag, confirmTransfer } = await request.json();

    if (!playerTag || !playerTag.trim()) {
      return NextResponse.json({ error: 'Player tag is required' }, { status: 400 });
    }

    // Normalize player tag - ensure it starts with #
    const normalizedPlayerTag = playerTag.trim().startsWith('#') 
      ? playerTag.trim() 
      : `#${playerTag.trim()}`;

    console.log('Force-link: Original playerTag:', playerTag);
    console.log('Force-link: Normalized playerTag:', normalizedPlayerTag);

    if (!confirmTransfer) {
      return NextResponse.json({ error: 'Transfer confirmation required' }, { status: 400 });
    }

    // Check if this player tag exists in another account (using admin client to bypass RLS)
    console.log('Force-link: Looking for existing profile with player_tag:', normalizedPlayerTag);
    const { data: existingProfile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('id, in_game_name, player_tag')
      .eq('player_tag', normalizedPlayerTag)
      .single();

    console.log('Force-link: Query result:', { existingProfile, profileError });

    if (profileError || !existingProfile) {
      console.log('Force-link: No existing profile found, error:', profileError);
      return NextResponse.json({ error: 'No account found with this player tag' }, { status: 404 });
    }

    // Check if it's already linked to the current user
    if (existingProfile.id === user.id) {
      return NextResponse.json({ error: 'This account is already linked to your profile' }, { status: 400 });
    }

    // Get updated player info for role sync
    console.log('Force-link: About to call getPlayerInfo with:', normalizedPlayerTag);
    let playerInfo;
    try {
      playerInfo = await getPlayerInfo(normalizedPlayerTag);
      if (!playerInfo) {
        return NextResponse.json({ error: 'Player not found in Clash of Clans' }, { status: 404 });
      }
      console.log('Force-link: Successfully got player info for:', playerInfo.name);
    } catch (error) {
      console.error('Force-link: Error getting player info:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json({ error: `Failed to get player info: ${errorMessage}` }, { status: 400 });
    }

    // Map COC role to our role system
    let userRole: string = 'user'; // default
    if (playerInfo.clan?.role) {
      const cocRole = playerInfo.clan.role.toLowerCase();
      if (cocRole === 'leader') {
        userRole = 'leader';
      } else if (cocRole === 'co-leader' || cocRole === 'coleader') {
        userRole = 'coLeader';
      } else if (cocRole === 'elder') {
        userRole = 'elder';
      }
    }

    // Start transaction: Create or transfer linked profile
    
    // 1. Check if this player is already in linked_profiles table
    const { data: existingLinkedProfile } = await adminSupabase
      .from('linked_profiles')
      .select('id, user_id, is_active')
      .eq('player_tag', normalizedPlayerTag)
      .single();

    let newLinkedProfile;
    if (existingLinkedProfile) {
      // Transfer existing linked profile to current user
      console.log('Force-link: Transferring existing linked profile to current user');
      const { data: transferredProfile, error: transferError } = await adminSupabase
        .from('linked_profiles')
        .update({
          user_id: user.id,
          clan_tag: playerInfo.clan?.tag || null,
          in_game_name: playerInfo.name,
          role: userRole,
          is_active: false // New profiles start as inactive
        })
        .eq('id', existingLinkedProfile.id)
        .select()
        .single();

      if (transferError) {
        console.error('Error transferring linked profile:', transferError);
        return NextResponse.json({ error: 'Failed to transfer linked profile' }, { status: 500 });
      }
      newLinkedProfile = transferredProfile;
    } else {
      // Create new linked profile
      console.log('Force-link: Creating new linked profile');
      const { data: createdProfile, error: insertError } = await supabase
        .from('linked_profiles')
        .insert({
          user_id: user.id,
          player_tag: normalizedPlayerTag,
          clan_tag: playerInfo.clan?.tag || null,
          in_game_name: playerInfo.name,
          role: userRole,
          is_active: false // New profiles start as inactive
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating linked profile:', insertError);
        return NextResponse.json({ error: 'Failed to create linked profile' }, { status: 500 });
      }
      newLinkedProfile = createdProfile;
    }

    // 2. Clear the old account's COC data (using admin client to bypass RLS)
    const { error: clearError } = await adminSupabase
      .from('profiles')
      .update({ 
        player_tag: null,
        clan_tag: null,
        in_game_name: null,
        role: 'user' // Downgrade role since they no longer have a COC account linked
      })
      .eq('id', existingProfile.id);

    if (clearError) {
      console.error('Error clearing old account:', clearError);
      // Don't fail the whole operation, just log it
    }

    return NextResponse.json({ 
      message: 'Account transferred successfully!',
      profile: newLinkedProfile as any || {},
      transferredFrom: existingProfile.in_game_name || 'Unknown'
    });
  } catch (error) {
    console.error('Error in POST /api/profile/force-link:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 