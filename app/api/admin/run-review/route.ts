import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const password = request.headers.get('x-admin-password')
  if (password !== (process.env.ADMIN_PASSWORD || 'seisly-admin-2026')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { email, scheme } = await request.json()
    if (!email || !scheme) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Mark review as in progress
    await supabase
      .from('applications')
      .update({
        review_status: 'in_progress',
        review_started_at: new Date().toISOString(),
        review_released: false,
      })
      .eq('email', email)
      .eq('scheme', scheme)

    // Trigger review in background
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    fetch(`${baseUrl}/api/review/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.INTERNAL_SECRET || 'seisly-internal',
      },
      body: JSON.stringify({ email, scheme }),
    }).catch(err => console.error('Background review trigger failed:', err))

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Run review error:', err)
    return NextResponse.json({ error: 'Failed to start review' }, { status: 500 })
  }
}
