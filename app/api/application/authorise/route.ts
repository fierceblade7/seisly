import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { sanitiseHtml } from '@/lib/sanitise-html'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY!)

const authoriseLimiter = rateLimit({ name: 'application-authorise', maxRequests: 10, windowMs: 60 * 60 * 1000 })

export const maxDuration = 30

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  const { success } = authoriseLimiter.check(ip)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests, please try again later' }, { status: 429 })
  }

  try {
    const { email, scheme, name, companyName } = await request.json()

    if (!email || !scheme || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Fetch application for company name and declaration date
    const { data: application } = await supabase
      .from('applications')
      .select('company_name, declared_by_name, declared_by_position, scheme, declared_at')
      .eq('email', email)
      .eq('scheme', scheme)
      .single()

    // Check if declaration has expired (55 days, within HMRC 2-month limit)
    if (application?.declared_at) {
      const declaredAt = new Date(application.declared_at)
      const daysSinceDeclared = (Date.now() - declaredAt.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceDeclared > 55) {
        return NextResponse.json({
          error: 'Your accuracy declaration has expired. HMRC requires the agent authority letter to be dated within 2 months of submission. Please return to your review and re-sign the declaration.',
          expired: true,
        }, { status: 400 })
      }
    }

    // Calculate authority letter expiry (55 days from declaration)
    const authorityLetterExpiresAt = application?.declared_at
      ? new Date(new Date(application.declared_at).getTime() + 55 * 24 * 60 * 60 * 1000).toISOString()
      : null

    await supabase
      .from('applications')
      .update({
        status: 'authorised',
        authorised_at: new Date().toISOString(),
        authorised_by_name: name,
        submission_requested_at: new Date().toISOString(),
        authority_letter_expires_at: authorityLetterExpiresAt,
      })
      .eq('email', email)
      .eq('scheme', scheme)

    // Notify Seisly team
    await resend.emails.send({
      from: 'Seisly <hello@seisly.com>',
      to: 'support@seisly.com',
      subject: `New application ready for submission - ${sanitiseHtml(application?.company_name || companyName)}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1a1a18;">
          <h1 style="font-size: 24px; font-weight: 400; margin-bottom: 16px;">
            New application ready for HMRC submission
          </h1>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr style="border-bottom: 1px solid #f0f0ec;">
              <td style="padding: 8px 0; color: #888; width: 40%;">Company</td>
              <td style="padding: 8px 0; font-weight: 500;">${sanitiseHtml(application?.company_name || companyName)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f0f0ec;">
              <td style="padding: 8px 0; color: #888;">Scheme</td>
              <td style="padding: 8px 0; font-weight: 500;">${(application?.scheme || scheme).toUpperCase()}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f0f0ec;">
              <td style="padding: 8px 0; color: #888;">Founder email</td>
              <td style="padding: 8px 0;">${sanitiseHtml(email)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f0f0ec;">
              <td style="padding: 8px 0; color: #888;">Signatory</td>
              <td style="padding: 8px 0;">${sanitiseHtml(application?.declared_by_name || name)}, ${sanitiseHtml(application?.declared_by_position || '')}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #888;">Authorised at</td>
              <td style="padding: 8px 0;">${new Date().toLocaleString('en-GB')}</td>
            </tr>
          </table>
          <div style="margin-top: 32px; padding: 16px; background: #f0faf6; border-radius: 8px;">
            <p style="font-size: 13px; color: #0a5c47; margin: 0;">
              Log into the HMRC online service and submit this application.
              Check Supabase for the full application data.
            </p>
          </div>
        </div>
      `
    })

    // Notify founder
    await resend.emails.send({
      from: 'Seisly <hello@seisly.com>',
      to: email,
      subject: `Submission authorised - ${sanitiseHtml(application?.company_name || companyName)}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1a1a18;">
          <div style="margin-bottom: 32px;">
            <span style="font-size: 24px; font-weight: 400;">Seis<span style="color: #0d7a5f;">ly</span></span>
          </div>
          <h1 style="font-size: 28px; font-weight: 400; margin-bottom: 16px;">
            We have received your submission authorisation.
          </h1>
          <p style="font-size: 15px; line-height: 1.6; color: #555; margin-bottom: 16px;">
            Thank you, ${sanitiseHtml(application?.declared_by_name || name)}. We will now prepare and submit your
            ${(application?.scheme || scheme).toUpperCase()} advance assurance application to HMRC
            on behalf of ${sanitiseHtml(application?.company_name || companyName)}.
          </p>
          <p style="font-size: 15px; line-height: 1.6; color: #555; margin-bottom: 32px;">
            HMRC typically responds within 4 to 8 weeks. We will track your application
            and notify you the moment we hear back.
          </p>
          <p style="font-size: 13px; color: #aaa; line-height: 1.6;">
            Questions? Reply to this email or contact support@seisly.com<br>
            Seisly is a product of Litigo Limited, 71-75 Shelton Street, London WC2H 9JQ.
          </p>
        </div>
      `
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Authorisation error:', err)
    return NextResponse.json({ error: 'Authorisation failed' }, { status: 500 })
  }
}
