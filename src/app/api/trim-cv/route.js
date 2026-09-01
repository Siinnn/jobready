import { NextResponse } from 'next/server'
import { suggestTrim, isAiConfigured } from '@/lib/ai'
import { enforceRateLimit, rateLimitHeaders } from '@/lib/rateLimit'

export const maxDuration = 30

/**
 * POST /api/trim-cv
 * Body: { profile: object, offerText?: string }
 * Retourne : { success: true, items: [{field,index,relevance,reason}], summary }
 *
 * Ne modifie jamais le CV côté serveur : renvoie seulement des suggestions.
 * C'est le navigateur qui applique un éventuel masquage, sur demande de
 * l'utilisateur — jamais une suppression.
 */
export async function POST(req) {
  const limit = await enforceRateLimit(req, 'trimCv')
  if (!limit.ok) return limit.response

  if (!isAiConfigured()) {
    return NextResponse.json({
      error: "L'aide à l'allègement n'est pas activée sur cette instance (clé d'API absente). Vous pouvez masquer manuellement les rubriques les moins utiles depuis le panneau de gauche.",
      code: 'AI_NOT_CONFIGURED',
    }, { status: 503 })
  }

  try {
    const { profile, offerText } = await req.json()
    if (!profile || typeof profile !== 'object') {
      return NextResponse.json({ error: 'Profil de CV manquant ou invalide.' }, { status: 400 })
    }

    const { items, summary } = await suggestTrim(profile, String(offerText || '').slice(0, 6000))

    return NextResponse.json(
      { success: true, items, summary },
      { headers: rateLimitHeaders('trimCv', limit.remaining) }
    )
  } catch (err) {
    console.error('[trim-cv] erreur :', err)
    return NextResponse.json({
      error: "L'analyse n'a pas pu être réalisée. Réessayez, ou masquez manuellement les éléments les moins pertinents.",
    }, { status: 502 })
  }
}
