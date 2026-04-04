import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const waitlistLimiter = rateLimit({ name: 'waitlist', maxRequests: 5, windowMs: 24 * 60 * 60 * 1000 })

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  const { success } = waitlistLimiter.check(ip)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests, please try again later' }, { status: 429 })
  }

  try {
    const { email, scheme, source } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('waitlist')
      .insert({ email: email.toLowerCase().trim(), scheme: scheme || null, source: source || 'landing' })

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ success: true, message: 'already_exists' })
      }
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Waitlist error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
