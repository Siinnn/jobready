import { NextResponse } from 'next/server'

const APIFY_TOKEN = process.env.APIFY_API_TOKEN

/**
 * Récupère le contenu texte d'une URL via Apify RAG Web Browser
 * Fonctionne avec Indeed, LinkedIn, HelloWork, WTTJ, Cadremploi, etc.
 */
async function fetchUrlContent(url) {
  const actorId = 'apify~rag-web-browser'
  const runUrl = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=60`

  const res = await fetch(runUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: url,
      maxResults: 1,
      outputFormats: ['markdown'],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Impossible de récupérer la page : ${err.slice(0, 200)}`)
  }

  const data = await res.json()
  const item = Array.isArray(data) ? data[0] : data

  // Extraire le markdown ou le texte selon la structure retournée
  const content = item?.markdown || item?.text || item?.content || ''
  if (!content || content.length < 100) {
    throw new Error("La page récupérée est vide ou illisible. Essaie de coller le texte manuellement.")
  }

  return content.slice(0, 8000) // Limiter la taille envoyee au modele
}

/**
 * POST /api/fetch-offer
 * Body: { url?: string, text?: string }
 * Retourne: { text: string, source: 'url'|'paste' }
 */
export async function POST(req) {
  try {
    const { url, text } = await req.json()

    if (text && text.trim().length > 100) {
      return NextResponse.json({ success: true, text: text.trim(), source: 'paste' })
    }

    if (url && url.startsWith('http')) {
      const content = await fetchUrlContent(url)
      return NextResponse.json({ success: true, text: content, source: 'url' })
    }

    return NextResponse.json({ error: 'Fournis une URL ou un texte valide.' }, { status: 400 })
  } catch (err) {
    console.error('fetch-offer error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
