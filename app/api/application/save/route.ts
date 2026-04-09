import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { createServerSupabaseClient } from '@/lib/supabase-server'

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

  // Auth: caller must be signed in. We always use the session email —
  // never a client-supplied email — so a caller cannot save against
  // another user's application.
  const authClient = await createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user || !user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const email = user.email

  try {
    const body = await request.json()

    // Validate the status transition. This route is the user-facing save
    // endpoint and only ever sees two legitimate status writes from the
    // client: 'draft' (incremental form saves) and 'documents_uploaded'
    // (after the user uploads their HMRC docs). All other status values —
    // paid, declared, authorised, submitted, review_complete,
    // needs_attention, etc. — are set by dedicated server routes (Stripe
    // webhook, declare/authorise routes, admin routes) and must not be
    // writable from an authenticated user posting to /save.
    const ALLOWED_STATUSES = new Set(['draft', 'documents_uploaded'])
    if (body.status !== undefined && !ALLOWED_STATUSES.has(body.status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
    }

    // One existing-row lookup used by BOTH the documents_uploaded transition
    // check AND the draft-status downgrade protection. Only runs when a
    // status is actually being set — saves an extra DB read on header-only
    // updates.
    let existingPaid: boolean | null = null
    if (body.scheme && body.status !== undefined) {
      const { data: existing } = await supabase
        .from('applications')
        .select('paid')
        .eq('email', email)
        .eq('scheme', body.scheme)
        .maybeSingle()
      existingPaid = existing?.paid ?? null
    }

    // documents_uploaded requires the row to already be paid. Reject any
    // attempt to skip the payment step.
    if (body.status === 'documents_uploaded' && existingPaid !== true) {
      return NextResponse.json(
        { error: 'Cannot transition to documents_uploaded without a paid application' },
        { status: 400 }
      )
    }

    // Protect paid rows: a 'draft' status write must never downgrade a row
    // that has already been paid (handles the user navigating back to /apply
    // after payment and saving incremental edits — the paid status stays).
    const shouldStripStatus = body.status === 'draft' && existingPaid === true

    // Build the upsert payload from a whitelist, only including fields that
    // are explicitly present on the request body. Callers that send a partial
    // body (e.g. /apply/upload sending just {scheme, status,
    // documents_uploaded_at}) must NOT have their other columns wiped to
    // null. An earlier version of this route built the full row from
    // `body.X || null` on every call, which destroyed alesarita76's
    // company_name, utr, trade_description and raising_amount when she
    // submitted on /apply/upload. Never again — presence is the rule.
    const payload: Record<string, unknown> = {
      email,
      updated_at: new Date().toISOString(),
    }

    // scheme is part of the upsert conflict key, so it must always be
    // resolvable. Preserve the prior coercion (empty string → null).
    if (body.scheme !== undefined) {
      payload.scheme = body.scheme || null
    }

    // status has its own downgrade-protection logic above; only write it
    // when it survived that check.
    if (body.status !== undefined && !shouldStripStatus) {
      payload.status = body.status
    }

    if (body.documents_uploaded_at !== undefined) {
      payload.documents_uploaded_at = body.documents_uploaded_at
    }

    // Form-field whitelist: [bodyKey, columnName, optional transform].
    // A field is only written when the key is present on `body` — sending
    // `undefined` (or omitting the key) leaves the existing column untouched.
    const parseMoney = (v: unknown): number | null => {
      if (typeof v !== 'string' || v === '') return null
      const n = parseFloat(v.replace(/,/g, ''))
      return Number.isFinite(n) ? n : null
    }
    const parseCount = (v: unknown): number | null => {
      if (typeof v !== 'string' || v === '') return null
      const n = parseInt(v, 10)
      return Number.isFinite(n) ? n : null
    }

    const FIELD_MAP: Array<[string, string, ((v: unknown) => unknown)?]> = [
      ['companyName', 'company_name'],
      ['companyNumber', 'company_number'],
      ['utr', 'utr'],
      ['incorporatedAt', 'incorporated_at'],
      ['tradeStarted', 'trade_started'],
      ['tradeStartDate', 'trade_start_date'],
      ['tradeDescription', 'trade_description'],
      ['previousVcs', 'previous_vcs'],
      ['previousVcsTypes', 'previous_vcs_types'],
      ['raisingAmount', 'raising_amount', parseMoney],
      ['sharePurpose', 'share_purpose'],
      ['shareClass', 'share_class'],
      ['preferentialRights', 'preferential_rights'],
      ['preferentialRightsDetail', 'preferential_rights_detail'],
      ['grossAssetsBefore', 'gross_assets_before'],
      ['employeeCount', 'employee_count', parseCount],
      ['hasSubsidiaries', 'has_subsidiaries'],
      ['riskToCapital', 'risk_to_capital'],
      ['ukIncorporated', 'uk_incorporated'],
      ['registeredAddress', 'registered_address'],
      ['ukEstablishmentAddress', 'uk_establishment_address'],
      ['establishmentNarrative', 'establishment_narrative'],
      ['grossAssetsAfter', 'gross_assets_after'],
      ['hasCommercialSale', 'has_commercial_sale'],
      ['firstCommercialSaleDate', 'first_commercial_sale_date'],
      ['withinInitialPeriod', 'within_initial_period'],
      ['outsidePeriodReason', 'outside_period_reason'],
      ['previousInvestmentAmount', 'previous_investment_amount', parseMoney],
      ['previousInvestmentDate', 'previous_investment_date'],
      ['newMarketDetails', 'new_market_details'],
      ['signatoryName', 'signatory_name'],
      ['signatoryPosition', 'signatory_position'],
      ['qualifyingActivity', 'qualifying_activity'],
      ['isKic', 'is_kic'],
      ['kickReason', 'kick_reason'],
      ['proposedInvestors', 'proposed_investors'],
    ]

    for (const [bodyKey, column, transform] of FIELD_MAP) {
      if (body[bodyKey] !== undefined) {
        payload[column] = transform ? transform(body[bodyKey]) : body[bodyKey]
      }
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
