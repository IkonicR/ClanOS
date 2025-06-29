import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { autoSyncUserRole } from '@/lib/auto-role-sync';

export async function GET(request: Request) {
    const supabase = createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return new Response('Unauthorized', { status: 401 });
    }

    const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();

    if (error) {
        console.error('Error fetching profile', error);
        return new Response('Error fetching profile', { status: 500 });
    }

    // Check for active linked profile and merge it with main profile
    const { data: activeLinkedProfile } = await supabase
        .from('linked_profiles')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

    // If there's an active linked profile, use its data for COC-related fields
    if (activeLinkedProfile) {
        profile.player_tag = activeLinkedProfile.player_tag;
        profile.clan_tag = activeLinkedProfile.clan_tag;
        profile.in_game_name = activeLinkedProfile.in_game_name;
        profile.role = activeLinkedProfile.role;
    }
    
    // If player_tag exists but clan_tag is missing, try to auto-link
    if (profile && profile.player_tag && !profile.clan_tag) {
        try {
            const playerTagEncoded = encodeURIComponent(profile.player_tag);
            
            const playerRes = await fetch(`https://cocproxy.royaleapi.dev/v1/players/${playerTagEncoded}`, {
                headers: { 'Authorization': `Bearer ${process.env.CLASH_OF_CLANS_API_TOKEN}` }
            });

            if (playerRes.ok) {
                const playerData = await playerRes.json();

                if (playerData.clan && playerData.clan.tag) {
                    const clanTag = playerData.clan.tag;
                    
                    const { data: updatedProfile, error: updateError } = await supabase
                        .from('profiles')
                        .update({ clan_tag: clanTag })
                        .eq('id', user.id)
                        .select()
                        .single();
                    
                    if (!updateError) {
                        // After auto-linking clan, try to sync role
                        await autoSyncUserRole(user.id);
                        
                        // Re-fetch profile data including any linked profile updates
                        const { data: finalProfile } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', user.id)
                            .single();
                        
                        // Re-check for active linked profile after sync
                        const { data: updatedActiveLinkedProfile } = await supabase
                            .from('linked_profiles')
                            .select('*')
                            .eq('user_id', user.id)
                            .eq('is_active', true)
                            .single();

                        if (updatedActiveLinkedProfile) {
                            finalProfile.player_tag = updatedActiveLinkedProfile.player_tag;
                            finalProfile.clan_tag = updatedActiveLinkedProfile.clan_tag;
                            finalProfile.in_game_name = updatedActiveLinkedProfile.in_game_name;
                            finalProfile.role = updatedActiveLinkedProfile.role;
                        }
                        
                        return NextResponse.json({ ...finalProfile, email: user.email });
                    }
                }
            }
        } catch (e) {
            console.error('Error during auto clan-linking:', e);
        }
    }

    // Auto-sync role if user has both clan_tag and player_tag (using the merged profile data)
    if (profile && profile.clan_tag && profile.player_tag) {
        try {
            const syncResult = await autoSyncUserRole(user.id);
            if (syncResult.success && syncResult.updated) {
                // If role was updated, re-fetch the profile data
                const { data: updatedProfile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                
                // Re-check for active linked profile after sync
                const { data: updatedActiveLinkedProfile } = await supabase
                    .from('linked_profiles')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('is_active', true)
                    .single();

                if (updatedActiveLinkedProfile) {
                    updatedProfile.player_tag = updatedActiveLinkedProfile.player_tag;
                    updatedProfile.clan_tag = updatedActiveLinkedProfile.clan_tag;
                    updatedProfile.in_game_name = updatedActiveLinkedProfile.in_game_name;
                    updatedProfile.role = updatedActiveLinkedProfile.role;
                }
                
                return NextResponse.json({ ...updatedProfile, email: user.email });
            }
        } catch (e) {
            console.error('Error during auto role sync:', e);
        }
    }

    return NextResponse.json({ ...profile, email: user.email });
}

export async function POST(request: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bio, social_links } = await request.json();

    const updateData: { bio?: string, social_links?: any, updated_at: string } = {
        updated_at: new Date().toISOString(),
    };

    if (bio !== undefined) {
        updateData.bio = bio;
    }

    if (social_links !== undefined) {
        updateData.social_links = social_links;
    }

    const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json(data);
} 