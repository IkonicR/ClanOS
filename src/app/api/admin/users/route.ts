import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only platform admins can list all users
    const { data: me } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!me || me.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Use service role to bypass RLS for platform admin listing
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, in_game_name, role, player_tag, clan_tag, updated_at')
      .order('updated_at', { ascending: false })

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
    }

    const userIds = (profiles || []).map((p: any) => p.id)
    // Fetch linked profiles for all users
    const { data: linked, error: linkedError } = await supabaseAdmin
      .from('linked_profiles')
      .select('*')
      .in('user_id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000'])

    if (linkedError) {
      console.error('Error fetching linked profiles:', linkedError)
      return NextResponse.json({ error: 'Failed to fetch linked profiles' }, { status: 500 })
    }

    const userIdToLinked: Record<string, any[]> = {}
    for (const lp of linked || []) {
      const key = lp.user_id
      if (!userIdToLinked[key]) userIdToLinked[key] = []
      userIdToLinked[key].push(lp)
    }

    const result = (profiles || []).map((p: any) => ({
      ...p,
      linked_profiles: userIdToLinked[p.id] || [],
    }))

    return NextResponse.json({ users: result })
  } catch (e) {
    console.error('Error in GET /api/admin/users:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


