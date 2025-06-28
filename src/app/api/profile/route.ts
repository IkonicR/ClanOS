import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

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
                        return NextResponse.json({ ...updatedProfile, email: user.email });
                    }
                }
            }
        } catch (e) {
            console.error('Error during auto clan-linking:', e);
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

    const { location, languages, username, bio, birthday, social_links } = await request.json();

    const { data, error } = await supabase
        .from('profiles')
        .update({
            location,
            languages,
            username,
            bio,
            birthday,
            social_links,
            updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json(data);
} 