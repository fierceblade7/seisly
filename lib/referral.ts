import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const part = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `SEIS-${part()}-${part()}`
}

export async function generateReferralCode(email: string): Promise<string> {
  // Check if code already exists for this email
  const { data: existing } = await supabase
    .from('referral_codes')
    .select('code')
    .eq('referrer_email', email)
    .eq('is_active', true)
    .maybeSingle()

  if (existing) return existing.code

  // Generate unique code
  let code = generateCode()
  let attempts = 0
  while (attempts < 5) {
    const { error } = await supabase
      .from('referral_codes')
      .insert({ code, referrer_email: email })
    if (!error) return code
    code = generateCode()
    attempts++
  }
  throw new Error('Failed to generate unique referral code')
}

export async function lookupReferralCode(code: string): Promise<{ valid: boolean; referrerEmail?: string }> {
  const { data } = await supabase
    .from('referral_codes')
    .select('referrer_email, is_active')
    .eq('code', code.toUpperCase())
    .maybeSingle()

  if (!data || !data.is_active) return { valid: false }
  return { valid: true, referrerEmail: data.referrer_email }
}

export async function recordReferralUse(code: string, referredEmail: string, discount: number = 10): Promise<void> {
  await supabase.from('referral_uses').insert({
    code: code.toUpperCase(),
    referred_email: referredEmail,
    discount_applied: discount,
  })
}

export async function issueReferralCredit(code: string, referredEmail: string): Promise<void> {
  const { data: referralCode } = await supabase
    .from('referral_codes')
    .select('referrer_email')
    .eq('code', code.toUpperCase())
    .maybeSingle()

  if (!referralCode) return

  const referrerEmail = referralCode.referrer_email
  const creditAmount = 10

  // Mark use as paid and credited
  await supabase
    .from('referral_uses')
    .update({ paid_at: new Date().toISOString(), credit_issued: true })
    .eq('code', code.toUpperCase())
    .eq('referred_email', referredEmail)

  // Upsert credit balance
  const { data: existing } = await supabase
    .from('account_credits')
    .select('balance')
    .eq('email', referrerEmail)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('account_credits')
      .update({
        balance: existing.balance + creditAmount,
        updated_at: new Date().toISOString(),
      })
      .eq('email', referrerEmail)
  } else {
    await supabase
      .from('account_credits')
      .insert({ email: referrerEmail, balance: creditAmount })
  }

  // Record transaction
  await supabase.from('credit_transactions').insert({
    email: referrerEmail,
    amount: creditAmount,
    type: 'earned',
    description: `Referral credit - ${referredEmail}`,
  })

  // Update referral code stats
  const { data: codeData } = await supabase
    .from('referral_codes')
    .select('total_uses, total_credits_earned')
    .eq('code', code.toUpperCase())
    .maybeSingle()
  if (codeData) {
    await supabase
      .from('referral_codes')
      .update({
        total_uses: (codeData.total_uses || 0) + 1,
        total_credits_earned: (codeData.total_credits_earned || 0) + creditAmount,
      })
      .eq('code', code.toUpperCase())
  }
}

export async function getReferralStats(email: string) {
  const { data: code } = await supabase
    .from('referral_codes')
    .select('code, total_uses, total_credits_earned, is_active')
    .eq('referrer_email', email)
    .eq('is_active', true)
    .maybeSingle()

  const { data: credit } = await supabase
    .from('account_credits')
    .select('balance')
    .eq('email', email)
    .maybeSingle()

  const { data: uses } = await supabase
    .from('referral_uses')
    .select('referred_email, referred_at, credit_issued')
    .eq('code', code?.code || '')
    .order('referred_at', { ascending: false })
    .limit(10)

  return {
    code: code?.code || null,
    totalUses: code?.total_uses || 0,
    totalCreditsEarned: code?.total_credits_earned || 0,
    currentBalance: credit?.balance || 0,
    recentUses: (uses || []).map(u => ({
      email: u.referred_email.substring(0, 3) + '****',
      date: u.referred_at,
      credited: u.credit_issued,
    })),
  }
}
