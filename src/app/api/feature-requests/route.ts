import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const { title, description, category, email } = await request.json();

  if (!title || !email) {
    return NextResponse.json({ error: 'Title and email are required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('feature_requests')
      .insert([{ title, description, category, email }]);

    if (error) {
      console.error('Error inserting feature request:', error);
      return NextResponse.json({ error: 'Could not submit feature request.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Thank you for your feedback!' });
  } catch (error: any) {
    console.error('An unexpected error occurred in feature-requests API:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
} 