import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const PRICES: Record<string, number> = {
  seis: 14900,
  eis: 14900,
  both: 19900,
}

const LABELS: Record<string, string> = {
  seis: 'SEIS Advance Assurance',
  eis: 'EIS Advance Assurance',
  both: 'SEIS and EIS Advance Assurance',
}

export async function POST(request: NextRequest) {
  try {
    const { scheme, email, applicationId } = await request.json()

    if (!scheme || !PRICES[scheme]) {
      return NextResponse.json({ error: 'Invalid scheme' }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://seisly.com'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email || undefined,
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: LABELS[scheme],
              description: 'Seisly — HMRC advance assurance application. One-time payment. No subscription.',
            },
            unit_amount: PRICES[scheme],
          },
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
