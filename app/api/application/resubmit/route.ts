import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resubmitLimiter = rateLimit({ name: 'application-resubmit', maxRequests: 5, windowMs: 60 * 60 * 1000 })

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  const { success } = await resubmitLimiter.check(ip)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests, please try again later' }, { status: 429 })
  }

  try {
    const { email, scheme } = await request.json()
    if (!email || !scheme) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Check if free resubmission is available
    const { data: original } = await supabase
      .from('applications')
      .select('free_resubmission_available, free_resubmission_used, status')
      .eq('email', email)
      .eq('scheme', scheme)
      .eq('status', 'declined')
      .maybeSingle()

    if (!original || !original.free_resubmission_available || original.free_resubmission_used) {
      return NextResponse.json({ error: 'Free resubmission not available' }, { status: 400 })
    }

    // Mark original as resubmission used
    await supabase
      .from('applications')
      .update({
        free_resubmission_used: true,
        free_resubmission_available: false,
      })
      .eq('email', email)
      .eq('scheme', scheme)
      .eq('status', 'declined')

    return NextResponse.json({ success: true, skipPayment: true })
  } catch (err) {
    console.error('Resubmit error:', err)
    return NextResponse.json({ error: 'Resubmission failed' }, { status: 500 })
  }
}
