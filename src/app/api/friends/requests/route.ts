import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // We need to fetch requests where the current user is the addressee
    // and the status is 'pending'. We also want to get the profile
    // information of the user who *sent* the request (the requester).
    const { data, error } = await supabase
        .from('friends')
        .select(`
            id,
            created_at,
            status,
            requester:profiles!friends_requester_id_fkey (
                id,
                username,
                avatar_url
            )
        `)
        .eq('addressee_id', user.id)
        .eq('status', 'pending');

    if (error) {
        console.error('Error fetching friend requests:', error);
        return NextResponse.json({ error: 'Failed to fetch friend requests.' }, { status: 500 });
    }

    return NextResponse.json(data);
} 