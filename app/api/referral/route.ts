import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getReferralStats } from '@/lib/referral'

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email')
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

  // Verify auth
  const authClient = await createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user || user.email !== email) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const stats = await getReferralStats(email)
  return NextResponse.json(stats)
}
