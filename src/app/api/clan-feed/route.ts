import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: posts, error } = await supabase.rpc('get_posts_with_likes', {
        current_user_id: user.id
    });

    if (error) {
        console.error('Error fetching posts:', error);
        return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }

    type PostFromRpc = {
        id: string;
        content: string;
        created_at: string;
        username: string;
        avatar_url: string;
        likes_count: number;
        is_liked_by_user: boolean;
        user_id: string;
    }

    const formattedPosts = posts.map((post: PostFromRpc) => ({
        id: post.id,
        content: post.content,
        created_at: post.created_at,
        author: post.username,
        avatar_url: post.avatar_url,
        likes: post.likes_count,
        isLiked: post.is_liked_by_user,
        author_id: post.user_id,
    }));

    return NextResponse.json(formattedPosts);
}


export async function POST(request: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content } = await request.json();

    const { data: newPost, error } = await supabase
        .from('posts')
        .insert({ content, user_id: user.id })
        .select(`
            id,
            content,
            created_at,
            profiles:profiles!posts_user_id_fkey (
                username,
                avatar_url
            )
        `)
        .single();

    if (error) {
        console.error('Error creating post:', error);
        return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }

    const profile = Array.isArray(newPost.profiles) ? newPost.profiles[0] : newPost.profiles;

    const formattedPost = {
        id: newPost.id,
        content: newPost.content,
        created_at: newPost.created_at,
        author: profile?.username ?? 'Unknown User',
        avatar_url: profile?.avatar_url,
        likes: 0,
        isLiked: false,
        author_id: user.id,
    };

    return NextResponse.json(formattedPost, { status: 201 });
} 