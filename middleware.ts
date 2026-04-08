import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Initialize a response object that we'll return (and potentially mutate
  // via cookie setters during a token refresh).
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: do not write any code between createServerClient() and
  // supabase.auth.getUser(). Per the @supabase/ssr docs, anything in
  // between can interfere with token refresh and cause confusing
  // intermittent auth failures.
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  // Only run middleware on protected routes. Public pages, API routes
  // (which do their own auth checks), Next internals, and static assets
  // are intentionally excluded.
  matcher: [
    '/apply',
    '/apply/:path*',
    '/dashboard',
    '/dashboard/:path*',
    '/admin',
    '/admin/:path*',
  ],
}
