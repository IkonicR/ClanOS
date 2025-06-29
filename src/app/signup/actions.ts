'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getPlayerInfo } from '@/lib/coc-api';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getClanInfo } from '@/lib/coc-api';

const FormSchema = z.object({
  playerTag: z.string().trim().min(1, { message: 'Player Tag is required.' }),
  apiToken: z.string().trim().min(1, { message: 'API Token is required.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export async function verifyPlayerAccount(prevState: { message: string }, formData: FormData) {
  const validatedFields = FormSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    // Joining errors to display them all
    const errorMessage = validatedFields.error.issues.map(issue => issue.message).join(' ');
    return {
      message: errorMessage,
    };
  }
  
  const { playerTag, apiToken, email, password } = validatedFields.data;
  const cocApiToken = process.env.CLASH_OF_CLANS_API_TOKEN;

  if (!cocApiToken) {
    return {
      message: 'Clash of Clans API token is not configured on the server.',
    };
  }

  const encodedPlayerTag = encodeURIComponent(playerTag);

  try {
    const res = await fetch(`https://cocproxy.royaleapi.dev/v1/players/${encodedPlayerTag}/verifytoken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cocApiToken}`,
      },
      body: JSON.stringify({ token: apiToken }),
    });

    const verificationData = await res.json();

    if (!res.ok) {
        console.error('API Error:', verificationData);
        return { message: verificationData.reason || 'Failed to verify player token. Please check your inputs.' };
    }

    if (verificationData.status === 'ok') {
      // Player token is valid, now create user in Supabase
      const supabase = createClient();
      const cookieStore = cookies();
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            playerTag: playerTag, // saving player_tag in user metadata
          }
        }
      });

      if (signUpError) {
        console.error('Supabase SignUp Error:', signUpError);
        return { message: signUpError.message };
      }

      if (!user) {
        return { message: 'User registration failed. Please try again.' };
      }
      
      try {
        // Now that the user and profile have been created (by the trigger),
        // fetch clan info and update the profile.
        const playerInfo = await getPlayerInfo(playerTag);

        if (playerInfo && playerInfo.clan) {
            // We need to use the service role key to update the profile
            // because the user doesn't have a session yet.
            const supabaseAdmin = createAdminClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                { auth: { autoRefreshToken: false, persistSession: false } }
            );

            // Map COC role to our role system for new user
            let userRole: string = 'user'; // default
            if (playerInfo.clan && playerInfo.clan.tag) {
                try {
                    const clanData = await getClanInfo(playerInfo.clan.tag);
                    const member = clanData.memberList?.find((m: any) => m.tag === playerTag);
                    
                    if (member) {
                        switch (member.role.toLowerCase()) {
                            case 'leader':
                                userRole = 'leader';
                                break;
                            case 'co-leader':
                            case 'coleader':
                                userRole = 'coLeader';
                                break;
                            case 'elder':
                                userRole = 'elder';
                                break;
                            case 'member':
                            default:
                                userRole = 'user';
                                break;
                        }
                    }
                } catch (roleError) {
                    console.warn('Could not determine role during signup:', roleError);
                }
            }

            const { error: profileUpdateError } = await supabaseAdmin
                .from('profiles')
                .update({ 
                    clan_tag: playerInfo.clan.tag,
                    clan_name: playerInfo.clan.name,
                    username: playerInfo.name,
                    in_game_name: playerInfo.name,
                    role: userRole
                })
                .eq('id', user.id);

            if (profileUpdateError) {
                console.error('Failed to update profile with clan info:', profileUpdateError);
                return { message: 'We could not update your profile with your clan information. Please try signing up again.' };
            }
        }
      } catch (apiError) {
          console.error("Could not fetch player info after signup: ", apiError);
          return { message: 'We could not fetch your player information from the Clash of Clans API. Please ensure your player tag is correct and try again.' };
      }

      // Invalidate the invite code
      const inviteCode = cookieStore.get('invite_code')?.value;
      if (inviteCode) {
        await supabase
          .from('invite_codes')
          .update({ used_by: user.id, used_at: new Date().toISOString() })
          .eq('code', inviteCode);
        
        // Clear the cookie
        cookieStore.delete('invite_code');
      }

      // If there's no error, the user was created.
      // Redirect to the dashboard page.
      redirect('/dashboard');
    } else {
      return { message: verificationData.reason || 'Verification failed. The token may be invalid or expired.' };
    }
  } catch (error: any) {
    if (error.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    console.error('Network or other error:', error);
    return { message: 'An unexpected error occurred. Please try again.' };
  }
} 