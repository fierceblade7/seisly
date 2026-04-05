import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY!)

// Requires Vercel Pro plan (hobby limit is 60s)
export const maxDuration = 120

const TABLES = [
  {
    name: 'applications',
    select: 'id, email, scheme, company_name, company_number, utr, incorporated_at, status, paid, paid_at, trade_started, trade_start_date, trade_description, qualifying_activity, previous_vcs, previous_vcs_types, raising_amount, share_purpose, share_class, preferential_rights, preferential_rights_detail, gross_assets_before, gross_assets_after, employee_count, has_subsidiaries, risk_to_capital, uk_incorporated, registered_address, uk_establishment_address, establishment_narrative, has_commercial_sale, first_commercial_sale_date, within_initial_period, outside_period_reason, previous_investment_amount, previous_investment_date, new_market_details, signatory_name, signatory_position, review_status, review_released, declared_at, declared_by_name, declared_by_position, authorised_at, authorised_by_name, submission_requested_at, submitted_at, authority_letter_expires_at, authority_letter_url, admin_notes, novar_promo_code, documents_uploaded_at, created_at, updated_at',
  },
  {
    name: 'waitlist',
    select: '*',
  },
  {
    name: 'complex_cases',
    select: '*',
  },
  {
    name: 'application_documents',
    select: '*',
  },
  {
    name: 'knowledge_base',
    select: 'id, source_url, source_name, section_reference, content_hash, last_fetched_at, created_at, updated_at',
  },
]

interface BackupResult {
  table: string
  rows: number
  sizeBytes: number
  success: boolean
  error?: string
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const date = new Date().toISOString().split('T')[0]
  const results: BackupResult[] = []
  let allSuccess = true

  for (const table of TABLES) {
    const result: BackupResult = {
      table: table.name,
      rows: 0,
      sizeBytes: 0,
      success: false,
    }

    try {
      const { data, error } = await supabase
        .from(table.name)
        .select(table.select)

      if (error) throw error

      const rows = data || []
      const json = JSON.stringify(rows, null, 2)
      const buffer = Buffer.from(json, 'utf-8')

      result.rows = rows.length
      result.sizeBytes = buffer.length

      const filePath = `${date}/${table.name}.json`
      const { error: uploadError } = await supabase.storage
        .from('backups')
        .upload(filePath, buffer, {
          contentType: 'application/json',
          upsert: true,
        })

      if (uploadError) throw uploadError

      result.success = true
    } catch (err) {
      result.error = err instanceof Error ? err.message : 'Unknown error'
      allSuccess = false
      console.error(`[Backup] Failed for ${table.name}:`, result.error)
    }

    results.push(result)
  }

  const totalRows = results.reduce((sum, r) => sum + r.rows, 0)
  const totalSize = results.reduce((sum, r) => sum + r.sizeBytes, 0)
  const totalSizeKB = (totalSize / 1024).toFixed(1)
  const failedTables = results.filter(r => !r.success)

  // Send summary email
  try {
    await resend.emails.send({
      from: 'Seisly <hello@seisly.com>',
      to: 'sw1970@gmail.com',
      subject: `Seisly daily backup - ${date}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1a1a18;">
          <div style="margin-bottom: 24px;">
            <span style="font-size: 24px; font-weight: 400;">Seis<span style="color: #0d7a5f;">ly</span></span>
          </div>
          <h1 style="font-size: 22px; font-weight: 400; margin-bottom: 16px;">
            Daily backup ${allSuccess ? 'completed' : 'completed with errors'}
          </h1>
          <p style="font-size: 14px; color: #555; margin-bottom: 16px;">
            Date: <strong>${date}</strong> | Total rows: <strong>${totalRows}</strong> | Total size: <strong>${totalSizeKB} KB</strong>
          </p>
          ${failedTables.length > 0 ? `
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
              <p style="font-size: 13px; color: #c0392b; font-weight: 500; margin: 0 0 8px 0;">Failed tables:</p>
              ${failedTables.map(t => `<p style="font-size: 13px; color: #c0392b; margin: 4px 0;">${t.table}: ${t.error}</p>`).join('')}
            </div>
          ` : ''}
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr style="border-bottom: 2px solid #f0f0ec;">
              <th style="text-align: left; padding: 8px 0; color: #888;">Table</th>
              <th style="text-align: right; padding: 8px 0; color: #888;">Rows</th>
              <th style="text-align: right; padding: 8px 0; color: #888;">Size</th>
              <th style="text-align: right; padding: 8px 0; color: #888;">Status</th>
            </tr>
            ${results.map(r => `
              <tr style="border-bottom: 1px solid #f0f0ec;">
                <td style="padding: 8px 0;">${r.table}</td>
                <td style="text-align: right; padding: 8px 0;">${r.rows}</td>
                <td style="text-align: right; padding: 8px 0;">${(r.sizeBytes / 1024).toFixed(1)} KB</td>
                <td style="text-align: right; padding: 8px 0; color: ${r.success ? '#0d7a5f' : '#c0392b'};">${r.success ? 'OK' : 'FAILED'}</td>
              </tr>
            `).join('')}
          </table>
          <p style="font-size: 12px; color: #aaa; margin-top: 24px;">
            Files saved to Supabase Storage: backups/${date}/
          </p>
        </div>
      `,
    })
  } catch (emailErr) {
    console.error('[Backup] Email notification failed:', emailErr)
  }

  console.log(`[Backup] ${date}: ${totalRows} rows, ${totalSizeKB} KB, ${failedTables.length} failures`)
  return NextResponse.json({ date, results, totalRows, totalSize, allSuccess })
}
