import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { addressee_id } = await request.json();

    if (!addressee_id) {
        return NextResponse.json({ error: 'Addressee ID is required' }, { status: 400 });
    }

    if (addressee_id === user.id) {
        return NextResponse.json({ error: 'You cannot send a friend request to yourself' }, { status: 400 });
    }

    // Check if a relationship already exists
    const { data: existingFriendship, error: existingError } = await supabase
        .from('friends')
        .select('*')
        .or(`(requester_id.eq.${user.id},addressee_id.eq.${addressee_id}),(requester_id.eq.${addressee_id},addressee_id.eq.${user.id})`)
        .single();
    
    if (existingFriendship) {
        return NextResponse.json({ error: 'A friend request has already been sent or you are already friends.' }, { status: 409 });
    }

    const { data, error } = await supabase
        .from('friends')
        .insert({
            requester_id: user.id,
            addressee_id,
            status: 'pending',
        })
        .select()
        .single();

    if (error) {
        console.error('Error sending friend request:', error);
        return NextResponse.json({ error: 'Failed to send friend request.' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
}

export async function PUT(request: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { friendship_id, status } = await request.json();

    if (!friendship_id || !status) {
        return NextResponse.json({ error: 'Friendship ID and status are required' }, { status: 400 });
    }
    
    if (!['accepted', 'blocked'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Verify the current user is the addressee of the request they are trying to update
    const { data: friendship, error: fetchError } = await supabase
        .from('friends')
        .select('addressee_id')
        .eq('id', friendship_id)
        .single();

    if (fetchError || friendship?.addressee_id !== user.id) {
        return NextResponse.json({ error: 'You are not authorized to update this friend request.' }, { status: 403 });
    }

    const { data, error } = await supabase
        .from('friends')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', friendship_id)
        .select()
        .single();

    if (error) {
        console.error('Error updating friend request:', error);
        return NextResponse.json({ error: 'Failed to update friend request.' }, { status: 500 });
    }

    return NextResponse.json(data);
}


export async function DELETE(request: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { friendship_id } = await request.json();

    if (!friendship_id) {
        return NextResponse.json({ error: 'Friendship ID is required' }, { status: 400 });
    }

    // To unfriend, the user can be either the requester or addressee.
    const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', friendship_id)
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);


    if (error) {
        console.error('Error removing friend:', error);
        return NextResponse.json({ error: 'Failed to remove friend.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Friend removed successfully' }, { status: 200 });
} 