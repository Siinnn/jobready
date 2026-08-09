import { NextResponse } from 'next/server'
import { isKvConfigured, setWithTtl, get, del, incrWithTtl } from '@/lib/kv'

export const maxDuration = 20

const TTL_SECONDS = 24 * 3600        // le code expire au bout de 24 h
const MAX_PAYLOAD = 900 * 1024       // 900 Ko de données transférées au maximum
const MAX_TRIES = 8                  // tentatives de saisie autorisées par code

// Chiffres seulement, pour une saisie facile y compris sur mobile.
// 6 chiffres = 900 000 combinaisons, avec un nombre d'essais limité.
function generateCode() {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 900000 + 100000
  return String(n)
}

const keyOf = (code) => `transfer:${code}`
const triesKeyOf = (code) => `transfer-tries:${code}`

// GET : l'interface demande si la fonction est disponible sur cette instance
export async function GET() {
  return NextResponse.json({ available: isKvConfigured(), ttlHours: TTL_SECONDS / 3600 })
}

// POST : déposer ses documents et obtenir un code
export async function POST(req) {
  if (!isKvConfigured()) return unavailable()

  try {
    const { payload } = await req.json()
    if (typeof payload !== 'string' || payload.length < 2) {
      return NextResponse.json({ error: 'Aucune donnée à transférer.' }, { status: 400 })
    }
    if (payload.length > MAX_PAYLOAD) {
      return NextResponse.json({
        error: "Vos documents dépassent la taille autorisée pour un transfert (900 Ko). Les images de signature en sont souvent la cause : allégez-les, ou utilisez la sauvegarde par fichier.",
      }, { status: 413 })
    }

    // On tire un code libre (collision très improbable, mais on vérifie)
    let code = null
    for (let i = 0; i < 5; i++) {
      const candidate = generateCode()
      if (!(await get(keyOf(candidate)))) { code = candidate; break }
    }
    if (!code) throw new Error('Aucun code disponible')

    await setWithTtl(keyOf(code), payload, TTL_SECONDS)

    return NextResponse.json({
      code,
      expiresAt: new Date(Date.now() + TTL_SECONDS * 1000).toISOString(),
      ttlHours: TTL_SECONDS / 3600,
    })
  } catch (e) {
    console.error('[transfert:POST]', e)
    return NextResponse.json(
      { error: "La création du code a échoué. Réessayez, ou utilisez la sauvegarde par fichier." },
      { status: 500 }
    )
  }
}

// PUT : récupérer les documents à partir d'un code
export async function PUT(req) {
  if (!isKvConfigured()) return unavailable()

  try {
    const { code } = await req.json()
    const clean = String(code || '').replace(/\D/g, '')
    if (clean.length !== 6) {
      return NextResponse.json({ error: 'Le code doit comporter 6 chiffres.' }, { status: 400 })
    }

    // Limite le nombre d'essais sur un même code (évite le tirage au hasard)
    const tries = await incrWithTtl(triesKeyOf(clean), TTL_SECONDS)
    if (tries > MAX_TRIES) {
      return NextResponse.json(
        { error: 'Trop de tentatives sur ce code. Générez un nouveau code depuis votre premier appareil.' },
        { status: 429 }
      )
    }

    const payload = await get(keyOf(clean))
    if (!payload) {
      return NextResponse.json(
        { error: "Ce code est inconnu ou a expiré. Les codes sont valables 24 heures : générez-en un nouveau depuis l'appareil qui contient vos documents." },
        { status: 404 }
      )
    }

    return NextResponse.json({ payload })
  } catch (e) {
    console.error('[transfert:PUT]', e)
    return NextResponse.json({ error: 'La récupération a échoué. Réessayez.' }, { status: 500 })
  }
}

// DELETE : supprimer un code avant son expiration
export async function DELETE(req) {
  if (!isKvConfigured()) return unavailable()
  try {
    const { code } = await req.json()
    const clean = String(code || '').replace(/\D/g, '')
    if (clean.length === 6) {
      await del(keyOf(clean))
      await del(triesKeyOf(clean))
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}

function unavailable() {
  return NextResponse.json({
    error: "Le transfert par code n'est pas activé sur cette instance. Utilisez la sauvegarde par fichier, juste en dessous : elle fonctionne dans tous les cas.",
    code: 'KV_NOT_CONFIGURED',
  }, { status: 503 })
}
