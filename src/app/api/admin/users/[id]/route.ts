import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Remove user using service role (auth admin)
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Delete Auth user
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)
    if (authError) {
      console.error('Error deleting auth user:', authError)
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }

    // Clean up related rows
    await supabaseAdmin
      .from('linked_profiles')
      .delete()
      .eq('user_id', id)

    await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', id)

    return NextResponse.json({ message: 'User deleted' })
  } catch (e) {
    console.error('Error in DELETE /api/admin/users/[id]:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


