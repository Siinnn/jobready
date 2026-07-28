import { NextResponse } from 'next/server'
import { analyzeCv, analyzeLetter, isAiConfigured } from '@/lib/ai'
import { extractPdfText, cleanText, deterministicScan, normalizeProfile, importReport } from '@/lib/cvExtract'
import { enforceRateLimit } from '@/lib/rateLimit'

export const maxDuration = 60

/**
 * POST /api/analyze-cv
 * FormData { file?: File (PDF), text?: string, type: 'cv'|'letter' }
 *
 * Chaîne de traitement d'un CV :
 *   PDF → texte (plusieurs moteurs) → nettoyage → repérage déterministe
 *       → structuration par le modèle → normalisation → bilan d'import
 *
 * Le repérage déterministe sert de filet : même si le modèle échoue,
 * les coordonnées et les blocs de rubriques sont conservés.
 */
export async function POST(req) {
  // L'analyse d'un CV est l'appel le plus coûteux : quota plus strict.
  const limit = await enforceRateLimit(req, 'analyzeCv')
  if (!limit.ok) return limit.response

  try {
    const formData = await req.formData()
    const type = formData.get('type') || 'cv'
    let text = String(formData.get('text') || '')
    let engine = 'texte collé'

    // ── 1. Extraction du texte ──
    const file = formData.get('file')
    if (file && typeof file === 'object' && file.size > 0) {
      if (file.size > 12 * 1024 * 1024) {
        return fail('FILE_TOO_LARGE', 'Le fichier dépasse 12 Mo. Réduisez-le ou collez le texte de votre CV.', 413)
      }
      const buffer = Buffer.from(await file.arrayBuffer())
      try {
        const res = await extractPdfText(buffer)
        text = res.text
        engine = res.engine
      } catch (e) {
        if (e.message === 'PDF_LIKELY_SCANNED') {
          return fail('PDF_LIKELY_SCANNED',
            "Ce PDF semble être une image (CV scanné ou photographié) : aucun texte n'a pu être lu. Ouvrez votre CV dans un traitement de texte pour l'exporter à nouveau en PDF, ou copiez-collez son contenu dans l'onglet « Coller le texte ».", 422)
        }
        return fail('PDF_UNREADABLE',
          "Ce fichier PDF n'a pas pu être lu (protégé par mot de passe ou endommagé). Essayez de le réenregistrer, ou utilisez l'onglet « Coller le texte ».", 422)
      }
    } else {
      text = cleanText(text)
    }

    if (!text || text.trim().length < 60) {
      return fail('TEXT_TOO_SHORT',
        "Le contenu récupéré est trop court pour être analysé. Vérifiez que votre CV contient bien du texte, ou collez-le directement.", 400)
    }

    // ── 2. Lettre de motivation : traitement simple ──
    if (type === 'letter') {
      try {
        const result = await analyzeLetter(text)
        result.rawText = text
        return NextResponse.json({ success: true, data: result, rawText: text })
      } catch {
        // Le style n'a pas pu être analysé : on garde tout de même le texte,
        // qui sert de base aux lettres personnalisées.
        return NextResponse.json({
          success: true, degraded: true,
          data: { tone: 'formel', style: '', hook: '', strengths: [], closing: '', rawText: text },
          rawText: text,
          notice: "Le style de la lettre n'a pas pu être analysé, mais son texte a bien été enregistré.",
        })
      }
    }

    // ── 3. Repérage déterministe (indépendant du modèle) ──
    const scan = deterministicScan(text)

    // ── 4. Structuration par le modèle, avec une seconde tentative ──
    // Sans clé d'API, on saute cette étape : le repérage déterministe suffit à
    // récupérer les coordonnées et l'accroche, le reste sera saisi à la main.
    let raw = null
    let degraded = false
    if (!isAiConfigured()) {
      raw = {}
      degraded = true
    } else {
      try {
        raw = await analyzeCv(text, scan)
      } catch (e1) {
        console.warn('[analyze-cv] première tentative échouée :', e1.message)
        try {
          // Seconde tentative sur un extrait plus court : réduit les risques
          // de réponse tronquée ou de dépassement de délai.
          raw = await analyzeCv(text.slice(0, 6000), scan)
        } catch (e2) {
          console.error('[analyze-cv] seconde tentative échouée :', e2.message)
          raw = {}
          degraded = true
        }
      }
    }

    // ── 5. Normalisation + complétion par le repérage déterministe ──
    const profile = normalizeProfile(raw, scan)
    const report = importReport(profile)

    // Rien d'exploitable du tout : on le dit clairement
    if (degraded && !profile.email && !profile.firstName && profile.experiences.length === 0) {
      return fail('ANALYSIS_FAILED',
        "L'analyse automatique n'a rien pu extraire de ce document. Vous pouvez créer votre CV étape par étape : c'est guidé et cela ne prend que quelques minutes.", 502)
    }

    return NextResponse.json({
      success: true,
      degraded,
      data: profile,
      rawText: text,
      report,
      meta: { engine, chars: text.length, aiUsed: isAiConfigured() },
      notice: !degraded ? null
        : !isAiConfigured()
          ? "L'analyse détaillée n'est pas activée sur cette instance : vos coordonnées ont été récupérées automatiquement, les autres rubriques sont à compléter dans l'éditeur."
          : "L'analyse automatique a partiellement échoué : vos coordonnées ont été récupérées, mais vous devrez compléter les rubriques manuellement.",
    })
  } catch (err) {
    console.error('[analyze-cv] erreur inattendue :', err)
    return fail('UNEXPECTED', "Une erreur inattendue s'est produite pendant l'analyse. Réessayez, ou créez votre CV manuellement.", 500)
  }
}

function fail(code, message, status) {
  return NextResponse.json({ error: message, code }, { status })
}
