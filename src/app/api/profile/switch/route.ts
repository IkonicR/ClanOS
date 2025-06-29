import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { playerTag } = await request.json();

    if (!playerTag) {
      return NextResponse.json({ error: 'Player tag is required' }, { status: 400 });
    }

    // Verify that the profile belongs to the current user
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .eq('player_tag', playerTag)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found or unauthorized' }, { status: 404 });
    }

    // For now, we'll just return success. In a more complex implementation,
    // you might want to set a session variable or update the user's current profile
    // Since we don't have a "current_profile" concept, we'll handle switching on the frontend
    
    return NextResponse.json({ success: true, profile });

  } catch (error) {
    console.error('Error switching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 