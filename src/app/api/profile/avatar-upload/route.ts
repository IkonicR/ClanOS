import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const formData = await request.formData();
  const avatarFile = formData.get('avatar') as File | null;

  if (!avatarFile) {
    return new NextResponse(JSON.stringify({ error: 'No avatar file provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const filePath = `${user.id}/${Date.now()}-${avatarFile.name}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('avatars')
    .upload(filePath, avatarFile, {
      cacheControl: '3600',
      upsert: true, 
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    return new NextResponse(JSON.stringify({ error: 'Failed to upload avatar' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: { publicUrl } } = supabaseAdmin.storage.from('avatars').getPublicUrl(filePath);

  if (!publicUrl) {
    return new NextResponse(JSON.stringify({ error: 'Failed to get public URL' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  const { error: dbError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id);

  if (dbError) {
    console.error('Database error:', dbError);
    return new NextResponse(JSON.stringify({ error: 'Failed to update profile' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return NextResponse.json({ avatar_url: publicUrl });
}

export async function DELETE(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { error: dbError } = await supabase
    .from('profiles')
    .update({ avatar_url: null })
    .eq('id', user.id);

  if (dbError) {
    console.error('Database error on delete:', dbError);
    return new NextResponse(JSON.stringify({ error: 'Failed to remove avatar' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return NextResponse.json({ message: 'Avatar removed successfully' });
} 