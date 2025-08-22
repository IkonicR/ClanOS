import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPlayerInfo, getClanInfo } from '@/lib/coc-api'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const supabase = createClient()

  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  // Decide destination based on cookie or default
  let next = '/dashboard'
  const hinted = url.searchParams.get('next')
  if (hinted && hinted.startsWith('/')) next = hinted

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(new URL('/login?message=Auth%20error', req.url))
    }
  }

  // Ensure session cookies are set
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.redirect(new URL('/login?message=No%20session%20after%20OAuth', req.url))
  }

  // If we have a verified player tag cookie from step 1, finish profile enrichment here
  // Also create/activate a linked profile and update the user's main profile
  try {
    const cookiePlayerTag = req.cookies.get('verified_player_tag')?.value
    if (cookiePlayerTag) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const playerTag = cookiePlayerTag.startsWith('#') ? cookiePlayerTag : `#${cookiePlayerTag}`
        let playerInfo: any = null
        try {
          playerInfo = await getPlayerInfo(playerTag)
        } catch {}

        // Determine role from clan membership
        let derivedRole = 'user'
          let clanTag: string | null = null
          if (playerInfo?.clan?.tag) {
            clanTag = String(playerInfo.clan.tag)
          try {
            const clanData = await getClanInfo(clanTag as string)
            const member = clanData?.memberList?.find((m: any) => m.tag === playerTag)
            const role = (member?.role || '').toLowerCase()
            if (role === 'leader') derivedRole = 'leader'
            else if (role === 'co-leader' || role === 'coleader') derivedRole = 'coLeader'
            else if (role === 'elder') derivedRole = 'elder'
          } catch {}
        }

        // Deactivate existing linked profiles, then upsert the new active one
        await supabase
          .from('linked_profiles')
          .update({ is_active: false })
          .eq('user_id', user.id)

        const { data: existingLinked } = await supabase
          .from('linked_profiles')
          .select('*')
          .eq('user_id', user.id)
          .eq('player_tag', playerTag)
          .single()

        let activeProfileId: string | null = null
        if (existingLinked) {
          const { data: updatedLinked } = await supabase
            .from('linked_profiles')
            .update({
              clan_tag: clanTag,
              in_game_name: playerInfo?.name ?? null,
              role: derivedRole,
              is_active: true,
            })
            .eq('id', existingLinked.id)
            .select()
            .single()
          activeProfileId = updatedLinked?.id ?? existingLinked.id
        } else {
          const { data: insertedLinked } = await supabase
            .from('linked_profiles')
            .insert({
              user_id: user.id,
              player_tag: playerTag,
              clan_tag: clanTag,
              in_game_name: playerInfo?.name ?? null,
              role: derivedRole,
              is_active: true,
            })
            .select()
            .single()
          activeProfileId = insertedLinked?.id ?? null
        }

        // If invite cookie present, apply any role elevation and mark invite used
        let finalRole = derivedRole
        try {
          const inviteCode = req.cookies.get('invite_code')?.value
          if (inviteCode) {
            const supabaseAdmin = createAdminClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY!,
              { auth: { autoRefreshToken: false, persistSession: false } }
            )
            const { data: invite } = await supabaseAdmin
              .from('invite_codes')
              .select('role_level')
              .eq('code', inviteCode)
              .single()
            if (invite?.role_level === 'admin') {
              finalRole = 'admin'
            }
            await supabaseAdmin
              .from('invite_codes')
              .update({ used_by: user.id, used_at: new Date().toISOString() })
              .eq('code', inviteCode)
          }
        } catch {}

        // Update main profile to reflect active linked profile
        await supabase
          .from('profiles')
          .update({
            active_profile_id: activeProfileId,
            player_tag: playerTag,
            clan_tag: clanTag,
            in_game_name: playerInfo?.name ?? null,
            role: finalRole,
          })
          .eq('id', user.id)

        // Clear cookies and redirect
        const redirectUrl = new URL(next, req.url)
        const response = NextResponse.redirect(redirectUrl)
        response.cookies.set({ name: 'verified_player_tag', value: '', path: '/', maxAge: 0 })
        response.cookies.set({ name: 'invite_code', value: '', path: '/', maxAge: 0 })
        return response
      }
    }
  } catch {}

  const forwardedHost = req.headers.get('x-forwarded-host')
  const forwardedProto = req.headers.get('x-forwarded-proto')
  const origin = new URL(req.url).origin
  let base = origin
  if (forwardedHost) {
    const isLocal = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(forwardedHost)
    const scheme = forwardedProto || (isLocal ? 'http' : 'https')
    base = `${scheme}://${forwardedHost}`
  }
  return NextResponse.redirect(`${base}${next}`)
}


