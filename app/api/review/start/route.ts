import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { email, scheme } = await request.json()
    const effectiveScheme = scheme || 'seis'

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 })
    }

    // Mark review as started
    await supabase
      .from('applications')
      .update({
        review_status: 'in_progress',
        review_started_at: new Date().toISOString(),
      })
      .eq('email', email)
      .eq('scheme', effectiveScheme)

    // Trigger review in background (non-blocking)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    fetch(`${baseUrl}/api/review/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, scheme: effectiveScheme }),
    }).catch(err => console.error('Background review trigger failed:', err))

    return NextResponse.json({ success: true, status: 'in_progress' })
  } catch (err) {
    console.error('Review start error:', err)
    return NextResponse.json({ error: 'Failed to start review' }, { status: 500 })
  }
}
