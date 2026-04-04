import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { sanitiseHtml } from '@/lib/sanitise-html'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(request: NextRequest) {
  const password = request.headers.get('x-admin-password')
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  if (password !== adminPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { email, scheme } = await request.json()

    if (!email || !scheme) {
      return NextResponse.json({ error: 'Missing email or scheme' }, { status: 400 })
    }

    const { data: application } = await supabase
      .from('applications')
      .select('company_name, declared_by_name, scheme')
      .eq('email', email)
      .eq('scheme', scheme)
      .single()

    await supabase
      .from('applications')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('email', email)
      .eq('scheme', scheme)

    // Email the founder
    await resend.emails.send({
      from: 'Seisly <hello@seisly.com>',
      to: email,
      subject: `Your ${(application?.scheme || scheme).toUpperCase()} application has been submitted to HMRC - ${sanitiseHtml(application?.company_name)}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1a1a18;">
          <div style="margin-bottom: 32px;">
            <span style="font-size: 24px; font-weight: 400;">Seis<span style="color: #0d7a5f;">ly</span></span>
          </div>
          <h1 style="font-size: 28px; font-weight: 400; margin-bottom: 16px;">Your application has been submitted.</h1>
          <p style="font-size: 15px; line-height: 1.6; color: #555; margin-bottom: 16px;">
            We have submitted your ${(application?.scheme || scheme).toUpperCase()} advance assurance application to HMRC's Venture Capital Reliefs team on behalf of <strong>${sanitiseHtml(application?.company_name)}</strong>.
          </p>
          <p style="font-size: 15px; line-height: 1.6; color: #555; margin-bottom: 16px;">
            HMRC typically responds within 4 to 8 weeks. We will track your application and notify you the moment we hear back.
          </p>
          <p style="font-size: 15px; line-height: 1.6; color: #555; margin-bottom: 32px;">
            If HMRC has any queries about your application, we will handle the first round of questions on your behalf and keep you informed.
          </p>
          <p style="font-size: 13px; color: #aaa; line-height: 1.6;">
            Seisly does not guarantee HMRC approval. Advance assurance is discretionary and HMRC's decision is final. Our money-back guarantee applies only where rejection is due to our error.<br><br>
            Questions? Reply to this email or contact support@seisly.com<br>
            Seisly is a product of Litigo Limited, 71-75 Shelton Street, London WC2H 9JQ.
          </p>
        </div>
      `
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin submit error:', err)
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 })
  }
}
