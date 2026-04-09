import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET = 'application-documents'
// Path of every uploaded doc starts after this segment in the public URL.
const PUBLIC_PREFIX = `/storage/v1/object/public/${BUCKET}/`
const SIGNED_URL_TTL_SECONDS = 60 * 60 // 1 hour

// Reconstruct the storage object path from the public URL stored at upload
// time (`/storage/v1/object/public/application-documents/<path>`). Returns
// null if the URL doesn't match the expected shape.
function pathFromPublicUrl(publicUrl: string): string | null {
  const idx = publicUrl.indexOf(PUBLIC_PREFIX)
  if (idx < 0) return null
  return publicUrl.slice(idx + PUBLIC_PREFIX.length)
}

export async function GET(request: NextRequest) {
  const password = request.headers.get('x-admin-password')
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  if (password !== adminPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const email = request.nextUrl.searchParams.get('email')
  const scheme = request.nextUrl.searchParams.get('scheme')
  if (!email || !scheme) {
    return NextResponse.json({ error: 'Missing email or scheme' }, { status: 400 })
  }

  const { data: rows, error } = await supabase
    .from('application_documents')
    .select('doc_type, file_name, file_url, uploaded_at')
    .eq('email', email)
    .eq('scheme', scheme)
    .order('uploaded_at', { ascending: true })

  if (error) {
    console.error('Admin documents fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }

  // Sign each path so admin access doesn't depend on the bucket being public.
  const documents = await Promise.all(
    (rows || []).map(async row => {
      const path = pathFromPublicUrl(row.file_url as string)
      let signed_url: string | null = null
      if (path) {
        const { data: signed } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)
        signed_url = signed?.signedUrl ?? null
      }
      return {
        doc_type: row.doc_type,
        file_name: row.file_name,
        uploaded_at: row.uploaded_at,
        signed_url,
      }
    })
  )

  return NextResponse.json({ documents })
}
