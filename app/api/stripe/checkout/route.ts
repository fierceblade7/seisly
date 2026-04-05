import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
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
    const { scheme, email, applicationId } = await request.json()

    const priceId = PRICE_IDS[scheme]
    if (!scheme || !priceId) {
      return NextResponse.json({ error: 'Invalid scheme' }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://seisly.com'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email || undefined,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        applicationId: applicationId || '',
        scheme,
        email: email || '',
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
