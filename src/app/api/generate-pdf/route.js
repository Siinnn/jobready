import { NextResponse } from 'next/server'
import { generatePdfBuffer } from '@/lib/pdfGenerator'

/**
 * POST /api/generate-pdf
 * Body: { type: 'cv'|'letter', profile, letterText?, offer? }
 */
export async function POST(req) {
  try {
    const body = await req.json()
    const { type, profile, letterText, offer, template, accentColor } = body

    if (!type || !profile) {
      return NextResponse.json({ error: 'type et profile requis' }, { status: 400 })
    }

    const pdfBuffer = await generatePdfBuffer(type, { profile, letterText, offer, template, accentColor })

    const filename = type === 'cv'
      ? `CV_${profile.firstName || 'Candidat'}_${profile.lastName || ''}.pdf`.replace(/\s+/g, '_')
      : `LM_${profile.firstName || 'Candidat'}_${offer?.company || 'Offre'}.pdf`.replace(/\s+/g, '_')

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (err) {
    console.error('generate-pdf error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
