import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  const supabase = createRouteHandlerClient({ cookies });

  const { error } = await supabase.from('waitlist').insert([{ email }]);

  if (error) {
    console.error('Error inserting into waitlist:', error);
    if (error.code === '23505') { // unique_violation for duplicate email
      return NextResponse.json({ message: 'You are already on the waitlist!' }, { status: 200 });
    }
    return NextResponse.json({ error: 'An error occurred. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Success! You have been added to the waitlist.' }, { status: 200 });
} 