import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
    request: Request,
    context: any
) {
    const supabase = createClient();
    const { params } = context || {}
    const { id } = params || {};

    const { data, error } = await supabase
        .from('feature_requests')
        .select(`
            id,
            title,
            description,
            feature_request_comments (
                id,
                content,
                created_at,
                profiles (
                    id,
                    username,
                    avatar_url
                )
            )
        `)
        .eq('id', id)
        .order('created_at', { foreignTable: 'feature_request_comments', ascending: true })
        .single();

    if (error || !data) {
        console.error('Error fetching request details:', error);
        return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const { feature_request_comments, ...requestData } = data;

    const combinedComments = feature_request_comments.map((comment: any) => ({
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        author_name: comment.profiles?.[0]?.username || 'Anonymous',
        author_avatar: comment.profiles?.[0]?.avatar_url || null
    }));

    const response = {
        ...requestData,
        comments: combinedComments,
    };

    return NextResponse.json(response);
} 