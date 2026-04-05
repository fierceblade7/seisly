import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { queryKnowledgeBase } from '@/lib/knowledge-ingest'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// Requires Vercel Pro plan (hobby limit is 60s)
export const maxDuration = 120

const PROMPT_VERSION = '2.0.0'
const reviewLimiter = rateLimit({ name: 'review-run', maxRequests: 5, windowMs: 60 * 60 * 1000 })

async function downloadDocument(fileUrl: string): Promise<Buffer | null> {
  try {
    const response = await fetch(fileUrl)
    if (!response.ok) return null
    return Buffer.from(await response.arrayBuffer())
  } catch { return null }
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    return result.value.substring(0, 8000)
  } catch { return '[Could not extract text from Word document]' }
}

async function extractTextFromXlsx(buffer: Buffer): Promise<string> {
  try {
    const XLSX = await import('xlsx')
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    let text = ''
    const prioritySheets = ['Summary', 'P&L', 'PL', 'Forecast', 'Revenue', 'Headcount', 'Assumptions', 'Model', 'Financial']
    const sheets = workbook.SheetNames.sort((a: string, b: string) => {
      const aP = prioritySheets.some(p => a.toLowerCase().includes(p.toLowerCase()))
      const bP = prioritySheets.some(p => b.toLowerCase().includes(p.toLowerCase()))
      if (aP && !bP) return -1; if (!aP && bP) return 1; return 0
    })
    let totalRows = 0
    for (const sheetName of sheets) {
      if (totalRows >= 500) break
      const sheet = workbook.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false }) as string[][]
      const nonEmpty = rows.filter((row: string[]) => row.some((c: string) => c !== '' && c !== null && c !== undefined)).slice(0, Math.min(100, 500 - totalRows))
      if (nonEmpty.length > 0) { text += `\n[Sheet: ${sheetName}]\n` + nonEmpty.map((r: string[]) => r.join('\t')).join('\n'); totalRows += nonEmpty.length }
    }
    return text.substring(0, 10000) || '[Empty spreadsheet]'
  } catch { return '[Could not extract data from Excel file]' }
}

