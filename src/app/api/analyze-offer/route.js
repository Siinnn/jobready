import { NextResponse } from 'next/server'
import { analyzeOffer } from '@/lib/ai'

/**
 * POST /api/analyze-offer
 * Body: { text: string, sourceUrl?: string }
 */
export async function POST(req) {
  try {
    const { text, sourceUrl } = await req.json()

    if (!text || text.trim().length < 100) {
      return NextResponse.json({ error: 'Texte trop court pour analyser.' }, { status: 400 })
    }

    const offer = await analyzeOffer(text)

    // Reinjecter l'URL source si elle n'a pas ete detectee
    if (sourceUrl && (!offer.url || offer.url === 'null')) {
      offer.url = sourceUrl
    }

    return NextResponse.json({ success: true, offer })
  } catch (err) {
    console.error('analyze-offer error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
