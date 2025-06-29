import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { profileId } = await request.json();

    if (!profileId) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
    }

    // Verify the profile belongs to this user
    const { data: profileToActivate, error: profileError } = await supabase
      .from('linked_profiles')
      .select('*')
      .eq('id', profileId)
      .eq('user_id', user.id)
      .single();

    if (profileError || !profileToActivate) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Start transaction: deactivate all profiles, then activate the selected one
    
    // 1. Deactivate all profiles for this user
    const { error: deactivateError } = await supabase
      .from('linked_profiles')
      .update({ is_active: false })
      .eq('user_id', user.id);

    if (deactivateError) {
      console.error('Error deactivating profiles:', deactivateError);
      return NextResponse.json({ error: 'Failed to switch profile' }, { status: 500 });
    }

    // 2. Activate the selected profile
    const { error: activateError } = await supabase
      .from('linked_profiles')
      .update({ is_active: true })
      .eq('id', profileId);

    if (activateError) {
      console.error('Error activating profile:', activateError);
      return NextResponse.json({ error: 'Failed to switch profile' }, { status: 500 });
    }

    // 3. Update the user's main profile to reference the new active profile
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({
        active_profile_id: profileId,
        player_tag: profileToActivate.player_tag,
        clan_tag: profileToActivate.clan_tag,
        in_game_name: profileToActivate.in_game_name,
        role: profileToActivate.role
      })
      .eq('id', user.id);

    if (updateProfileError) {
      console.error('Error updating main profile:', updateProfileError);
      return NextResponse.json({ error: 'Failed to update main profile' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Profile switched successfully',
      activeProfile: profileToActivate
    });
  } catch (error) {
    console.error('Error in POST /api/profile/switch-profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 