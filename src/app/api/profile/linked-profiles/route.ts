import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getPlayerInfo } from '@/lib/coc-api';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all linked profiles for the user
    const { data: linkedProfiles, error } = await supabase
      .from('linked_profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching linked profiles:', error);
      return NextResponse.json({ error: 'Failed to fetch linked profiles' }, { status: 500 });
    }

    return NextResponse.json({ linkedProfiles });
  } catch (error) {
    console.error('Error in GET /api/profile/linked-profiles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { playerTag } = await request.json();

    if (!playerTag || !playerTag.trim()) {
      return NextResponse.json({ error: 'Player tag is required' }, { status: 400 });
    }

    // Normalize player tag - ensure it starts with #
    const normalizedPlayerTag = playerTag.trim().startsWith('#') 
      ? playerTag.trim() 
      : `#${playerTag.trim()}`;

    // Check if this player tag is already linked to any user
    const { data: existingProfile } = await supabase
      .from('linked_profiles')
      .select('user_id')
      .eq('player_tag', normalizedPlayerTag)
      .single();

    if (existingProfile) {
      return NextResponse.json({ error: 'This player tag is already linked to an account' }, { status: 400 });
    }

    // Get player info from COC API
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

    // Create new linked profile
    const { data: newProfile, error: insertError } = await supabase
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
      return NextResponse.json({ error: 'Failed to link profile' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Profile linked successfully',
      profile: newProfile
    });
  } catch (error) {
    console.error('Error in POST /api/profile/linked-profiles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 