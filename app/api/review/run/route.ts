import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(request: NextRequest) {
  let email = ''
  let scheme = ''

  try {
    const body = await request.json()
    email = body.email
    scheme = body.scheme

    // 1. Fetch application data
    const { data: application } = await supabase
      .from('applications')
      .select('*')
      .eq('email', email)
      .eq('scheme', scheme)
      .single()

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // 2. Fetch uploaded document list
    const { data: documents } = await supabase
      .from('application_documents')
      .select('*')
      .eq('email', email)
      .eq('scheme', scheme)

    const docSummary = documents?.map(d => `- ${d.doc_type}: ${d.file_name}`).join('\n') || 'No documents found'

    // 3. Build application summary for Claude
    const appSummary = `
COMPANY: ${application.company_name} (${application.company_number})
SCHEME: ${scheme.toUpperCase()}
INCORPORATED: ${application.incorporated_at}
TRADE STARTED: ${application.trade_started ? 'Yes - ' + application.trade_start_date : 'No'}
TRADE DESCRIPTION: ${application.trade_description}
QUALIFYING ACTIVITY: ${application.qualifying_activity}
RAISING AMOUNT: £${Number(application.raising_amount).toLocaleString()}
SHARE PURPOSE / USE OF FUNDS: ${application.share_purpose}
RISK TO CAPITAL: ${application.risk_to_capital}
SHARE CLASS: ${application.share_class}
PREFERENTIAL RIGHTS: ${application.preferential_rights ? 'Yes - ' + application.preferential_rights_detail : 'No'}
PREVIOUS VCS: ${application.previous_vcs ? 'Yes' : 'No'}
GROSS ASSETS BEFORE: ${application.gross_assets_before}
EMPLOYEE COUNT: ${application.employee_count}
HAS SUBSIDIARIES: ${application.has_subsidiaries ? 'Yes' : 'No'}
UK INCORPORATED: ${application.uk_incorporated ? 'Yes' : 'No'}
    `.trim()

    // 4. PASS 1 - Document adequacy check
    const pass1Response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `You are an expert SEIS and EIS advance assurance specialist with over a decade of experience reviewing HMRC applications. You are reviewing a ${scheme.toUpperCase()} advance assurance application for ${application.company_name}.

Here is the application data:
${appSummary}

The founder has uploaded these documents:
${docSummary}

Based on the document types uploaded (you cannot read the actual files, only their names and types), assess whether the document pack appears adequate for an HMRC ${scheme.toUpperCase()} advance assurance application.

For each document type, assess:
1. Whether it has been provided
2. Whether the filename suggests it is likely adequate
3. What HMRC will specifically look for in this document

Also assess the application form answers themselves:
- Is the risk to capital narrative substantive enough (minimum 100 words, specific to this company)?
- Is the trade description clear and specific?
- Is the share purpose / use of funds narrative adequate for the growth and development requirement (VCM8130 - funds must be for organic growth)?
- Are there any obvious red flags in the application answers?

Respond ONLY with a JSON object in this exact format:
{
  "overall": "pass" | "amber" | "fail",
  "summary": "2-3 sentence overall assessment",
  "documents": {
    "business_plan": { "status": "green" | "amber" | "red", "message": "specific feedback" },
    "accounts": { "status": "green" | "amber" | "red", "message": "specific feedback" },
    "articles": { "status": "green" | "amber" | "red", "message": "specific feedback" },
    "shareholder_list": { "status": "green" | "amber" | "red", "message": "specific feedback" },
    "investor_documents": { "status": "green" | "amber" | "red", "message": "specific feedback" },
    "subscription_agreement": { "status": "green" | "amber" | "red", "message": "specific feedback" }
  },
  "form_answers": {
    "risk_to_capital": { "status": "green" | "amber" | "red", "message": "specific feedback" },
    "trade_description": { "status": "green" | "amber" | "red", "message": "specific feedback" },
    "share_purpose": { "status": "green" | "amber" | "red", "message": "specific feedback" }
  },
  "action_items": ["list of specific things founder needs to fix or improve"]
}`
      }]
    })

    let pass1Results: Record<string, unknown> = {}
    console.log('[AI Review] Pass 1 raw:', pass1Response.content[0].type === 'text' ? pass1Response.content[0].text.substring(0, 200) : 'not text')
    try {
      const pass1Text = pass1Response.content[0].type === 'text'
        ? pass1Response.content[0].text
        : '{}'
      const cleanPass1 = pass1Text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim()
      pass1Results = JSON.parse(cleanPass1)
    } catch (e) {
      console.error('[AI Review] Pass 1 parse error:', e)
      console.error('[AI Review] Raw pass 1 response:', pass1Response.content[0])
      pass1Results = { overall: 'amber', summary: 'Review completed with parsing issues. Manual review required.', documents: {}, form_answers: {}, action_items: [] }
    }

    // 5. PASS 2 - Consistency check
    const pass2Response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `You are an expert SEIS and EIS advance assurance specialist. You are doing a consistency check on a ${scheme.toUpperCase()} advance assurance application for ${application.company_name}.

Here is the full application data:
${appSummary}

Check for internal consistency issues:
1. Does the raising amount (£${Number(application.raising_amount).toLocaleString()}) seem appropriate for the stage of the company and the use of funds described?
2. Is the employee count (${application.employee_count}) consistent with the stage and trade description?
3. Does the share purpose / use of funds align with the growth and development requirement (VCM8130)?
4. Is the risk to capital narrative specific to this company or generic?
5. Are there any inconsistencies between the trade description and the qualifying activity?
6. For the gross assets (${application.gross_assets_before}), does this seem consistent with the company stage?
${scheme === 'eis' || scheme === 'both' ? `7. EIS specific: Does the application clearly demonstrate growth and development as required by VCM8130 (updated 20 March 2026)? Funds must be for organic growth - not to acquire businesses, replace loans, or cover pre-existing costs.` : ''}

Suggest specific improvements to the application answers that would strengthen the application.

Respond ONLY with a JSON object in this exact format:
{
  "overall": "pass" | "amber" | "fail",
  "summary": "2-3 sentence consistency assessment",
  "consistency_checks": {
    "raising_amount": { "status": "green" | "amber" | "red", "message": "feedback" },
    "employee_count": { "status": "green" | "amber" | "red", "message": "feedback" },
    "use_of_funds": { "status": "green" | "amber" | "red", "message": "feedback" },
    "risk_to_capital": { "status": "green" | "amber" | "red", "message": "feedback" },
    "trade_consistency": { "status": "green" | "amber" | "red", "message": "feedback" },
    "growth_development": { "status": "green" | "amber" | "red", "message": "feedback" }
  },
  "suggested_improvements": [
    { "field": "field name", "current": "current answer summary", "suggested": "specific improvement suggestion" }
  ]
}`
      }]
    })

    let pass2Results: Record<string, unknown> = {}
    console.log('[AI Review] Pass 2 raw:', pass2Response.content[0].type === 'text' ? pass2Response.content[0].text.substring(0, 200) : 'not text')
    try {
      const pass2Text = pass2Response.content[0].type === 'text'
        ? pass2Response.content[0].text
        : '{}'
      const cleanPass2 = pass2Text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim()
      pass2Results = JSON.parse(cleanPass2)
    } catch (e) {
      console.error('[AI Review] Pass 2 parse error:', e)
      console.error('[AI Review] Raw pass 2 response:', pass2Response.content[0])
      pass2Results = { overall: 'amber', summary: 'Consistency check completed with parsing issues.', consistency_checks: {}, suggested_improvements: [] }
    }

    // 6. Store results in Supabase
    const overallStatus = (pass1Results.overall === 'fail' || pass2Results.overall === 'fail') ? 'needs_attention' :
      (pass1Results.overall === 'amber' || pass2Results.overall === 'amber') ? 'amber' : 'ready'

    await supabase
      .from('applications')
      .update({
        review_status: overallStatus,
        review_completed_at: new Date().toISOString(),
        review_pass1: pass1Results,
        review_pass2: pass2Results,
        review_results: { pass1: pass1Results, pass2: pass2Results, overall: overallStatus },
      })
      .eq('email', email)
      .eq('scheme', scheme)

    // 7. Send email via Resend
    const reviewUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/apply/review?email=${encodeURIComponent(email)}&scheme=${scheme}`

    await resend.emails.send({
      from: 'Seisly <hello@seisly.com>',
      to: email,
      subject: `Your ${scheme.toUpperCase()} application review is ready - ${application.company_name}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1a1a18;">
          <div style="margin-bottom: 32px;">
            <span style="font-size: 24px; font-weight: 400;">Seis<span style="color: #0d7a5f;">ly</span></span>
          </div>
          <h1 style="font-size: 28px; font-weight: 400; margin-bottom: 16px;">Your application review is ready.</h1>
          <p style="font-size: 15px; line-height: 1.6; color: #555; margin-bottom: 24px;">
            We have reviewed your ${scheme.toUpperCase()} advance assurance application and supporting documents for <strong>${application.company_name}</strong>.
          </p>
          <p style="font-size: 15px; line-height: 1.6; color: #555; margin-bottom: 32px;">
            Overall status: <strong style="color: ${overallStatus === 'ready' ? '#0d7a5f' : overallStatus === 'amber' ? '#8a6500' : '#c0392b'}">${overallStatus === 'ready' ? 'Ready to submit' : overallStatus === 'amber' ? 'A few things to review' : 'Needs attention before submission'}</strong>
          </p>
          <a href="${reviewUrl}" style="display: inline-block; background: #0d7a5f; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-family: sans-serif;">
            View your review
          </a>
          <p style="font-size: 13px; color: #aaa; margin-top: 32px; line-height: 1.6;">
            If you have any questions, reply to this email or contact us at support@seisly.com.<br>
            Seisly is a product of Litigo Limited, 71-75 Shelton Street, London WC2H 9JQ.
          </p>
        </div>
      `
    })

    console.log('[AI Review] Completed for', email, scheme, '- status:', overallStatus)
    return NextResponse.json({ success: true, status: overallStatus })

  } catch (err) {
    console.error('[AI Review] Error:', err)

    // Update status to failed
    try {
      if (email) {
        await supabase.from('applications').update({ review_status: 'failed' }).eq('email', email).eq('scheme', scheme)
      }
    } catch {}

    return NextResponse.json({ error: 'Review failed' }, { status: 500 })
  }
}

export const maxDuration = 60
