import { NextRequest, NextResponse } from 'next/server'
import { ingestAll } from '@/lib/knowledge-ingest'

// Requires Vercel Pro plan (hobby limit is 60s)
export const maxDuration = 300

export async function POST(request: NextRequest) {
  const password = request.headers.get('x-admin-password')
  const cronSecret = request.headers.get('x-cron-secret')

  // Allow access via admin password or cron secret
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  const isAdmin = password === adminPassword
  const isCron = cronSecret === process.env.CRON_SECRET

  if (!isAdmin && !isCron) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const results = await ingestAll()
    return NextResponse.json(results)
  } catch (err) {
    console.error('Knowledge ingestion error:', err)
    return NextResponse.json({ error: 'Ingestion failed' }, { status: 500 })
  }
}
