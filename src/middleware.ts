import { updateSession, createClient } from '@/lib/supabase/middleware'
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // Refresh session cookies
  const response = await updateSession(request)

  // Auth gate: require login for dashboard and its subroutes
  const pathname = request.nextUrl.pathname
  const isProtectedUI = pathname.startsWith('/dashboard')

  if (isProtectedUI) {
    const { supabase } = createClient(request)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 