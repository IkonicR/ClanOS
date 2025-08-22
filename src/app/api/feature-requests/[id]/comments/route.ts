import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
    request: Request,
    context: any
) {
    const supabase = createClient();
    const { params } = context || {}
    const { id: request_id } = params || {};
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'You must be logged in to comment.' }, { status: 401 });
    }

    const { content } = await request.json();
    if (!content) {
        return NextResponse.json({ error: 'Comment content is required.' }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('feature_request_comments')
        .insert({
            request_id,
            user_id: user.id,
            content,
        })
        .select()
        .single();

    if (error) {
        console.error('Error posting comment:', error);
        return NextResponse.json({ error: 'Failed to post comment.' }, { status: 500 });
    }

    return NextResponse.json(data);
} 