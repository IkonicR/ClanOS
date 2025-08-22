import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || '00000000-0000-0000-0000-000000000000';

    let query = supabase.rpc('get_feature_requests_with_details', { user_id_param: userId });

    if (category) {
        query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching feature requests:', error);
        return NextResponse.json({ error: 'Failed to fetch feature requests' }, { status: 500 });
    }

    return NextResponse.json(data);
}

export async function POST(request: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
        return NextResponse.json({ error: 'Unauthorized or no email provided' }, { status: 401 });
    }

    const { title, description, category } = await request.json();

    if (!title) {
        return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();
    // Temporarily disabled due to schema mismatch
    // const { data, error } = await supabaseAdmin
    //     .from('feature_requests')
    //     .insert({ title, description, category, email: user.email })
    //     .select()
    //     .single();

    // if (error) {
    //     console.error('Error creating feature request:', error);
    //     return NextResponse.json({ error: 'Could not submit feature request.' }, { status: 500 });
    // }

    return NextResponse.json({ message: 'Feature request submission temporarily disabled' });
}

export async function PUT(request: Request) {
    // Temporarily disabled due to database schema issues
    return NextResponse.json({ message: 'Feature request updates temporarily disabled' });
}

export async function DELETE(request: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });

    // Verify the user owns this request before deleting
    const supabaseAdmin = createAdminClient();
    const { data: existing, error: fetchError } = await supabaseAdmin
        .from('feature_requests')
        .select('id, email')
        .eq('id', id)
        .single();

    // Temporarily disabled due to database schema issues
    return NextResponse.json({ message: 'Feature request deletion temporarily disabled' });
} 