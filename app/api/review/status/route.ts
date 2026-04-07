import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email')
  const scheme = request.nextUrl.searchParams.get('scheme')

  if (!email || !scheme) {
    return NextResponse.json({ error: 'Missing email or scheme' }, { status: 400 })
  }

  // Auth + ownership: caller must be signed in and the requested email
  // must match the session user. The applications table has no user_id
  // column, so email is the natural key for ownership.
  const ssr = await createServerSupabaseClient()
  const { data: { user: authUser } } = await ssr.auth.getUser()
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (email.toLowerCase() !== (authUser.email || '').toLowerCase()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data } = await supabase
    .from('applications')
    .select('review_status, review_released, status, is_express, review_sla_hours, sla_deadline, decline_reason, free_resubmission_available')
    .eq('email', email)
    .eq('scheme', scheme)
    .single()

  return NextResponse.json(data || {})
}
