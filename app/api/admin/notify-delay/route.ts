import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { sanitiseHtml } from '@/lib/sanitise-html'

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
    const { email, scheme, estimatedDays } = await request.json()
    if (!email || !scheme) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const { data: app } = await supabase
      .from('applications')
      .select('company_name')
      .eq('email', email)
      .eq('scheme', scheme)
      .maybeSingle()

    await supabase
      .from('applications')
      .update({ sla_notified: true })
      .eq('email', email)
      .eq('scheme', scheme)

    await resend.emails.send({
      from: 'Seisly <hello@seisly.com>',
      to: email,
      subject: `Update on your Seisly application - ${sanitiseHtml(app?.company_name || '')}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1a1a18;">
          <div style="margin-bottom: 32px;">
            <span style="font-size: 24px; font-weight: 400;">Seis<span style="color: #0d7a5f;">ly</span></span>
          </div>
          <h1 style="font-size: 28px; font-weight: 400; margin-bottom: 16px;">Update on your application</h1>
          <p style="font-size: 15px; line-height: 1.6; color: #555; margin-bottom: 16px;">
            We are currently experiencing high demand and your review may take a little longer than our usual 72-hour window.
            We will have your application reviewed within ${estimatedDays || 5} working days. Thank you for your patience.
          </p>
          <p style="font-size: 15px; line-height: 1.6; color: #555; margin-bottom: 32px;">
            If you have any questions, reply to this email or contact us at support@seisly.com.
          </p>
          <p style="font-size: 13px; color: #aaa; line-height: 1.6;">
            Seisly is a product of Litigo Limited, 71-75 Shelton Street, London WC2H 9JQ.
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delay notification error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
