import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { sanitiseHtml } from '@/lib/sanitise-html'

export const maxDuration = 30

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY!)

const complexCaseLimiter = rateLimit({ name: 'complex-case', maxRequests: 20, windowMs: 60 * 60 * 1000 })

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  const { success } = await complexCaseLimiter.check(ip)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests, please try again later' }, { status: 429 })
  }

  try {
    const { email, scheme, complexityFlags } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    await supabase.from('complex_cases').insert({
      email,
      scheme: scheme || null,
      complexity_flags: complexityFlags || [],
    })

    await resend.emails.send({
      from: 'Seisly <hello@seisly.com>',
      to: 'support@seisly.com',
      subject: `Complex case review needed - ${sanitiseHtml(email)}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1a1a18;">
          <h1 style="font-size: 24px; font-weight: 400; margin-bottom: 16px;">Complex case flagged</h1>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr style="border-bottom: 1px solid #f0f0ec;">
              <td style="padding: 8px 0; color: #888; width: 30%;">Email</td>
              <td style="padding: 8px 0;">${sanitiseHtml(email)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f0f0ec;">
              <td style="padding: 8px 0; color: #888;">Scheme</td>
              <td style="padding: 8px 0;">${(scheme || 'not selected').toUpperCase()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #888;">Flags</td>
              <td style="padding: 8px 0;">${(complexityFlags || []).map((f: string) => sanitiseHtml(f)).join(', ')}</td>
            </tr>
          </table>
          <div style="margin-top: 24px; padding: 16px; background: #fff8e6; border-radius: 8px;">
            <p style="font-size: 13px; color: #8a6500; margin: 0;">Review and respond within 24 hours.</p>
          </div>
        </div>
      `
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Complex case error:', err)
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 })
  }
}
