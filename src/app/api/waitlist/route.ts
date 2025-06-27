import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin.from('waitlist').insert([{ email }]);
    console.log('Supabase response:', { data, error });

    if (error) {
      if (error.code === '23505') {
        // unique_violation for duplicate email
        return NextResponse.json({ message: 'You are already on the waitlist!' }, { status: 200 });
      }
      console.error('Error inserting into waitlist. Full error object:', error);
      console.error('Error stringified:', JSON.stringify(error, null, 2));
      return NextResponse.json({ error: 'Could not join the waitlist. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Successfully joined the waitlist!' });
  } catch (error: any) {
    console.error('An unexpected error occurred in waitlist API. Full error object:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}