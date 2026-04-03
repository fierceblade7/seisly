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

export const maxDuration = 120

async function downloadDocument(fileUrl: string): Promise<Buffer | null> {
  try {
    const response = await fetch(fileUrl)
    if (!response.ok) return null
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch {
    return null
  }
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    return result.value.substring(0, 6000)
  } catch {
    return '[Could not extract text from Word document]'
  }
}

async function extractTextFromXlsx(buffer: Buffer): Promise<string> {
  try {
    const XLSX = await import('xlsx')
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    let text = ''
    const prioritySheets = ['Summary', 'P&L', 'PL', 'Forecast',
      'Revenue', 'Headcount', 'Assumptions', 'Model', 'Financial']

    // Sort sheets - priority sheets first
    const sheets = workbook.SheetNames.sort((a: string, b: string) => {
      const aIsPriority = prioritySheets.some(p =>
        a.toLowerCase().includes(p.toLowerCase()))
      const bIsPriority = prioritySheets.some(p =>
        b.toLowerCase().includes(p.toLowerCase()))
      if (aIsPriority && !bIsPriority) return -1
      if (!aIsPriority && bIsPriority) return 1
      return 0
    })

    let totalRows = 0
    for (const sheetName of sheets) {
      if (totalRows >= 500) break
      const sheet = workbook.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: '',
        raw: false
      }) as string[][]

      const nonEmptyRows = rows.filter((row: string[]) =>
        row.some((cell: string) => cell !== '' && cell !== null && cell !== undefined)
      ).slice(0, Math.min(100, 500 - totalRows))

      if (nonEmptyRows.length > 0) {
        text += `\n[Sheet: ${sheetName}]\n`
        text += nonEmptyRows.map((row: string[]) => row.join('\t')).join('\n')
        totalRows += nonEmptyRows.length
      }
    }
    return text.substring(0, 8000) || '[Empty spreadsheet]'
  } catch {
    return '[Could not extract data from Excel file]'
  }
}

export async function POST(request: NextRequest) {
  // Internal secret check
  const internalSecret = request.headers.get('x-internal-secret')
  const expectedSecret = process.env.INTERNAL_SECRET || 'seisly-internal'
  if (internalSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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

    // 2. Fetch uploaded documents
    const { data: documents } = await supabase
      .from('application_documents')
      .select('*')
      .eq('email', email)
      .eq('scheme', scheme)

    // 3. Download and extract document content
    const documentContents: Record<string, string> = {}
    const documentMessages: Anthropic.Messages.ContentBlockParam[] = []

    if (documents && documents.length > 0) {
      for (const doc of documents) {
        const buffer = await downloadDocument(doc.file_url)
        if (!buffer) {
          documentContents[doc.doc_type] = '[Document could not be downloaded]'
          continue
        }

        const fileName = doc.file_name.toLowerCase()
        const fileSize = buffer.length

        // Check file size - skip content reading for files over 4MB
        if (fileSize > 4 * 1024 * 1024) {
          documentContents[doc.doc_type] =
            `[File too large for automated analysis: ${(fileSize / 1024 / 1024).toFixed(1)}MB. ` +
            `Document exists but content was not read. Manual review recommended.]`
          continue
        }

        if (fileName.endsWith('.pdf')) {
          // Pass PDF natively to Claude via document message
          const base64 = buffer.toString('base64')
          documentMessages.push({
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: base64,
            },
            title: doc.doc_type,
            context: `This is the ${doc.doc_type.replace(/_/g, ' ')} document uploaded for the application.`,
          } as Anthropic.Messages.ContentBlockParam)
          documentContents[doc.doc_type] = '[PDF - see attached document]'
        } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
          documentContents[doc.doc_type] = await extractTextFromDocx(buffer)
        } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
          documentContents[doc.doc_type] = await extractTextFromXlsx(buffer)
        } else if (fileName.match(/\.(jpg|jpeg|png)$/i)) {
          const mediaType = fileName.endsWith('.png') ? 'image/png' as const : 'image/jpeg' as const
          const base64 = buffer.toString('base64')
          documentMessages.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64,
            },
          })
          documentContents[doc.doc_type] = '[Image - see attached]'
        } else {
          documentContents[doc.doc_type] = '[File format not supported for automated reading]'
        }
      }
    }

    // 4. Build application summary
    const appSummary = `
COMPANY: ${application.company_name} (${application.company_number})
SCHEME: ${scheme.toUpperCase()}
INCORPORATED: ${application.incorporated_at}
TRADE STARTED: ${application.trade_started ? 'Yes - ' + application.trade_start_date : 'No'}
TRADE DESCRIPTION: ${application.trade_description}
QUALIFYING ACTIVITY: ${application.qualifying_activity}
RAISING AMOUNT: £${Number(application.raising_amount || 0).toLocaleString()}
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

    // 5. Build document summary for non-PDF docs
    const docTextSummary = Object.entries(documentContents)
      .map(([type, content]) => `\n=== ${type.replace(/_/g, ' ').toUpperCase()} ===\n${content}`)
      .join('\n')

    // 6. PASS 1 - Document adequacy check with actual content
    const pass1Content: Anthropic.Messages.ContentBlockParam[] = [
      {
        type: 'text',
        text: `You are an expert SEIS and EIS advance assurance specialist with over a decade of experience reviewing HMRC applications. You are reviewing a ${scheme.toUpperCase()} advance assurance application for ${application.company_name}.

Here is the application data:
${appSummary}

${docTextSummary ? `Here is the extracted content from uploaded documents (Word and Excel files):\n${docTextSummary}` : ''}

