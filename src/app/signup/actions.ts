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
  email: z.string().email({ message: 'Please enter a valid email.' }).optional(),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }).optional(),
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
      const supabase = createClient();
      const cookieStore = await cookies();
      // If user is already authenticated (e.g., via Google), skip email/password sign up
      const { data: { session } } = await supabase.auth.getSession();
      let user = session?.user ?? null;
      let signUpError: any = null;

      if (!user) {
        if (!email || !password) {
          return { message: 'Email and Password are required when not signed in.' };
        }
        const signUpRes = await supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            data: {
              playerTag: playerTag,
            }
          }
        });
        signUpError = signUpRes.error;
        user = signUpRes.data.user;
      }

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
      const inviteCode = (await cookieStore).get('invite_code')?.value;
      if (inviteCode) {
        await supabase
          .from('invite_codes')
          .update({ used_by: user.id, used_at: new Date().toISOString() })
          .eq('code', inviteCode);
        
        // Clear the cookie
        cookieStore.delete('invite_code');
      }

      // If there's no error, ensure we have a session and redirect
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

// New: Step 1 - Verify only, store cookie
const VerifyFormSchema = z.object({
  playerTag: z.string().trim().min(1, { message: 'Player Tag is required.' }),
  apiToken: z.string().trim().min(1, { message: 'API Token is required.' }),
});

export async function verifyPlayerToken(prevState: { message: string; success?: boolean }, formData: FormData) {
  const validated = VerifyFormSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!validated.success) {
    const msg = validated.error.issues.map(i => i.message).join(' ');
    return { message: msg };
  }
  const { playerTag, apiToken } = validated.data;
  const cocApiToken = process.env.CLASH_OF_CLANS_API_TOKEN;
  if (!cocApiToken) {
    return { message: 'Clash of Clans API token is not configured on the server.' };
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
    if (!res.ok || verificationData.status !== 'ok') {
      return { message: verificationData.reason || 'Failed to verify player token. Please check your inputs.' };
    }
    // Store short-lived cookie with verified tag
    const cookieStore = await cookies();
    ;(await cookieStore).set('verified_player_tag', playerTag, {
      path: '/',
      maxAge: 60 * 15, // 15 minutes
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });
    return { message: '', success: true };
  } catch (e) {
    return { message: 'An unexpected error occurred during verification.' };
  }
}

// New: Step 2 (Email) - Complete signup using verified cookie
const EmailFormSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export async function completeSignupWithEmail(prevState: { message: string }, formData: FormData) {
  const validated = EmailFormSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!validated.success) {
    const msg = validated.error.issues.map(i => i.message).join(' ');
    return { message: msg };
  }
  const { email, password } = validated.data;
  const supabase = createClient();
    const cookieStore = await cookies();
    const playerTag = (await cookieStore).get('verified_player_tag')?.value;

  if (!playerTag) {
    return { message: 'Please verify your player tag first.' };
  }

  const { data: { user }, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { playerTag } },
  });
  if (signUpError) {
    return { message: signUpError.message };
  }
  if (!user) {
    return { message: 'User registration failed. Please try again.' };
  }

  try {
    const playerInfo = await getPlayerInfo(playerTag);
    let userRole: string = 'user';
    if (playerInfo && playerInfo.clan && playerInfo.clan.tag) {
      try {
        const clanData = await getClanInfo(playerInfo.clan.tag);
        const member = clanData.memberList?.find((m: any) => m.tag === playerTag);
        if (member) {
          switch ((member.role || '').toLowerCase()) {
            case 'leader': userRole = 'leader'; break;
            case 'co-leader':
            case 'coleader': userRole = 'coLeader'; break;
            case 'elder': userRole = 'elder'; break;
            default: userRole = 'user';
          }
        }
      } catch {}
    }

    // Apply admin role if the invite code was created as admin
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    // If invite has role_level === 'admin', elevate profile role
    let finalRole = userRole;
    const inviteCode = (await cookieStore).get('invite_code')?.value;
    if (inviteCode) {
      const { data: invite } = await supabase
        .from('invite_codes')
        .select('role_level')
        .eq('code', inviteCode)
        .single();
      if (invite?.role_level === 'admin') {
        finalRole = 'admin';
      }
    }

    // Create/activate a linked profile for this tag
    // Deactivate others first
    await supabaseAdmin
      .from('linked_profiles')
      .update({ is_active: false })
      .eq('user_id', user.id);

    const { data: existingLinked } = await supabaseAdmin
      .from('linked_profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('player_tag', playerTag)
      .single();

    let activeProfileId: string | null = null;
    if (existingLinked) {
      const { data: updatedLinked } = await supabaseAdmin
        .from('linked_profiles')
        .update({
          clan_tag: playerInfo?.clan?.tag ?? null,
          in_game_name: playerInfo?.name ?? null,
          role: finalRole,
          is_active: true,
        })
        .eq('id', existingLinked.id)
        .select()
        .single();
      activeProfileId = updatedLinked?.id ?? existingLinked.id;
    } else {
      const { data: insertedLinked } = await supabaseAdmin
        .from('linked_profiles')
        .insert({
          user_id: user.id,
          player_tag: playerTag,
          clan_tag: playerInfo?.clan?.tag ?? null,
          in_game_name: playerInfo?.name ?? null,
          role: finalRole,
          is_active: true,
        })
        .select()
        .single();
      activeProfileId = insertedLinked?.id ?? null;
    }

    // Update main profile to reflect active linked profile and persist tags
    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({
        active_profile_id: activeProfileId,
        player_tag: playerTag,
        clan_tag: playerInfo?.clan?.tag ?? null,
        username: playerInfo?.name ?? null,
        in_game_name: playerInfo?.name ?? null,
        role: finalRole,
      })
      .eq('id', user.id);
    if (profileUpdateError) {
      return { message: 'We could not update your profile with your clan information.' };
    }

    // Invalidate invite and clear cookies
    if (inviteCode) {
      await supabase
        .from('invite_codes')
        .update({ used_by: user.id, used_at: new Date().toISOString() })
        .eq('code', inviteCode);
      ;(await cookieStore).delete('invite_code');
    }
    ;(await cookieStore).delete('verified_player_tag');
  } catch (e) {
    return { message: 'We could not complete your signup.' };
  }

  redirect('/dashboard');
}