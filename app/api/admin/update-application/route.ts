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
    const { email, scheme, updates } = await request.json()
    if (!email || !scheme || !updates) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const { error } = await supabase
      .from('applications')
      .update(updates)
      .eq('email', email)
      .eq('scheme', scheme)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin update error:', err)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
