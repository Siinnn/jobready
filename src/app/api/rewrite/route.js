import { NextResponse } from 'next/server'
import { rewriteText } from '@/lib/ai'

export const maxDuration = 45

export async function POST(req) {
  try {
    const { text, field, tone, jobTitle } = await req.json()
    if (!text || String(text).trim().length < 10) {
      return NextResponse.json({ error: 'Texte trop court pour être reformulé.' }, { status: 400 })
    }
    const suggestions = await rewriteText({ text, field, tone, jobTitle })
    if (!suggestions.length) throw new Error('Aucune suggestion générée')
    return NextResponse.json({ suggestions })
  } catch (e) {
    if (e.code === 'AI_NOT_CONFIGURED') {
      return NextResponse.json({ error: e.userMessage, code: e.code }, { status: 503 })
    }
    console.error('[rewrite]', e)
    return NextResponse.json({ error: 'La reformulation a échoué, réessayez.' }, { status: 500 })
  }
}
