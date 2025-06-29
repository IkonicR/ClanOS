import { createClient } from '@/lib/supabase/admin';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { Post } from '@/lib/types';

type PostResponse = {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    image_url: string | null;
    profiles: {
      in_game_name: string | null;
      avatar_url: string | null;
    } | null;
    likes: { count: number }[];
    comments: { count: number }[];
}[]

export async function GET(request: Request) {
    const supabaseAdmin = createClient();
    const supabaseServer = createServerClient();
    const { data: { user } } = await supabaseServer.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = 10;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: postsData, error } = await supabaseAdmin
        .from('posts')
        .select(`
            *,
            image_url,
            profiles:profiles!posts_user_id_fkey (
                in_game_name,
                avatar_url
            ),
            likes(count),
            comments(count)
        `)
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) {
        console.error('Error fetching posts:', error);
        return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }

    const posts: PostResponse = postsData as any;

    const postIds = posts.map(p => p.id);
    const { data: userLikes, error: likesError } = await supabaseServer
        .from('likes')
        .select('post_id')
        .in('post_id', postIds)
        .eq('user_id', user.id);

    if (likesError) {
        console.error('Error fetching user likes:', likesError);
        // Continue without like information
    }

    const likedPostIds = new Set(userLikes?.map(l => l.post_id) || []);

    const formattedPosts: Post[] = posts.map((post) => ({
        id: post.id,
        content: post.content,
        created_at: post.created_at,
        user_id: post.user_id,
        image_url: post.image_url,
        profiles: {
            username: post.profiles?.in_game_name ?? 'Unknown User',
            avatar_url: post.profiles?.avatar_url ?? null,
        },
        like_count: post.likes[0]?.count || 0,
        user_has_liked_post: likedPostIds.has(post.id),
        comment_count: post.comments[0]?.count || 0,
    }));

    return NextResponse.json(formattedPosts);
}


export async function POST(request: Request) {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, image_url } = await request.json();

    const { data: newPost, error } = await supabase
        .from('posts')
        .insert({ content, user_id: user.id, image_url })
        .select(`
            id,
            content,
            created_at,
            image_url,
            profiles:profiles!posts_user_id_fkey (
                in_game_name,
                avatar_url
            )
        `)
        .single();

    if (error) {
        console.error('Error creating post:', error);
        return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }

    const profile = Array.isArray(newPost.profiles) ? newPost.profiles[0] : newPost.profiles;

    const formattedPost: Post = {
        id: newPost.id,
        content: newPost.content,
        created_at: newPost.created_at,
        user_id: user.id,
        profiles: {
            username: profile?.in_game_name ?? 'Unknown User',
            avatar_url: profile?.avatar_url ?? null,
        },
        like_count: 0,
        user_has_liked_post: false,
        image_url: newPost.image_url,
        comment_count: 0,
    };

    return NextResponse.json(formattedPost, { status: 201 });
} 