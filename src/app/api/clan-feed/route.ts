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
    const feedType = searchParams.get('feed_type') || 'my-clan';
    const pageSize = 10;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Get user's clan_tag for filtering (prioritizing active linked profile)
    const { data: userProfile } = await supabaseServer
        .from('profiles')
        .select('clan_tag')
        .eq('id', user.id)
        .single();

    // Check for active linked profile
    const { data: activeLinkedProfile } = await supabaseServer
        .from('linked_profiles')
        .select('clan_tag')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

    // Use active linked profile's clan_tag if available
    const userClanTag = activeLinkedProfile?.clan_tag || userProfile?.clan_tag;

    // Build the query based on feed type
    let postsQuery = supabaseAdmin
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
        `);

    // Apply filtering based on feed type
    if (feedType === 'my-clan') {
        // Show only posts that were posted TO the clan feed (feed_type='clan' or 'my-clan')
        // AND are from the user's clan
        if (userClanTag) {
            postsQuery = postsQuery
                .in('feed_type', ['clan', 'my-clan'])
                .eq('clan_tag', userClanTag);
        } else {
            // User has no clan, show no clan posts
            postsQuery = postsQuery.eq('feed_type', 'NONEXISTENT');
        }
    } else if (feedType === 'global') {
        // Show only posts that were posted TO the global feed
        postsQuery = postsQuery.eq('feed_type', 'global');
    } else if (feedType === 'group') {
        // Show posts from user's own clan (allied clans feature coming soon)
        if (userClanTag) {
            postsQuery = postsQuery
                .eq('feed_type', 'group')
                .eq('clan_tag', userClanTag);
        } else {
            // User has no clan, show no group posts
            postsQuery = postsQuery.eq('feed_type', 'NONEXISTENT');
        }
    }

        const { data: postsData, error } = await postsQuery
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
            in_game_name: post.profiles?.in_game_name ?? 'Unknown User',
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

    const { content, image_url, feed_type } = await request.json();

    // Get user's clan_tag for posting (prioritizing active linked profile)
    const { data: userProfile } = await supabase
        .from('profiles')
        .select('clan_tag')
        .eq('id', user.id)
        .single();

    // Check for active linked profile
    const { data: activeLinkedProfile } = await supabase
        .from('linked_profiles')
        .select('clan_tag')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

    // Use active linked profile's clan_tag if available
    const userClanTag = activeLinkedProfile?.clan_tag || userProfile?.clan_tag;

    // Determine the feed_type and clan_tag based on the feed the user is posting to
    let postFeedType = feed_type || 'clan'; // Default to clan feed for backward compatibility
    let postClanTag = null;

    if (postFeedType === 'my-clan' || postFeedType === 'clan') {
        // For clan posts, set the clan_tag
        postClanTag = userClanTag;
        postFeedType = 'clan'; // Normalize to 'clan'
    } else if (postFeedType === 'global') {
        // Global posts don't need a clan_tag
        postClanTag = null;
    } else if (postFeedType === 'group') {
        // Group posts will need group_tag in the future, for now use clan_tag
        postClanTag = userClanTag;
    }

    const { data: newPost, error } = await supabase
        .from('posts')
        .insert({ 
            content, 
            user_id: user.id, 
            image_url,
            clan_tag: postClanTag,
            feed_type: postFeedType
        })
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
            in_game_name: profile?.in_game_name ?? 'Unknown User',
            avatar_url: profile?.avatar_url ?? null,
        },
        like_count: 0,
        user_has_liked_post: false,
        image_url: newPost.image_url,
        comment_count: 0,
    };

    return NextResponse.json(formattedPost, { status: 201 });
} 