const SYSTEM_PROMPT = `You are an expert SEIS and EIS advance assurance reviewer with deep knowledge of HMRC Venture Capital Schemes rules, including VCM8130 (growth and development), VCM8100 (risk to capital), the qualifying trade requirements, share structure requirements, and all relevant legislation.

You are reviewing a SEIS/EIS advance assurance application. You will receive the application form data and the content of uploaded documents.

Perform every check listed below. For each check return a JSON object with:
- id: the check ID (e.g. "A1", "B2")
- category: the category letter and name
- description: what the check verifies
- status: "pass", "warn", or "fail"
- confidence: "high", "medium", or "low"
- notes: specific finding for THIS application (never generic)

After all checks, return an overall assessment.

Return ONLY valid JSON matching this exact structure (no markdown fences):
{
  "checks": [
    { "id": "A1", "category": "A - Company eligibility", "description": "...", "status": "pass|warn|fail", "confidence": "high|medium|low", "notes": "..." },
    ...
  ],
  "overall_status": "green|amber|red",
  "confidence": "high|medium|low",
  "priority": "spot check only|standard review|full review required",
  "summary": "2-3 sentence plain English summary",
  "issues": [
    { "id": "...", "status": "warn|fail", "notes": "..." }
  ]
}

CHECKS TO PERFORM:

Category A - Company eligibility:
A1: UK incorporated or has permanent establishment in UK
A2: Unquoted - not listed on a recognised stock exchange
A3: Gross assets do not exceed limit (SEIS: £350k before / EIS: £15m before, £16m after)
A4: Employee count within limit (SEIS: <25 FTE / EIS: <250 FTE, <500 for KICs)
A5: Company trading less than limit (SEIS: 3 years from first trade / EIS: 7 years, 10 for KICs)
A6: Has not exceeded lifetime raise limit (SEIS: £250k / EIS: £5m in 12 months)
A7: Not controlled by another company unless qualifying subsidiary
A8: No prior EIS/VCT investment before trade commenced (SEIS only)

Category B - Trade eligibility:
B1: Trade description identifies a qualifying trade
B2: No excluded activities (banking, insurance, legal/accounting, property development, hotels, nursing homes, farming, non-approved energy generation, leasing, receivables financing)
B3: Trade is not a non-qualifying activity disguised as qualifying
B4: If KIC status claimed, criteria are met

Category C - Share structure:
C1: Shares being issued are new ordinary shares
C2: No preferential rights to assets on winding up
C3: No pre-emption rights that would block new investors
C4: No arrangements for shares to be redeemed or bought back
C5: No guaranteed returns or fixed dividends
C6: No pre-arranged exit or put options

Category D - Use of funds:
D1: Funds for growth and development of qualifying trade
D2: Not to acquire another business or trade
D3: Not to repay existing loans
D4: Not to pay existing shareholders
D5: Funds are for qualifying business activity only

Category E - Risk to capital:
E1: Statement addresses genuine risk of loss of capital
E2: Investment is not capital-protected or guaranteed
E3: No side arrangements that reduce investor risk
E4: Statement is specific to company circumstances, not generic boilerplate

Category F - Document adequacy:
F1: Business plan covers background, product/service, market, team, financials, use of funds
F2: Articles of association present
F3: Shareholder agreement present if applicable
F4: Latest accounts or management accounts present if trading
F5: Companies House confirmation or incorporation certificate present
F6: Share structure or cap table present

Category G - Document consistency:
G1: Company name matches across documents and application
G2: Incorporation date matches
G3: Trade description consistent between business plan and application
G4: Use of funds consistent between business plan and application
G5: Employee numbers consistent
G6: Gross assets in accounts consistent with application
G7: Share class in articles consistent - ordinary shares, no preferential rights
G8: Articles do not contain pre-arranged exit clauses
G9: Articles do not contain preferential rights to assets or dividends
G10: Shareholder agreement does not contain put options or guaranteed returns
G11: Shareholder agreement does not contain drag-along terms constituting pre-arranged exit

Category H - Red flags:
H1: Trade description is not vague or generic
H2: Risk to capital statement is not boilerplate
H3: Use of funds does not include debt repayment or acquisition
H4: Gross assets not within 10% of the limit
H5: Employee count not within 2 of the limit
H6: Age of company not within 3 months of the limit
H7: Previous VCS investment checked for impact on eligibility

Be thorough. If you cannot verify something from the documents provided, set confidence to "low" and note what is missing. Never guess - state clearly when information is insufficient.`

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  const { success } = await reviewLimiter.check(ip)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests, please try again later' }, { status: 429 })
  }

  const internalSecret = request.headers.get('x-internal-secret')
  const expectedSecret = process.env.INTERNAL_SECRET
  if (!expectedSecret) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  if (internalSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let email = ''
  let scheme = ''

  try {
    const body = await request.json()
    email = body.email
    scheme = body.scheme

    const { data: application } = await supabase
      .from('applications')
      .select('*')
      .eq('email', email)
      .eq('scheme', scheme)
      .single()

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Fetch uploaded documents
    const { data: documents } = await supabase
      .from('application_documents')
      .select('*')
      .eq('email', email)
      .eq('scheme', scheme)

    // Download and extract document content
    const documentContents: Record<string, string> = {}
    const documentMessages: Anthropic.Messages.ContentBlockParam[] = []

    if (documents && documents.length > 0) {
      for (const doc of documents) {
        const buffer = await downloadDocument(doc.file_url)
        if (!buffer) { documentContents[doc.doc_type] = '[Could not download]'; continue }
        const fileName = doc.file_name.toLowerCase()
        if (buffer.length > 4 * 1024 * 1024) {
          documentContents[doc.doc_type] = `[File too large: ${(buffer.length / 1024 / 1024).toFixed(1)}MB]`; continue
        }
        if (fileName.endsWith('.pdf')) {
          documentMessages.push({
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: buffer.toString('base64') },
            title: doc.doc_type,
            context: `${doc.doc_type.replace(/_/g, ' ')} document.`,
          } as Anthropic.Messages.ContentBlockParam)
          documentContents[doc.doc_type] = '[PDF attached]'
        } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
          documentContents[doc.doc_type] = await extractTextFromDocx(buffer)
        } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
          documentContents[doc.doc_type] = await extractTextFromXlsx(buffer)
        } else if (fileName.match(/\.(jpg|jpeg|png)$/i)) {
          const mediaType = fileName.endsWith('.png') ? 'image/png' as const : 'image/jpeg' as const
          documentMessages.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data: buffer.toString('base64') } })
          documentContents[doc.doc_type] = '[Image attached]'
        } else {
          documentContents[doc.doc_type] = '[Unsupported format]'
        }
      }
    }

    // Build application summary
    const appSummary = `
APPLICATION DATA:
Company: ${application.company_name} (${application.company_number})
Scheme: ${scheme.toUpperCase()}
Incorporated: ${application.incorporated_at}
UK Incorporated: ${application.uk_incorporated}
Trade Started: ${application.trade_started ? 'Yes - ' + application.trade_start_date : 'No'}
Trade Description: ${application.trade_description}
Qualifying Activity: ${application.qualifying_activity}
Raising Amount: £${Number(application.raising_amount || 0).toLocaleString()}
Share Purpose / Use of Funds: ${application.share_purpose}
Risk to Capital: ${application.risk_to_capital}
Share Class: ${application.share_class}
Preferential Rights: ${application.preferential_rights ? 'Yes - ' + application.preferential_rights_detail : 'No'}
Previous VCS: ${application.previous_vcs ? 'Yes - types: ' + (application.previous_vcs_types || []).join(', ') : 'No'}
Gross Assets Before: ${application.gross_assets_before}
Gross Assets After: ${application.gross_assets_after || 'N/A'}
Employee Count: ${application.employee_count}
Has Subsidiaries: ${application.has_subsidiaries}
Has Commercial Sale: ${application.has_commercial_sale}
First Commercial Sale Date: ${application.first_commercial_sale_date || 'N/A'}
Within Initial Period: ${application.within_initial_period || 'N/A'}
Is KIC: ${application.is_kic || false}
Not Controlled: ${application.not_controlled !== false}
`.trim()

    const docTextSummary = Object.entries(documentContents)
      .map(([type, content]) => `\n=== ${type.replace(/_/g, ' ').toUpperCase()} ===\n${content}`)
      .join('\n')

    // RAG: query knowledge base for relevant legislation and guidance
    let ragContext = ''
    try {
      const ragQuery = `${scheme.toUpperCase()} advance assurance ${application.trade_description || ''} ${application.qualifying_activity || ''}`
      const ragChunks = await queryKnowledgeBase(ragQuery, 10)
      if (ragChunks.length > 0) {
        ragContext = 'RELEVANT HMRC LEGISLATION AND GUIDANCE:\n' +
          ragChunks.map(c => `[${c.source_name}${c.section_reference ? ' - ' + c.section_reference : ''}]\n${c.content}`).join('\n\n') +
          '\n\n'
      }
    } catch (ragErr) {
      console.error('[AI Review] RAG query failed, proceeding without:', ragErr)
    }

    const systemPromptWithRag = ragContext
      ? ragContext + 'Using the above legislation and guidance, ' + SYSTEM_PROMPT.charAt(0).toLowerCase() + SYSTEM_PROMPT.slice(1)
      : SYSTEM_PROMPT

    const userContent: Anthropic.Messages.ContentBlockParam[] = [
      {
        type: 'text',
        text: `Review this ${scheme.toUpperCase()} advance assurance application for ${application.company_name}.

${appSummary}

UPLOADED DOCUMENTS:
${documents?.map(d => `- ${d.doc_type}: ${d.file_name}`).join('\n') || 'No documents uploaded'}

DOCUMENT CONTENT (text extracted from Word/Excel files):
${docTextSummary || 'No text content extracted'}

${documentMessages.length > 0 ? 'PDF and image documents are attached for your review.' : ''}

Perform all checks A1-H7 and return the structured JSON result.`
      },
      ...documentMessages
    ]

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: systemPromptWithRag,
      messages: [{ role: 'user', content: userContent }]
    })

    let reviewResult: Record<string, unknown> = {}
    try {
      const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
      const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()
      reviewResult = JSON.parse(clean)
    } catch (e) {
      console.error('[AI Review] Parse error:', e)
      reviewResult = {
        checks: [],
        overall_status: 'amber',
        confidence: 'low',
        priority: 'full review required',
        summary: 'AI review completed but output could not be parsed. Manual review required.',
        issues: []
      }
    }

    // Map overall_status to review_status column
    const overallStatus = (reviewResult.overall_status as string) || 'amber'
    const reviewStatus = overallStatus === 'green' ? 'ready' : overallStatus === 'red' ? 'needs_attention' : 'amber'

    await supabase
      .from('applications')
      .update({
        review_status: reviewStatus,
        review_completed_at: new Date().toISOString(),
        ai_review_result: {
          ...reviewResult,
          prompt_version: PROMPT_VERSION,
          reviewed_at: new Date().toISOString(),
          model: 'claude-sonnet-4-6',
        },
        review_results: reviewResult,
        review_released: false,
      })
      .eq('email', email)
      .eq('scheme', scheme)

    console.log('[AI Review] Completed for', email, scheme, '- status:', overallStatus)
    return NextResponse.json({ success: true, status: overallStatus })

  } catch (err) {
    console.error('[AI Review] Error:', err)
    try {
      if (email) {
        await supabase.from('applications').update({ review_status: 'failed' }).eq('email', email).eq('scheme', scheme)
      }
    } catch {}
    return NextResponse.json({ error: 'Review failed' }, { status: 500 })
  }
}
