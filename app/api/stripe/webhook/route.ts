import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature error:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log('[Stripe Webhook] Event received:', event.type)

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    console.log('[Stripe Webhook] Full session.metadata:', JSON.stringify(session.metadata, null, 2))

    const { email, scheme } = session.metadata || {}
    console.log('[Stripe Webhook] Extracted values — email:', email, 'scheme:', scheme)

    if (email && scheme) {
      const { data, error, count } = await supabase
        .from('applications')
        .update({
          paid: true,
          paid_at: new Date().toISOString(),
          status: 'paid',
        })
        .eq('email', email)
        .eq('scheme', scheme)
        .select()

      console.log('[Stripe Webhook] Supabase update result — data:', JSON.stringify(data), 'error:', JSON.stringify(error), 'count:', count)

      if (error) {
        console.error('[Stripe Webhook] Supabase update FAILED:', error.message, error.details, error.hint)
      } else if (!data || data.length === 0) {
        console.warn('[Stripe Webhook] Supabase update matched 0 rows. No application found for email:', email, 'scheme:', scheme)
      } else {
        console.log('[Stripe Webhook] Supabase update SUCCESS. Updated', data.length, 'row(s)')

        // Create unique Novar promo code for this customer
        try {
          if (process.env.STRIPE_NOVAR_COUPON_ID && process.env.STRIPE_NOVAR_COUPON_ID !== 'placeholder_for_now') {
            const promoCode = await stripe.promotionCodes.create({
              promotion: { type: 'coupon', coupon: process.env.STRIPE_NOVAR_COUPON_ID },
              code: `NOVAR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
              max_redemptions: 1,
              metadata: { seisly_email: email, seisly_scheme: scheme },
            })
            await supabase
              .from('applications')
              .update({ novar_promo_code: promoCode.code, novar_promo_code_id: promoCode.id })
              .eq('email', email)
              .eq('scheme', scheme)
            console.log('[Stripe Webhook] Novar promo code created:', promoCode.code)
          } else {
            console.log('[Stripe Webhook] Skipping promo code — STRIPE_NOVAR_COUPON_ID not set')
          }
        } catch (promoErr) {
          console.error('[Stripe Webhook] Promo code creation failed:', promoErr)
        }
      }
    } else {
      console.warn('[Stripe Webhook] Missing metadata — email:', email, 'scheme:', scheme, '. Skipping Supabase update.')
    }
  }

  return NextResponse.json({ received: true })
}
