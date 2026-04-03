import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const password = request.headers.get('x-admin-password')
  if (password !== (process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'seisly-admin-2026')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('status', 'authorised')
    .order('authorised_at', { ascending: true })

  if (error) {
    console.error('Admin fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
  }

  return NextResponse.json({ applications: data || [] })
}
