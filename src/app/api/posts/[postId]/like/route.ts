import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request, context: any) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { params } = context || {}
    const { postId } = params || {};

    const { error } = await supabase
        .from('likes')
        .insert({ post_id: postId, user_id: user.id });

    if (error) {
        // If the like already exists, it's not a server error.
        // We can ignore the duplicate key violation.
        if (error.code === '23505') {
            return NextResponse.json({ message: 'Already liked' }, { status: 200 });
        }
        console.error('Error liking post:', error);
        return NextResponse.json({ error: 'Failed to like post' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Post liked' }, { status: 201 });
}

export async function DELETE(request: Request, context: any) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { params } = context || {}
    const { postId } = params || {};

    const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error unliking post:', error);
        return NextResponse.json({ error: 'Failed to unlike post' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Post unliked' }, { status: 200 });
} 