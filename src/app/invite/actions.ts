'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export async function verifyInviteCode(formData: FormData) {
  const code = formData.get('code') as string;
  const cookieStore = cookies();
  const supabase = createClient();

  if (!code) {
    return redirect('/invite?message=Please enter an invite code.');
  }

  const { data: invite, error } = await supabase
    .from('invite_codes')
    .select('*')
    .eq('code', code)
    .single();

  if (error || !invite) {
    return redirect('/invite?message=Invalid invite code. Please try again.');
  }

  if (invite.used_by) {
    return redirect('/invite?message=This invite code has already been used.');
  }
  
  if (new Date(invite.expires_at) < new Date()) {
    return redirect('/invite?message=This invite code has expired.');
  }

  if (!invite.is_active) {
    return redirect('/invite?message=This invite code is not currently active.');
  }

  // If the code is valid, store it in a cookie and redirect to signup
  cookieStore.set('invite_code', code, {
    path: '/',
    maxAge: 60 * 15, // 15 minutes
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  });

  redirect('/signup');
} 