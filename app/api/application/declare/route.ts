import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { email, scheme, name, position } = await request.json()

    if (!email || !scheme || !name || !position) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await supabase
      .from('applications')
      .update({
        status: 'declared',
        declared_at: new Date().toISOString(),
        declared_by_name: name,
        declared_by_position: position,
      })
      .eq('email', email)
      .eq('scheme', scheme)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Declaration error:', err)
    return NextResponse.json({ error: 'Declaration failed' }, { status: 500 })
  }
}
