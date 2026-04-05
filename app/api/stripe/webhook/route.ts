import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateReferralCode, issueReferralCredit } from '@/lib/referral'
import { Resend } from 'resend'
import { sanitiseHtml } from '@/lib/sanitise-html'

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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { email, scheme } = session.metadata || {}

    if (email && scheme) {
      const { data, error } = await supabase
        .from('applications')
        .update({
          paid: true,
          paid_at: new Date().toISOString(),
          status: 'paid',
        })
        .eq('email', email)
        .eq('scheme', scheme)
        .select()

      if (error) {
        console.error('[Stripe Webhook] Supabase update FAILED:', error.message, error.details, error.hint)
      } else if (!data || data.length === 0) {
        console.error('[Stripe Webhook] Update matched 0 rows for email:', email, 'scheme:', scheme)
      } else {

        // Create unique Novar promo code for this customer
        try {
          if (process.env.STRIPE_NOVAR_COUPON_ID) {
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
          } else {
          }
        } catch (promoErr) {
          console.error('[Stripe Webhook] Promo code creation failed:', promoErr)
        }

        // Generate referral code for the paying customer
        try {
          await generateReferralCode(email)
        } catch (refErr) {
          console.error('[Stripe Webhook] Referral code generation failed:', refErr)
        }

        // Issue referral credit if this application used a referral code
        try {
          const { data: appData } = await supabase
            .from('applications')
            .select('referral_code_used')
            .eq('email', email)
            .eq('scheme', scheme)
            .maybeSingle()

          if (appData?.referral_code_used) {
            await issueReferralCredit(appData.referral_code_used, email)

            // Notify the referrer
            const resend = new Resend(process.env.RESEND_API_KEY!)
            const { data: refCode } = await supabase
              .from('referral_codes')
              .select('referrer_email')
              .eq('code', appData.referral_code_used)
              .maybeSingle()

            if (refCode?.referrer_email) {
              await resend.emails.send({
                from: 'Seisly <hello@seisly.com>',
                to: refCode.referrer_email,
                subject: 'You earned £10 Seisly credit',
                html: `
                  <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1a1a18;">
                    <div style="margin-bottom: 32px;">
                      <span style="font-size: 24px; font-weight: 400;">Seis<span style="color: #0d7a5f;">ly</span></span>
                    </div>
                    <h1 style="font-size: 28px; font-weight: 400; margin-bottom: 16px;">You earned £10 credit</h1>
                    <p style="font-size: 15px; line-height: 1.6; color: #555; margin-bottom: 16px;">
                      Good news - ${sanitiseHtml(email)} just signed up using your referral code. £10 credit has been added to your Seisly account.
                    </p>
                    <p style="font-size: 15px; line-height: 1.6; color: #555; margin-bottom: 32px;">
                      Credits can be applied to resubmission fees or compliance statements.
                    </p>
                    <p style="font-size: 13px; color: #aaa; line-height: 1.6;">
                      Seisly is a product of Litigo Limited, 71-75 Shelton Street, London WC2H 9JQ.
                    </p>
                  </div>
                `,
              })
            }
          }
        } catch (creditErr) {
          console.error('[Stripe Webhook] Referral credit failed:', creditErr)
        }
      }
    } else {
      console.error('[Stripe Webhook] Missing metadata - email:', email, 'scheme:', scheme)
    }
  } else {
    console.log('[Stripe Webhook] Unhandled event type:', event.type)
  }

  return NextResponse.json({ received: true })
}
