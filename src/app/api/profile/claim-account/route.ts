import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getPlayerInfo } from '@/lib/coc-api';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { playerTag, apiToken } = await request.json();

    if (!playerTag || !playerTag.trim()) {
      return NextResponse.json({ error: 'Player tag is required' }, { status: 400 });
    }

    // Normalize player tag - ensure it starts with #
    const normalizedPlayerTag = playerTag.trim().startsWith('#') 
      ? playerTag.trim() 
      : `#${playerTag.trim()}`;

    if (!apiToken) {
      return NextResponse.json({ error: 'API token is required for verification' }, { status: 400 });
    }

    // Check if this player tag exists in another account
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, in_game_name, player_tag')
      .eq('player_tag', normalizedPlayerTag)
      .single();

    if (profileError || !existingProfile) {
      return NextResponse.json({ error: 'No account found with this player tag' }, { status: 404 });
    }

    // Check if it's already linked to the current user
    if (existingProfile.id === user.id) {
      return NextResponse.json({ error: 'This account is already linked to your profile' }, { status: 400 });
    }

    // Verify ownership using the API token
    try {
      // Make a COC API call with the user's token to verify they own this account
      const response = await fetch(`https://api.clashofclans.com/v1/players/${encodeURIComponent(normalizedPlayerTag)}`, {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        return NextResponse.json({ 
          error: 'Invalid API token or unable to verify account ownership' 
        }, { status: 400 });
      }

      const playerData = await response.json();
      
      // Additional verification: ensure the player name matches
      if (playerData.name !== existingProfile.in_game_name) {
        return NextResponse.json({ 
          error: 'Player name mismatch. Please ensure you\'re claiming the correct account.' 
        }, { status: 400 });
      }
    } catch (error) {
      return NextResponse.json({ 
        error: 'Failed to verify account ownership' 
      }, { status: 500 });
    }

    // Get updated player info for role sync
    const playerInfo = await getPlayerInfo(normalizedPlayerTag);
    if (!playerInfo) {
      return NextResponse.json({ error: 'Player not found in Clash of Clans' }, { status: 404 });
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

    // Start transaction: Create linked profile and transfer ownership
    
    // 1. Create linked profile for the current user
    const { data: newLinkedProfile, error: insertError } = await supabase
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
      return NextResponse.json({ error: 'Failed to claim account' }, { status: 500 });
    }

    // 2. Archive/deactivate the old account (optional - you might want to keep it for reference)
    // For now, we'll just clear the player_tag to prevent conflicts
    const { error: archiveError } = await supabase
      .from('profiles')
      .update({ 
        player_tag: null,
        clan_tag: null,
        role: 'user' // Downgrade role since they no longer have a COC account linked
      })
      .eq('id', existingProfile.id);

    if (archiveError) {
      console.error('Error archiving old account:', archiveError);
      // Don't fail the whole operation, just log it
    }

    return NextResponse.json({ 
      message: 'Account claimed successfully!',
      profile: newLinkedProfile,
      archivedAccount: existingProfile.in_game_name
    });
  } catch (error) {
    console.error('Error in POST /api/profile/claim-account:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 