import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';

async function getComment(supabase: any, commentId: string) {
    const { data, error } = await supabase
        .from('feature_request_comments')
        .select('user_id')
        .eq('id', commentId)
        .single();
    if (error) return { error };
    return { data };
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string, commentId: string } }
) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { commentId } = params;
    const { content } = await request.json();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!content) return NextResponse.json({ error: 'Content is required' }, { status: 400 });

    const { data: comment, error: fetchError } = await getComment(supabase, commentId);
    if (fetchError || !comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    if (comment.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const supabaseAdmin = createAdminClient();
    const { data: updatedComment, error } = await supabaseAdmin
        .from('feature_request_comments')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', commentId)
        .select()
        .single();

    if (error) return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });

    return NextResponse.json(updatedComment);
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string, commentId: string } }
) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { commentId } = params;

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: comment, error: fetchError } = await getComment(supabase, commentId);
    if (fetchError || !comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    if (comment.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin
        .from('feature_request_comments')
        .delete()
        .eq('id', commentId);

    if (error) return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });

    return NextResponse.json({ message: 'Comment deleted successfully' });
} 