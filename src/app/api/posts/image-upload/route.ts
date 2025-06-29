import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileType } = await request.json();
    const fileExtension = fileType.split('/')[1];
    const fileName = `${randomUUID()}.${fileExtension}`;
    const filePath = fileName;

    try {
        const { data, error } = await supabase
            .storage
            .from('post-images')
            .createSignedUploadUrl(filePath);

        if (error) {
            console.error('Error creating signed URL:', error);
            return NextResponse.json({ error: 'Failed to create signed URL' }, { status: 500 });
        }

        return NextResponse.json({ ...data, path: filePath });
    } catch (error) {
        console.error('Error creating signed URL:', error);
        return NextResponse.json({ error: 'Failed to create signed URL' }, { status: 500 });
    }
} 