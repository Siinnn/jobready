import { NextResponse } from 'next/server'
import { adaptAndGenerateLetter } from '@/lib/ai'

/**
 * POST /api/adapt-cv
 * Body: { profile, letterProfile, offer, action: 'cv'|'letter'|'both' }
 *
 * Optimisé : un seul appel au modèle rapide au lieu de deux appels séparés
 * Coût estimé : ~0.001-0.002 $ par requête
 */
export async function POST(req) {
  try {
    const { profile, letterProfile, offer, action = 'both' } = await req.json()

    if (!profile || !offer) {
      return NextResponse.json({ error: 'profile et offer requis' }, { status: 400 })
    }

    const { adaptedProfile, letter } = await adaptAndGenerateLetter(
      profile,
      letterProfile,
      offer,
      action
    )

    return NextResponse.json({ success: true, adaptedProfile, letter })
  } catch (err) {
    console.error('adapt-cv error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
