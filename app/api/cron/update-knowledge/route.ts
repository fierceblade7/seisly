import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://seisly.com'
    const res = await fetch(`${baseUrl}/api/admin/ingest-knowledge`, {
      method: 'POST',
      headers: {
        'x-cron-secret': process.env.CRON_SECRET || '',
      },
    })

    const data = await res.json()
    console.error('[Cron] Knowledge base update:', JSON.stringify(data))
    return NextResponse.json({ success: true, ...data })
  } catch (err) {
    console.error('[Cron] Knowledge update failed:', err)
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}
