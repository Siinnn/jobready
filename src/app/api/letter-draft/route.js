import { NextResponse } from 'next/server'
import { generateLetterDraft } from '@/lib/ai'
import { enforceRateLimit, rateLimitHeaders } from '@/lib/rateLimit'

export const maxDuration = 45

/**
 * POST /api/letter-draft
 * Body: { sender, recipient, job, tone, notes, cvSummary, experiences, skills }
 * Renvoie { hook, profile, motivation, closing }
 */
export async function POST(req) {
  const limit = await enforceRateLimit(req, 'letterDraft')
  if (!limit.ok) return limit.response

  try {
    const payload = await req.json()
    if (!payload?.job?.title && !payload?.recipient?.company) {
      return NextResponse.json(
        { error: "Indiquez au moins le poste visé ou le nom de l'entreprise." },
        { status: 400 }
      )
    }
    const draft = await generateLetterDraft(payload)
    if (!draft.hook && !draft.profile && !draft.motivation) {
      throw new Error('EMPTY_DRAFT')
    }
    return NextResponse.json({ draft }, { headers: rateLimitHeaders('letterDraft', limit.remaining) })
  } catch (e) {
    if (e.code === 'AI_NOT_CONFIGURED') {
      return NextResponse.json({ error: e.userMessage, code: e.code }, { status: 503 })
    }
    console.error('[letter-draft]', e)
    return NextResponse.json(
      { error: "La rédaction du brouillon a échoué. Réessayez, ou écrivez votre lettre paragraphe par paragraphe." },
      { status: 500 }
    )
  }
}
