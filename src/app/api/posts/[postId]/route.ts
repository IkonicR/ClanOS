import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request, context: any) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { params } = context || {}
    const { postId } = params || {};

    // Optional: Check if the user is the owner of the post
    const { data: post, error: fetchError } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();

    if (fetchError || !post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

    if (error) {
        console.error('Error deleting post:', error);
        return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Post deleted' }, { status: 200 });
}

export async function PATCH(request: Request, context: any) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { params } = context || {}
    const { postId } = params || {};
    const { content } = await request.json();

    if (!content) {
        return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const { data: post, error: fetchError } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();

    if (fetchError || !post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabase
        .from('posts')
        .update({ content })
        .eq('id', postId);

    if (error) {
        console.error('Error updating post:', error);
        return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Post updated' }, { status: 200 });
} 