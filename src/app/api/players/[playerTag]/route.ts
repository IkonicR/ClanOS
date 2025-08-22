import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getPlayerInfo } from '@/lib/coc-api';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ playerTag: string }> }
) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { playerTag } = await params;
    if (!playerTag) {
        return NextResponse.json({ error: 'Player tag is required' }, { status: 400 });
    }

    try {
        const playerData = await getPlayerInfo(playerTag);
        return NextResponse.json(playerData);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: message }, { status: 500 });
    }
} 