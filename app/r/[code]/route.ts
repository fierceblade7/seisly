import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://seisly.com'

  // Look up the code
  const { data } = await supabase
    .from('referral_codes')
    .select('code, is_active')
    .eq('code', code.toUpperCase())
    .maybeSingle()

  if (!data || !data.is_active) {
    return NextResponse.redirect(`${baseUrl}/eligibility`)
  }

  // Set referral cookie and redirect
  const response = NextResponse.redirect(`${baseUrl}/eligibility?ref=valid`)
  response.cookies.set('seisly_referral', code.toUpperCase(), {
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  })

  return response
}
