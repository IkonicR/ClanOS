import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  try {
    const supabaseAdmin = createClient();
    // Diagnostic Step 1: Try to read from the table first.
    const { error: selectError } = await supabaseAdmin.from('waitlist').select('email').limit(1);

    if (selectError && selectError.message) {
      console.error('Error reading from waitlist table:', selectError);
      return NextResponse.json({ error: `A server error occurred: Could not read from table. Hint: ${selectError.message}` }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin.from('waitlist').insert([{ email }]);
    console.log('Supabase insert response:', { data, error });

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