import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const declareLimiter = rateLimit({ name: 'application-declare', maxRequests: 10, windowMs: 60 * 60 * 1000 })

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  const { success } = declareLimiter.check(ip)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests, please try again later' }, { status: 429 })
  }

  try {
    const { email, scheme, name, position } = await request.json()

    if (!email || !scheme || !name || !position) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify application exists and is paid
    const { data: app } = await supabase
      .from('applications')
      .select('paid')
      .eq('email', email)
      .eq('scheme', scheme)
      .maybeSingle()

    if (!app || !app.paid) {
      return NextResponse.json({ error: 'Application not found or not paid' }, { status: 404 })
    }

    await supabase
      .from('applications')
      .update({
        status: 'declared',
        declared_at: new Date().toISOString(),
        declared_by_name: name,
        declared_by_position: position,
      })
      .eq('email', email)
      .eq('scheme', scheme)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Declaration error:', err)
    return NextResponse.json({ error: 'Declaration failed' }, { status: 500 })
  }
}
