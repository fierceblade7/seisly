import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const letterLimiter = rateLimit({ name: 'authority-letter', maxRequests: 10, windowMs: 60 * 60 * 1000 })

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  const { success } = letterLimiter.check(ip)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests, please try again later' }, { status: 429 })
  }

  try {
    const { email, scheme } = await request.json()

    if (!email || !scheme) {
      return NextResponse.json({ error: 'Missing email or scheme' }, { status: 400 })
    }

    const { data: app } = await supabase
      .from('applications')
      .select('*')
      .eq('email', email)
      .eq('scheme', scheme)
      .single()

    if (!app || !app.paid) {
      return NextResponse.json({ error: 'Application not found or not paid' }, { status: 404 })
    }

    if (!app.declared_by_name || !app.declared_at) {
      return NextResponse.json({ error: 'Declaration not yet signed' }, { status: 400 })
    }

    // Build address lines
    const addr = app.registered_address || {}
    const addressLines = [
      app.company_name,
      addr.line1,
      addr.line2,
      addr.city,
      addr.postcode,
    ].filter(Boolean)

    // Format date
    const declaredDate = new Date(app.declared_at)
    const formattedDate = declaredDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })

    // Scheme text
    const schemeText = scheme === 'seis'
      ? 'SEIS (EIS/VCT deleted as not applicable)'
      : scheme === 'eis'
      ? 'EIS (SEIS/VCT deleted as not applicable)'
      : 'SEIS and EIS (VCT deleted as not applicable)'

    // Create PDF
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842]) // A4

    const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman)
    const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const { width } = page.getSize()
    const margin = 60
    let y = 842 - 50

    // OFFICIAL header
    page.drawText('OFFICIAL', {
      x: margin, y, size: 10, font: helveticaBold, color: rgb(0, 0, 0),
    })
    y -= 30

    // Title
    page.drawText('Agent Authorisation', {
      x: margin, y, size: 16, font: timesRomanBold, color: rgb(0, 0, 0),
    })
    y -= 20

    page.drawText('Venture Capital Schemes', {
      x: margin, y, size: 14, font: timesRoman, color: rgb(0, 0, 0),
    })
    y -= 30

    // Line
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: rgb(0, 0, 0) })
    y -= 20

    // About this template
    page.drawText('About this template', {
      x: margin, y, size: 11, font: helveticaBold, color: rgb(0, 0, 0),
    })
    y -= 16

    const aboutText = [
      'This authority relates solely to the agent\'s authority to act on behalf of the company in',
      'dealing with HMRC in respect of an application for advance assurance (AA) or the submission',
      'of a Compliance Statement for the Venture Capital Schemes:',
    ]
    for (const line of aboutText) {
      page.drawText(line, { x: margin, y, size: 9, font: timesRoman, color: rgb(0, 0, 0) })
      y -= 13
    }
    y -= 5

    const schemes = [
      'Enterprise Investment Scheme (EIS)',
      'Seed Enterprise Investment Scheme (SEIS)',
      'Venture Capital Trusts (VCTs)',
    ]
    for (const s of schemes) {
      page.drawText(`\u25A0  ${s}`, { x: margin + 10, y, size: 9, font: timesRoman, color: rgb(0, 0, 0) })
      y -= 13
    }
    y -= 5

    const noteLines = [
      'This will not replace a 64-8 provided in respect of a company\'s corporation tax affairs.',
      'This template should be used where the agent completes the new AA form and/or Compliance',
      'Statement on behalf of the company.',
      '',
      'Please note that this template must be submitted with each new application where an agent',
      'has completed an AA form or Compliance Statement on behalf of the company. HMRC will',
      'accept templates dated within 2 months of the date an application is made.',
      '',
      'This template can only be completed by a director, company secretary, or other registered',
      'officer of the company.',
    ]
    for (const line of noteLines) {
      if (line === '') { y -= 6; continue }
      page.drawText(line, { x: margin, y, size: 9, font: timesRoman, color: rgb(0, 0, 0) })
      y -= 13
    }
    y -= 15

    // Line
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: rgb(0, 0, 0) })
    y -= 20

    // Agent Authorisation heading
    page.drawText('Agent Authorisation', {
      x: margin, y, size: 13, font: timesRomanBold, color: rgb(0, 0, 0),
    })
    y -= 25

    // I [name]
    page.drawText('I', { x: margin, y, size: 11, font: timesRoman, color: rgb(0, 0, 0) })
    page.drawText(app.declared_by_name, { x: margin + 20, y, size: 12, font: timesRoman, color: rgb(0, 0, 0) })
    page.drawText('(Name)', { x: width - margin - 50, y, size: 9, font: timesRoman, color: rgb(0.4, 0.4, 0.4) })
    y -= 20

    // As [position]
    page.drawText('As', { x: margin, y, size: 11, font: timesRoman, color: rgb(0, 0, 0) })
    page.drawText(app.declared_by_position || '', { x: margin + 25, y, size: 11, font: timesRoman, color: rgb(0, 0, 0) })
    page.drawText('(Position in company)', { x: width - margin - 115, y, size: 9, font: timesRoman, color: rgb(0.4, 0.4, 0.4) })
    y -= 20

    // Of [company]
    page.drawText('Of', { x: margin, y, size: 11, font: timesRoman, color: rgb(0, 0, 0) })
    page.drawText(app.company_name || '', { x: margin + 20, y, size: 11, font: timesRoman, color: rgb(0, 0, 0) })
    page.drawText('(Company Name)', { x: width - margin - 90, y, size: 9, font: timesRoman, color: rgb(0.4, 0.4, 0.4) })
    y -= 18

    // Address lines
    for (const line of addressLines.slice(1)) {
      page.drawText(line, { x: margin + 20, y, size: 11, font: timesRoman, color: rgb(0, 0, 0) })
      y -= 18
    }
    y -= 10

    // Confirm that I authorise
    page.drawText('Confirm that I authorise', { x: margin, y, size: 11, font: timesRoman, color: rgb(0, 0, 0) })
    y -= 20

    // Agent name
    page.drawText('Litigo Limited (trading as Seisly)', { x: margin + 20, y, size: 11, font: timesRoman, color: rgb(0, 0, 0) })
    page.drawText('(Agent Name)', { x: width - margin - 75, y, size: 9, font: timesRoman, color: rgb(0.4, 0.4, 0.4) })
    y -= 20

    // To act on behalf
    page.drawText('To act on behalf of the Company listed above in relation to the', { x: margin, y, size: 11, font: timesRoman, color: rgb(0, 0, 0) })
    y -= 16
    page.drawText(schemeText + ' application submitted to HMRC.', { x: margin, y, size: 11, font: timesRoman, color: rgb(0, 0, 0) })
    y -= 30

    // Signature
    page.drawText(app.declared_by_name, { x: margin, y, size: 16, font: timesRoman, color: rgb(0, 0, 0) })
    page.drawText('(Signature)', { x: margin + 200, y, size: 9, font: timesRoman, color: rgb(0.4, 0.4, 0.4) })
    y -= 20

    // Date
    page.drawText(formattedDate, { x: margin, y, size: 11, font: timesRoman, color: rgb(0, 0, 0) })
    page.drawText('(Date)', { x: margin + 200, y, size: 9, font: timesRoman, color: rgb(0.4, 0.4, 0.4) })
    y -= 30

    // Line
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: rgb(0, 0, 0) })
    y -= 15

    // Footer note
    const footerLines = [
      'Your confirmation will not be held on file with HMRC Venture Capital Reliefs Team and will',
      'not apply to future applications submitted to the HMRC Venture Capital Reliefs Team.',
      'Please submit an updated authority for any future applications.',
    ]
    for (const line of footerLines) {
      page.drawText(line, { x: margin, y, size: 9, font: timesRoman, color: rgb(0, 0, 0) })
      y -= 13
    }
    y -= 20

    // Seisly footer
    page.drawText('Generated by Seisly (seisly.com) - a product of Litigo Limited', {
      x: margin, y, size: 8, font: helvetica, color: rgb(0.6, 0.6, 0.6),
    })

    // Serialize PDF
    const pdfBytes = await pdfDoc.save()
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64')

    // Store in Supabase Storage
    const fileName = `${email}/${scheme}/authority-letter-${Date.now()}.pdf`
    await supabase.storage
      .from('application-documents')
      .upload(fileName, Buffer.from(pdfBytes), {
        contentType: 'application/pdf',
        upsert: true,
      })

    const { data: { publicUrl } } = supabase.storage
      .from('application-documents')
      .getPublicUrl(fileName)

    // Update application with authority letter URL
    await supabase
      .from('applications')
      .update({ authority_letter_url: publicUrl })
      .eq('email', email)
      .eq('scheme', scheme)

    return NextResponse.json({ success: true, pdfBase64, url: publicUrl })
  } catch (err) {
    console.error('Authority letter error:', err)
    return NextResponse.json({ error: 'Failed to generate letter' }, { status: 500 })
  }
}
