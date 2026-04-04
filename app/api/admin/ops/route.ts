import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const password = request.headers.get('x-admin-password')
  if (password !== (process.env.ADMIN_PASSWORD || 'seisly-admin-2026')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Total applications
    const { count: totalApps } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })

    // Applications by status
    const { data: allApps } = await supabase
      .from('applications')
      .select('status')

    const statusCounts: Record<string, number> = {}
    allApps?.forEach(a => {
      const s = a.status || 'draft'
      statusCounts[s] = (statusCounts[s] || 0) + 1
    })

    // Waitlist count
    const { count: waitlistCount } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true })

    // Applications in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { count: last7Days } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo)

    // Applications in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { count: last30Days } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo)

    // Recent activity
    const { data: recentActivity } = await supabase
      .from('applications')
      .select('company_name, email, scheme, status, paid, review_status, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(20)

    // System checks
    const systemStatus = {
      supabase: 'green',
      anthropic: process.env.ANTHROPIC_API_KEY ? 'green' : 'red',
      stripe: process.env.STRIPE_SECRET_KEY ? 'green' : 'red',
      resend: process.env.RESEND_API_KEY ? 'green' : 'red',
      voyage: process.env.VOYAGE_API_KEY ? 'green' : 'red',
    }

    // Knowledge base stats
    let kbStats = { totalChunks: 0, lastUpdated: null as string | null, sourceCount: 0 }
    try {
      const { count } = await supabase
        .from('knowledge_base')
        .select('*', { count: 'exact', head: true })
      kbStats.totalChunks = count || 0

      const { data: latestChunk } = await supabase
        .from('knowledge_base')
        .select('last_fetched_at')
        .order('last_fetched_at', { ascending: false })
        .limit(1)
        .single()
      kbStats.lastUpdated = latestChunk?.last_fetched_at || null

      const { data: sources } = await supabase
        .from('knowledge_base')
        .select('source_url')
      const uniqueSources = new Set(sources?.map(s => s.source_url))
      kbStats.sourceCount = uniqueSources.size
    } catch {
      // knowledge_base table may not exist yet
    }

    return NextResponse.json({
      totalApps: totalApps || 0,
      statusCounts,
      waitlistCount: waitlistCount || 0,
      last7Days: last7Days || 0,
      last30Days: last30Days || 0,
      recentActivity: recentActivity || [],
      systemStatus,
      kbStats,
    })
  } catch (err) {
    console.error('Ops error:', err)
    return NextResponse.json({ error: 'Failed to fetch ops data' }, { status: 500 })
  }
}
