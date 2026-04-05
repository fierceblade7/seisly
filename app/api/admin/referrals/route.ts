import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const password = request.headers.get('x-admin-password')
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  if (password !== adminPassword) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: codes } = await supabase
    .from('referral_codes')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: credits } = await supabase
    .from('account_credits')
    .select('*')
    .order('updated_at', { ascending: false })

  const { count: totalUses } = await supabase
    .from('referral_uses')
    .select('*', { count: 'exact', head: true })

  const totalCredits = (credits || []).reduce((sum, c) => sum + (c.balance || 0), 0)
  const activeCodes = (codes || []).filter(c => c.is_active).length

  return NextResponse.json({
    codes: codes || [],
    credits: credits || [],
    metrics: {
      activeCodes,
      totalUses: totalUses || 0,
      totalCreditsIssued: (codes || []).reduce((sum, c) => sum + (c.total_credits_earned || 0), 0),
      totalCreditsOutstanding: totalCredits,
    },
  })
}

export async function POST(request: NextRequest) {
  const password = request.headers.get('x-admin-password')
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  if (password !== adminPassword) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { action, code, email, amount, reason } = await request.json()

    if (action === 'toggle_code' && code) {
      const { data: existing } = await supabase
        .from('referral_codes')
        .select('is_active')
        .eq('code', code)
        .maybeSingle()
      if (existing) {
        await supabase.from('referral_codes').update({ is_active: !existing.is_active }).eq('code', code)
      }
      return NextResponse.json({ success: true })
    }

    if (action === 'adjust_credit' && email && amount !== undefined) {
      const { data: existing } = await supabase
        .from('account_credits')
        .select('balance')
        .eq('email', email)
        .maybeSingle()

      const newBalance = (existing?.balance || 0) + amount
      if (existing) {
        await supabase.from('account_credits').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('email', email)
      } else {
        await supabase.from('account_credits').insert({ email, balance: newBalance })
      }

      await supabase.from('credit_transactions').insert({
        email,
        amount,
        type: amount >= 0 ? 'admin_add' : 'admin_remove',
        description: reason || 'Manual adjustment',
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error('Admin referral error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
