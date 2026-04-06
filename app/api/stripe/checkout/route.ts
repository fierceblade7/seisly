import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { createClient } from '@supabase/supabase-js'
import { lookupReferralCode, recordReferralUse } from '@/lib/referral'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const checkoutLimiter = rateLimit({ name: 'stripe-checkout', maxRequests: 10, windowMs: 60 * 60 * 1000 })

const PRICE_IDS: Record<string, string | undefined> = {
  seis: process.env.STRIPE_PRICE_SEIS,
  eis: process.env.STRIPE_PRICE_EIS,
  both: process.env.STRIPE_PRICE_SEIS_EIS,
  resubmission: process.env.STRIPE_PRICE_RESUBMISSION,
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  const { success } = await checkoutLimiter.check(ip)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests, please try again later' }, { status: 429 })
  }

  try {
    const { scheme, email, applicationId, express } = await request.json()

    const priceId = PRICE_IDS[scheme]
    if (!scheme || !priceId) {
      return NextResponse.json({ error: 'Invalid scheme' }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://seisly.com'

    // Build line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      { price: priceId, quantity: 1 },
    ]

    // Add Express Review add-on if selected
    const isExpress = express === true
    if (isExpress && process.env.STRIPE_PRICE_EXPRESS) {
      lineItems.push({ price: process.env.STRIPE_PRICE_EXPRESS, quantity: 1 })
    }

    // Check for referral code in cookie
    const referralCookie = request.cookies.get('seisly_referral')?.value
    let referralCodeUsed: string | undefined

    if (referralCookie && process.env.STRIPE_REFERRAL_COUPON_ID) {
      const referral = await lookupReferralCode(referralCookie)
      if (referral.valid && referral.referrerEmail !== email) {
        referralCodeUsed = referralCookie.toUpperCase()
        await recordReferralUse(referralCodeUsed, email)
        await supabase
          .from('applications')
          .update({ referral_code_used: referralCodeUsed })
          .eq('email', email)
          .eq('scheme', scheme)
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email || undefined,
      allow_promotion_codes: true,
      line_items: lineItems,
      metadata: {
        applicationId: applicationId || '',
        scheme,
        email: email || '',
        express: isExpress ? 'true' : 'false',
        ...(referralCodeUsed ? { referral_code: referralCodeUsed } : {}),
      },
      success_url: `${baseUrl}/apply/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/apply?payment=cancelled`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe error:', err)
    return NextResponse.json({ error: 'Payment session failed' }, { status: 500 })
  }
}
