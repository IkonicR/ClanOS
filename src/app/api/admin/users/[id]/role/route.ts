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

    const body = await request.json()
    const newRole = (body?.role || '').trim()
    const allowed = ['admin', 'leader', 'coLeader', 'elder', 'user']
    if (!allowed.includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Use service role to avoid any RLS limitations when updating other users
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, role')

    if (error) {
      console.error('Error updating role:', error)
      return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
    }
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'No rows updated' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Role updated', role: data[0].role })
  } catch (e) {
    console.error('Error in PATCH /api/admin/users/[id]/role:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


