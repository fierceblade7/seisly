import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email')

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('applications')
    .select('novar_promo_code')
    .eq('email', email)
    .eq('paid', true)
    .not('novar_promo_code', 'is', null)
    .limit(1)
    .single()

  if (error || !data?.novar_promo_code) {
    return NextResponse.json({ promoCode: null })
  }

  return NextResponse.json({ promoCode: data.novar_promo_code })
}