${documentMessages.length > 0 ? 'PDF documents are attached for your review.' : 'No PDF documents were provided.'}

Based on the actual document content provided, assess whether the document pack is adequate for an HMRC ${scheme.toUpperCase()} advance assurance application.

For each document type assess:
1. Whether it has been provided and whether the content is adequate
2. What HMRC will specifically look for in this document
3. Whether the content is consistent with the application form answers
4. Any specific improvements needed

Also assess the application form answers:
- Is the risk to capital narrative substantive and company-specific (minimum 150 words)?
- Is the trade description clear and does it match the business plan?
- Is the share purpose / use of funds adequate for the growth and development requirement (VCM8130)?
- Are there any inconsistencies between the documents and the form answers?
- Does the business plan contain financial forecasts showing growth?
- Are the raising amount and use of funds consistent with the financial model?

Respond ONLY with a JSON object in this exact format with no markdown fences:
{
  "overall": "pass" | "amber" | "fail",
  "summary": "2-3 sentence overall assessment",
  "documents": {
    "business_plan": { "status": "green" | "amber" | "red", "message": "specific feedback based on actual content" },
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
  "action_items": ["list of specific things to fix or improve before submission"]
}`
      },
      ...documentMessages
    ]

    const pass1Response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [{ role: 'user', content: pass1Content }]
    })

    let pass1Results: Record<string, unknown> = {}
    try {
      const pass1Text = pass1Response.content[0].type === 'text'
        ? pass1Response.content[0].text : '{}'
      const cleanPass1 = pass1Text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim()
      pass1Results = JSON.parse(cleanPass1)
    } catch (e) {
      console.error('[AI Review] Pass 1 parse error:', e)
      pass1Results = {
        overall: 'amber',
        summary: 'Review completed. Please check individual sections.',
        documents: {},
        form_answers: {},
        action_items: []
      }
    }

    // 7. PASS 2 - Consistency check
    const pass2Content: Anthropic.Messages.ContentBlockParam[] = [
      {
        type: 'text',
        text: `You are an expert SEIS and EIS advance assurance specialist. You are doing a deep consistency check on a ${scheme.toUpperCase()} advance assurance application for ${application.company_name}.

Here is the full application data:
${appSummary}

${docTextSummary ? `Document content:\n${docTextSummary}` : ''}

${documentMessages.length > 0 ? 'PDF documents are attached.' : ''}

Perform a thorough consistency check:
1. Does the raising amount (£${Number(application.raising_amount || 0).toLocaleString()}) match what is described in the business plan and financial model?
2. Are employee numbers consistent across all documents and the form?
3. Does the use of funds narrative align with VCM8130 growth and development requirement?
4. Is the risk to capital narrative specific to this company?
5. Are the financial forecasts realistic and consistent with the stage of the business?
6. Is the trade description consistent across the form and all documents?
7. Are there any red flags that HMRC would query?
${scheme === 'eis' || scheme === 'both' ? `8. EIS: Does the application clearly demonstrate growth and development per VCM8130 (updated 20 March 2026)?` : ''}

Suggest specific improvements to strengthen the application.

Respond ONLY with a JSON object with no markdown fences:
{
  "overall": "pass" | "amber" | "fail",
  "summary": "2-3 sentence consistency assessment",
  "consistency_checks": {
    "raising_amount": { "status": "green" | "amber" | "red", "message": "feedback" },
    "employee_count": { "status": "green" | "amber" | "red", "message": "feedback" },
    "use_of_funds": { "status": "green" | "amber" | "red", "message": "feedback" },
    "risk_to_capital": { "status": "green" | "amber" | "red", "message": "feedback" },
    "trade_consistency": { "status": "green" | "amber" | "red", "message": "feedback" },
    "growth_development": { "status": "green" | "amber" | "red", "message": "feedback" },
    "financial_forecasts": { "status": "green" | "amber" | "red", "message": "feedback" }
  },
  "suggested_improvements": [
    { "field": "field name", "current": "current answer summary", "suggested": "specific improvement" }
  ]
}`
      },
      ...documentMessages
    ]

    const pass2Response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [{ role: 'user', content: pass2Content }]
    })

    let pass2Results: Record<string, unknown> = {}
    try {
      const pass2Text = pass2Response.content[0].type === 'text'
        ? pass2Response.content[0].text : '{}'
      const cleanPass2 = pass2Text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim()
      pass2Results = JSON.parse(cleanPass2)
    } catch (e) {
      console.error('[AI Review] Pass 2 parse error:', e)
      pass2Results = {
        overall: 'amber',
        summary: 'Consistency check completed.',
        consistency_checks: {},
        suggested_improvements: []
      }
    }

    // 8. Store results
    const overallStatus =
      pass1Results.overall === 'fail' || pass2Results.overall === 'fail'
        ? 'needs_attention'
        : pass1Results.overall === 'amber' || pass2Results.overall === 'amber'
          ? 'amber'
          : 'ready'

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

    // 9. Send email
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://seisly.com'
    const reviewUrl = `${baseUrl}/apply/review?email=${encodeURIComponent(email)}&scheme=${scheme}`

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
            If you have any questions, reply to this email or contact us at support@seisly.com.<br><br>
            Seisly does not guarantee HMRC approval. Advance assurance is discretionary and HMRC's decision is final. Our money-back guarantee applies only where rejection is due to our error.<br><br>
            Seisly is a product of Litigo Limited, 71-75 Shelton Street, London WC2H 9JQ.
          </p>
        </div>
      `
    })

    console.error('[AI Review] Completed for', email, scheme, '- status:', overallStatus)
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
