import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: me } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!me || me.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const username = typeof body?.username === 'string' ? body.username.trim() : undefined
    const in_game_name = typeof body?.in_game_name === 'string' ? body.in_game_name.trim() : undefined

    if (username === undefined && in_game_name === undefined) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const update: any = { updated_at: new Date().toISOString() }
    if (username !== undefined) update.username = username
    if (in_game_name !== undefined) update.in_game_name = in_game_name

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(update)
      .eq('id', id)
      .select('id, username, in_game_name')

    if (error) {
      console.error('Error updating profile:', error)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Profile updated', profile: data?.[0] })
  } catch (e) {
    console.error('Error in PATCH /api/admin/users/[id]/profile:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


