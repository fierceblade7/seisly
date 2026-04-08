import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextRequest, NextResponse } from "next/server"

const ALLOWED_ORIGINS = ['https://www.seisly.com', 'https://seisly.com', 'http://localhost:3000']

// Allowlist of OTP types we accept on the verify branch. Must match the
// `type` parameter Supabase puts in the magic link template (`magiclink`)
// plus a few related flows in case the same callback is reused later.
// Tampering with the URL to use any other type results in a redirect to
// /login with auth_failed.
const ALLOWED_OTP_TYPES = new Set(['magiclink', 'recovery', 'signup', 'email', 'email_change'])

export async function GET(request: NextRequest) {
  const { searchParams, origin: rawOrigin } = new URL(request.url)
  const origin = ALLOWED_ORIGINS.includes(rawOrigin) ? rawOrigin : 'https://www.seisly.com'
  const code = searchParams.get("code")
  const tokenHash = searchParams.get("token_hash")
  const otpType = searchParams.get("type")
  const next = searchParams.get("next")

  // Helper: redirect to a safe destination after a successful auth.
  // Honours ?next= if it's a same-origin path; otherwise sends to /dashboard.
  const successRedirect = () => {
    if (next && next.startsWith('/') && !next.startsWith('//')) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    return NextResponse.redirect(`${origin}/dashboard`)
  }

  // PRIMARY PATH: token_hash flow (the magic link template now uses
  // ?token_hash=...&type=magiclink — no PKCE code verifier required, so
  // it works across browsers, devices and email-client-opened-in-new-tab).
  if (tokenHash && otpType) {
    if (!ALLOWED_OTP_TYPES.has(otpType)) {
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType as 'magiclink' | 'recovery' | 'signup' | 'email' | 'email_change',
    })
    if (!error && user?.email) {
      return successRedirect()
    }
    console.error('[auth/callback] verifyOtp failed', { otpType, error: error?.message })
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // BACKWARDS-COMPAT PATH: PKCE code flow. Any magic links that were
  // generated under the old template (?code=...) will still work — but
  // they will fail for users whose browser doesn't have the code verifier
  // in localStorage (the bug we just fixed). This branch can be removed
  // a few days after launch once we're confident no old-format links
  // are still in inboxes.
  if (code) {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && user?.email) {
      return successRedirect()
    }
    console.error('[auth/callback] exchangeCodeForSession failed', { error: error?.message })
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
