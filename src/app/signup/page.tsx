import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SignUpForm from './signup-form'; // We will create this component

export default async function SignUpPage() {
  const cookieStore = await cookies();
  const inviteCode = (await cookieStore).get('invite_code')?.value;

  if (!inviteCode) {
    redirect('/invite?message=An invite code is required to sign up.');
  }

  const supabase = createClient();
  const { data: invite, error } = await supabase
    .from('invite_codes')
    .select('*')
    .eq('code', inviteCode)
    .single();

  if (error || !invite || invite.used_by || new Date(invite.expires_at) < new Date()) {
    // Clear the invalid cookie and redirect
    ;(await cookieStore).delete('invite_code');
    redirect('/invite?message=The invite code is invalid or has expired.');
  }

  return <SignUpForm />;
} 