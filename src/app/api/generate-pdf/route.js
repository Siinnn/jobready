import { NextResponse } from 'next/server'
import { generatePdfBuffer } from '@/lib/pdfGenerator'
import { enforceRateLimit } from '@/lib/rateLimit'

// N'autorise dans le nom de fichier que des caractères sans risque pour
// l'en-tête HTTP Content-Disposition (jamais de guillemet, de retour à la
// ligne ou de caractère de contrôle), et borne sa longueur.
function safeFilename(name, fallback) {
  const cleaned = String(name || '').replace(/[^\p{L}\p{N} _-]+/gu, '').trim()
  return (cleaned || fallback).slice(0, 120)
}

/**
 * POST /api/generate-pdf
 * Body: { type: 'cv'|'letter', profile, letterText?, offer? }
 */
export async function POST(req) {
  const limit = await enforceRateLimit(req, 'generatePdf')
  if (!limit.ok) return limit.response

  try {
    const body = await req.json()
    const { type, profile, letterText, offer, template, accentColor } = body

    if (!type || !profile || typeof profile !== 'object') {
      return NextResponse.json({ error: 'type et profile requis' }, { status: 400 })
    }
    if (type !== 'cv' && type !== 'letter') {
      return NextResponse.json({ error: 'type invalide : cv ou letter' }, { status: 400 })
    }

    const pdfBuffer = await generatePdfBuffer(type, { profile, letterText, offer, template, accentColor })

    const filename = type === 'cv'
      ? `CV_${safeFilename(profile.firstName, 'Candidat')}_${safeFilename(profile.lastName, '')}.pdf`.replace(/\s+/g, '_')
      : `LM_${safeFilename(profile.firstName, 'Candidat')}_${safeFilename(offer?.company, 'Offre')}.pdf`.replace(/\s+/g, '_')

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
    return NextResponse.json({ error: "La génération du PDF a échoué. Réessayez." }, { status: 500 })
  }
}
