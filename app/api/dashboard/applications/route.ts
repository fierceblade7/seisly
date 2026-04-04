import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email')
  if (!email) return NextResponse.json({ applications: [] })

  // Verify authenticated user matches the requested email
  const authClient = await createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user || user.email !== email) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { data } = await supabase
    .from('applications')
    .select('id, email, scheme, company_name, status, created_at, paid_at, authority_letter_url, review_status')
    .eq('email', email)
    .order('created_at', { ascending: false })

  return NextResponse.json({ applications: data || [] })
}
