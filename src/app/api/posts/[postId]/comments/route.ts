import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { postId: string } }) {
    const supabase = createClient();
    const { postId } = params;

    const { data: comments, error } = await supabase
        .from('comments')
        .select(`
            id,
            content,
            created_at,
            profiles (
                username,
                avatar_url
            )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching comments:', error);
        return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }

    return NextResponse.json(comments);
}

export async function POST(request: Request, { params }: { params: { postId: string } }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = params;
    const { content } = await request.json();

    const { data: newComment, error } = await supabase
        .from('comments')
        .insert({ post_id: postId, user_id: user.id, content })
        .select(`
            id,
            content,
            created_at,
            profiles (
                username,
                avatar_url
            )
        `)
        .single();

    if (error) {
        console.error('Error creating comment:', error);
        return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }
    
    return NextResponse.json(newComment, { status: 201 });
} 