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

  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

  // Verify authenticated user matches the requested email
  const authClient = await createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user || user.email !== email) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { data } = await supabase
    .from('applications')
    .select('review_status, review_results, review_pass1, review_pass2, review_started_at, review_completed_at, company_name, status')
    .eq('email', email)
    .eq('scheme', scheme || 'seis')
    .single()

  return NextResponse.json(data || {})
}
