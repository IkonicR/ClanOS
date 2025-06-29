import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getClanInfo } from '@/lib/coc-api';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (!profile.clan_tag || !profile.player_tag) {
      return NextResponse.json({ error: 'Clan tag or player tag not set' }, { status: 400 });
    }

    // Fetch clan data from COC API using the helper function
    const clanData = await getClanInfo(profile.clan_tag);
    const member = clanData.memberList?.find((m: any) => m.tag === profile.player_tag);

    if (!member) {
      return NextResponse.json({ error: 'Player not found in clan' }, { status: 404 });
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

    // Update the profile with the new role
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        role: newRole,
        in_game_name: member.name // Also update in-game name while we're at it
      })
      .eq('id', user.id)
      .eq('player_tag', profile.player_tag)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      oldRole: profile.role,
      newRole: newRole,
      profile: updatedProfile 
    });

  } catch (error) {
    console.error('Error syncing role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 