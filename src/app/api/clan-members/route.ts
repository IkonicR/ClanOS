import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getClanMembers } from '@/lib/coc-api';

// Helper function to get the profile ID from a player tag.
// This is needed to associate CoC player data with our application's user profiles.
async function getProfileIdByPlayerTag(supabase: any, playerTag: string): Promise<string | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('player_tag', playerTag)
        .single();
    
    if (error || !data) {
        // This can happen if a clan member hasn't signed up for the app yet.
        return null;
    }
    return data.id;
}


export async function GET() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First, get the current user's clan tag (prioritizing active linked profile)
    const { data: currentUserProfile, error: profileError } = await supabase
        .from('profiles')
        .select('clan_tag')
        .eq('id', user.id)
        .single();

    if (profileError || !currentUserProfile) {
        return NextResponse.json({ error: 'Could not retrieve user profile.' }, { status: 500 });
    }

    // Check for active linked profile
    const { data: activeLinkedProfile } = await supabase
        .from('linked_profiles')
        .select('clan_tag')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();
    
    // Use active linked profile's clan_tag if available, otherwise fall back to main profile
    const clanTag = activeLinkedProfile?.clan_tag || currentUserProfile.clan_tag;
    if (!clanTag) {
        return NextResponse.json({ error: 'User is not in a clan.' }, { status: 404 });
    }

    try {
        // 1. Fetch all members from the Clash of Clans API
        const memberData = await getClanMembers(clanTag);
        if (!memberData || !memberData.items) {
             return NextResponse.json([]);
        }

        // 2. Fetch all of the current user's friendships from our database
        const { data: friends, error: friendsError } = await supabase
            .from('friends')
            .select('*')
            .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
        
        if (friendsError) {
             console.error('Error fetching friendships:', friendsError);
             // We can still proceed, just without the friend status
        }
        
        // 3. Get all profile mappings for the members in the clan
        const memberTags = memberData.items.map((m: any) => m.tag);
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, player_tag')
            .in('player_tag', memberTags);

        const profileMap = new Map(profiles?.map(p => [p.player_tag, p.id]) ?? []);

        // 4. Combine the data
        const membersWithFriendship = memberData.items.map((member: any) => {
            const memberProfileId = profileMap.get(member.tag);
            let friendshipStatus = null;

            if (friends && memberProfileId) {
                const friendInfo = friends.find(f => 
                    (f.requester_id === user.id && f.addressee_id === memberProfileId) ||
                    (f.requester_id === memberProfileId && f.addressee_id === user.id)
                );
                if (friendInfo) {
                    friendshipStatus = {
                        id: friendInfo.id,
                        status: friendInfo.status,
                        // Determine if the pending request was sent *by me* or *to me*
                        isRequester: friendInfo.requester_id === user.id,
                    };
                }
            }

            return {
                ...member,
                profile_id: memberProfileId, // The app's internal user ID
                friendship: friendshipStatus
            };
        });

        // Filter out the current user from the list
        const filteredMembers = membersWithFriendship.filter((m: any) => m.profile_id !== user.id);

        return NextResponse.json(filteredMembers);

    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error('Error in /api/clan-members:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
} 