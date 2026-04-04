import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(request: NextRequest) {
  const password = request.headers.get('x-admin-password')
  if (password !== (process.env.ADMIN_PASSWORD || 'seisly-admin-2026')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { email, scheme } = await request.json()
    if (!email || !scheme) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const { data: app } = await supabase
      .from('applications')
      .select('company_name, review_status, ai_review_result')
      .eq('email', email)
      .eq('scheme', scheme)
      .single()

    if (!app?.ai_review_result) {
      return NextResponse.json({ error: 'No AI review to release' }, { status: 400 })
    }

    await supabase
      .from('applications')
      .update({ review_released: true })
      .eq('email', email)
      .eq('scheme', scheme)

    // Email the founder
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://seisly.com'
    const reviewUrl = `${baseUrl}/apply/review?email=${encodeURIComponent(email)}&scheme=${scheme}`

    await resend.emails.send({
      from: 'Seisly <hello@seisly.com>',
      to: email,
      subject: `Your ${scheme.toUpperCase()} application review is ready - ${app.company_name}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1a1a18;">
          <div style="margin-bottom: 32px;">
            <span style="font-size: 24px; font-weight: 400;">Seis<span style="color: #0d7a5f;">ly</span></span>
          </div>
          <h1 style="font-size: 28px; font-weight: 400; margin-bottom: 16px;">Your application review is ready.</h1>
          <p style="font-size: 15px; line-height: 1.6; color: #555; margin-bottom: 32px;">
            We have reviewed your ${scheme.toUpperCase()} advance assurance application and supporting documents for <strong>${app.company_name}</strong>. Click below to view your results and proceed.
          </p>
          <a href="${reviewUrl}" style="display: inline-block; background: #0d7a5f; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-family: sans-serif;">
            View your review
          </a>
          <p style="font-size: 13px; color: #aaa; margin-top: 32px; line-height: 1.6;">
            Seisly does not guarantee HMRC approval. Advance assurance is discretionary and HMRC's decision is final.<br><br>
            Questions? Reply to this email or contact support@seisly.com<br>
            Seisly is a product of Litigo Limited, 71-75 Shelton Street, London WC2H 9JQ.
          </p>
        </div>
      `
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Release review error:', err)
    return NextResponse.json({ error: 'Failed to release review' }, { status: 500 })
  }
}
