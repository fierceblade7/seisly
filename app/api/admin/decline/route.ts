import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { sanitiseHtml } from '@/lib/sanitise-html'
import { schemeLabel } from '@/lib/scheme-label'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY!)

export const maxDuration = 30

export async function POST(request: NextRequest) {
  const password = request.headers.get('x-admin-password')
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  if (password !== adminPassword) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { email, scheme, reason } = await request.json()
    if (!email || !scheme || !reason) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const { data: app } = await supabase
      .from('applications')
      .select('company_name')
      .eq('email', email)
      .eq('scheme', scheme)
      .maybeSingle()

    await supabase
      .from('applications')
      .update({
        status: 'declined',
        decline_reason: reason,
        free_resubmission_available: true,
      })
      .eq('email', email)
      .eq('scheme', scheme)

    await resend.emails.send({
      from: 'Seisly <hello@seisly.com>',
      to: email,
      subject: `Your Seisly application - our review`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1a1a18;">
          <div style="margin-bottom: 32px;">
            <span style="font-size: 24px; font-weight: 400;">Seis<span style="color: #0d7a5f;">ly</span></span>
          </div>
          <h1 style="font-size: 28px; font-weight: 400; margin-bottom: 16px;">Our review of your application</h1>
          <p style="font-size: 15px; line-height: 1.6; color: #555; margin-bottom: 16px;">
            We have reviewed your ${schemeLabel(scheme)} advance assurance application${app?.company_name ? ` for <strong>${sanitiseHtml(app.company_name)}</strong>` : ''} and unfortunately we do not believe it would be successful with HMRC in its current form.
          </p>
          <p style="font-size: 15px; line-height: 1.6; color: #555; margin-bottom: 8px;">
            Here is what we found:
          </p>
          <div style="background: #f5f5f2; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="font-size: 14px; line-height: 1.6; color: #444; white-space: pre-wrap;">${sanitiseHtml(reason)}</p>
          </div>
          <p style="font-size: 15px; line-height: 1.6; color: #555; margin-bottom: 16px;">
            We want to help you get this right. Once you have addressed the points above, you can resubmit your application at no extra charge. Just log back in and start a new application. Your free resubmission is ready whenever you are.
          </p>
          <p style="font-size: 15px; line-height: 1.6; color: #555; margin-bottom: 32px;">
            If you have any questions, reply to this email and we will help where we can.
          </p>
          <p style="font-size: 15px; color: #555;">The Seisly Team</p>
          <p style="font-size: 13px; color: #aaa; margin-top: 32px; line-height: 1.6;">
            Seisly is a product of Litigo Limited, 71-75 Shelton Street, London WC2H 9JQ.
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Decline error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
