import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileName = `${email}/${scheme}/${docType}/${Date.now()}-${file.name}`

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
      file_name: file.name,
      file_url: publicUrl,
      uploaded_at: new Date().toISOString(),
    }, { onConflict: 'email,scheme,doc_type' })

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
