import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data, error } = await supabaseAdmin
        .from('feature_requests')
        .select('*')
        .eq('email', user.email)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching feature requests:', error);
        return NextResponse.json({ error: 'Failed to fetch feature requests' }, { status: 500 });
    }

    return NextResponse.json(data);
}

export async function POST(request: Request) {
  const { title, description, category, email } = await request.json();

  if (!title || !email) {
    return NextResponse.json({ error: 'Title and email are required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('feature_requests')
      .insert([{ title, description, category, email }])
      .select()
      .single();

    if (error) {
      console.error('Error inserting feature request:', error);
      return NextResponse.json({ error: 'Could not submit feature request.' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('An unexpected error occurred in feature-requests API:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
} 