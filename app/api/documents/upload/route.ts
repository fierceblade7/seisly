import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
])

const ALLOWED_EXTENSIONS = new Set([
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png',
])

function sanitiseFilename(name: string): string {
  // Extract extension
  const lastDot = name.lastIndexOf('.')
  const ext = lastDot >= 0 ? name.slice(lastDot) : ''
  const base = lastDot >= 0 ? name.slice(0, lastDot) : name
  // Strip non-alphanumeric, dot, hyphen, underscore
  const cleanBase = base.replace(/[^a-zA-Z0-9._-]/g, '_')
  return cleanBase + ext.toLowerCase()
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const docType = formData.get('docType') as string
    const email = formData.get('email') as string
    const scheme = formData.get('scheme') as string

    if (!file || !docType || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate docType against whitelist
    const ALLOWED_DOC_TYPES = ['business_plan', 'accounts', 'articles', 'shareholder_list', 'investor_documents', 'subscription_agreement']
    if (!ALLOWED_DOC_TYPES.includes(docType)) {
      return NextResponse.json({ error: 'Invalid document type.' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 })
    }

    // Validate file type by MIME type
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'File type not allowed. Please upload PDF, Word, Excel, JPEG or PNG files only.' }, { status: 400 })
    }

    // Validate file extension
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: 'File type not allowed. Please upload PDF, Word, Excel, JPEG or PNG files only.' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const safeName = sanitiseFilename(file.name)
    const fileName = `${email}/${scheme}/${docType}/${Date.now()}-${safeName}`

    const { error: uploadError } = await supabase.storage
      .from('application-documents')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('application-documents')
      .getPublicUrl(fileName)

    await supabase.from('application_documents').upsert({
      email,
      scheme,
      doc_type: docType,
      file_name: safeName,
      file_url: publicUrl,
      uploaded_at: new Date().toISOString(),
    }, { onConflict: 'email,scheme,doc_type' })

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
