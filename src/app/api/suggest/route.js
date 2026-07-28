import { NextResponse } from 'next/server'
import { generateSummaries } from '@/lib/ai'
import { enforceRateLimit, rateLimitHeaders } from '@/lib/rateLimit'

export const maxDuration = 45

export async function POST(req) {
  const limit = await enforceRateLimit(req, 'suggest')
  if (!limit.ok) return limit.response

  try {
    const { kind, payload = {} } = await req.json()
    if (kind === 'summary') {
      const suggestions = await generateSummaries(payload)
      if (!suggestions.length) throw new Error('Aucune suggestion générée')
      return NextResponse.json({ suggestions }, { headers: rateLimitHeaders('suggest', limit.remaining) })
    }
    return NextResponse.json({ error: `Type de suggestion inconnu : ${kind}` }, { status: 400 })
  } catch (e) {
    if (e.code === 'AI_NOT_CONFIGURED') {
      return NextResponse.json({ error: e.userMessage, code: e.code }, { status: 503 })
    }
    console.error('[suggest]', e)
    return NextResponse.json({ error: 'La génération a échoué, réessayez.' }, { status: 500 })
  }
}
