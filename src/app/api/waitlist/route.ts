import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  try {
    const { error } = await supabaseAdmin.from('waitlist').insert([{ email }]);

    if (error) {
      if (error.code === '23505') {
        // unique_violation for duplicate email
        return NextResponse.json({ message: 'You are already on the waitlist!' }, { status: 200 });
      }
      console.error('Error inserting into waitlist:', JSON.stringify(error, null, 2));
      return NextResponse.json({ error: 'Could not join the waitlist. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Successfully joined the waitlist!' });
  } catch (error: any) {
    console.error('An unexpected error occurred in waitlist API:', {
      message: error.message,
      stack: error.stack,
      details: error.details,
    });
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}