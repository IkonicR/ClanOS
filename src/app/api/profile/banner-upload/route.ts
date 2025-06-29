import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';

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
  const bannerFile = formData.get('banner') as File | null;

  if (!bannerFile) {
    return new NextResponse(JSON.stringify({ error: 'No banner file provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const filePath = `${user.id}/${Date.now()}-${bannerFile.name}`;

  const supabaseAdmin = createAdminClient();
  const { error: uploadError } = await supabaseAdmin.storage
    .from('banners')
    .upload(filePath, bannerFile, {
      cacheControl: '3600',
      upsert: true, 
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    return new NextResponse(JSON.stringify({ error: 'Failed to upload banner' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: { publicUrl } } = supabaseAdmin.storage.from('banners').getPublicUrl(filePath);

  if (!publicUrl) {
    return new NextResponse(JSON.stringify({ error: 'Failed to get public URL' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  const { error: dbError } = await supabase
    .from('profiles')
    .update({ banner_url: publicUrl })
    .eq('id', user.id);

  if (dbError) {
    console.error('Database error:', dbError);
    return new NextResponse(JSON.stringify({ error: 'Failed to update profile' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return NextResponse.json({ banner_url: publicUrl });
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
    .update({ banner_url: null })
    .eq('id', user.id);

  if (dbError) {
    console.error('Database error on delete:', dbError);
    return new NextResponse(JSON.stringify({ error: 'Failed to remove banner' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return NextResponse.json({ message: 'Banner removed successfully' });
} 