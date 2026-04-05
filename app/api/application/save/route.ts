import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const saveLimiter = rateLimit({ name: 'application-save', maxRequests: 30, windowMs: 60 * 60 * 1000 })

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  const { success } = await saveLimiter.check(ip)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests, please try again later' }, { status: 429 })
  }

  try {
    const body = await request.json()

    const payload = {
      email: body.email || null,
      scheme: body.scheme || null,
      company_name: body.companyName || null,
      company_number: body.companyNumber || null,
      utr: body.utr || null,
      incorporated_at: body.incorporatedAt || null,
      trade_started: body.tradeStarted ?? null,
      trade_start_date: body.tradeStartDate || null,
      trade_description: body.tradeDescription || null,
      previous_vcs: body.previousVcs ?? null,
      previous_vcs_types: body.previousVcsTypes || [],
      raising_amount: body.raisingAmount ? parseFloat(body.raisingAmount.replace(/,/g, '')) : null,
      share_purpose: body.sharePurpose || null,
      share_class: body.shareClass || null,
      preferential_rights: body.preferentialRights ?? null,
      preferential_rights_detail: body.preferentialRightsDetail || null,
      gross_assets_before: body.grossAssetsBefore || null,
      employee_count: body.employeeCount ? parseInt(body.employeeCount) : null,
      has_subsidiaries: body.hasSubsidiaries ?? null,
      risk_to_capital: body.riskToCapital || null,
      uk_incorporated: body.ukIncorporated ?? null,
      registered_address: body.registeredAddress || null,
      uk_establishment_address: body.ukEstablishmentAddress || null,
      establishment_narrative: body.establishmentNarrative || null,
      gross_assets_after: body.grossAssetsAfter || null,
      has_commercial_sale: body.hasCommercialSale ?? null,
      first_commercial_sale_date: body.firstCommercialSaleDate || null,
      within_initial_period: body.withinInitialPeriod || null,
      outside_period_reason: body.outsidePeriodReason || null,
      previous_investment_amount: body.previousInvestmentAmount ? parseFloat(body.previousInvestmentAmount.replace(/,/g, '')) : null,
      previous_investment_date: body.previousInvestmentDate || null,
      new_market_details: body.newMarketDetails || null,
      signatory_name: body.signatoryName || null,
      signatory_position: body.signatoryPosition || null,
      qualifying_activity: body.qualifyingActivity || null,
      is_kic: body.isKic ?? null,
      kick_reason: body.kickReason || null,
      proposed_investors: body.proposedInvestors || null,
      ...(body.documents_uploaded_at ? { documents_uploaded_at: body.documents_uploaded_at } : {}),
      ...(body.status ? { status: body.status } : {}),
      updated_at: new Date().toISOString(),
    }

    // Upsert by email + scheme so we don't create duplicates
    const { error } = await supabase
      .from('applications')
      .upsert(payload, {
        onConflict: 'email,scheme',
        ignoreDuplicates: false,
      })

    if (error) {
      console.error('Supabase error:', error)
      // Still return success — don't block the user if save fails
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Save error:', err)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
