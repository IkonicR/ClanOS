import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
  // If signup step cookie exists, send user to complete flow page or directly to dashboard
  try {
    const cookiePlayerTag = req.cookies.get('verified_player_tag')?.value
    if (cookiePlayerTag && next === '/dashboard') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
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


