import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

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

  const { data } = await supabase
    .from('applications')
    .select('review_status, review_results, review_released, ai_review_result, review_started_at, review_completed_at, company_name, status')
    .eq('email', email)
    .eq('scheme', scheme)
    .single()

  return NextResponse.json(data || {})
}
