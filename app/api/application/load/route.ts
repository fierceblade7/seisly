import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ALLOWED_SCHEMES = new Set(['seis', 'eis', 'both'])

export async function GET(request: NextRequest) {
  const scheme = request.nextUrl.searchParams.get('scheme')
  if (!scheme || !ALLOWED_SCHEMES.has(scheme)) {
    return NextResponse.json({ error: 'Invalid or missing scheme' }, { status: 400 })
  }

  // Auth: caller must be signed in. We always look up by the session
  // user's email — never a client-supplied email — so a caller cannot
  // load another user's draft.
  const authClient = await createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user || !user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data } = await supabase
    .from('applications')
    .select('*')
    .eq('email', user.email)
    .eq('scheme', scheme)
    .maybeSingle()

  return NextResponse.json({
    exists: !!data,
    application: data ?? null,
  })
}
