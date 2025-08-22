import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params
  if (provider !== 'google') {
    return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 })
  }

  const supabase = createClient()
  const url = new URL(request.url)
  const origin = url.origin
  const next = url.searchParams.get('next') || '/dashboard'
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto')
  let inferredFromForward = origin
  if (forwardedHost) {
    const isLocal = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(forwardedHost)
    const scheme = forwardedProto || (isLocal ? 'http' : 'https')
    inferredFromForward = `${scheme}://${forwardedHost}`
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || inferredFromForward

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // Use a clean callback URL; we'll decide the final destination in the callback
      redirectTo: `${appUrl}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error || !data?.url) {
    return NextResponse.json({ error: error?.message || 'Failed to start OAuth flow' }, { status: 500 })
  }

  return NextResponse.redirect(data.url)
}


