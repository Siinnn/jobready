import { NextResponse } from 'next/server'
import { isKvConfigured, setWithTtl, get, del, incrWithTtl } from '@/lib/kv'

export const maxDuration = 20

// ─────────────────────────────────────────────────────────────────────────────
// Dépôt temporaire pour le transfert entre appareils.
//
// Ce serveur ne voit JAMAIS le code de transfert ni le contenu des documents :
// - il reçoit un identifiant opaque, dérivé du code par SHA-256 côté navigateur
//   (fonction à sens unique : impossible de remonter au code) ;
// - il reçoit un bloc déjà chiffré en AES-GCM avec une clé dérivée du code,
//   qu'il n'a aucun moyen de déchiffrer.
// Voir src/lib/transferCrypto.js pour le détail.
// ─────────────────────────────────────────────────────────────────────────────

const TTL_SECONDS = 24 * 3600      // expiration automatique du dépôt
const MAX_PAYLOAD = 1_200_000      // 1,2 Mo de données chiffrées au maximum
const MAX_TRIES_PER_ID = 6         // tentatives sur un même identifiant
const MAX_TRIES_PER_IP = 30        // tentatives par visiteur, toutes clés confondues
const MAX_DEPOSITS_PER_IP = 12     // dépôts par visiteur et par heure
const IP_WINDOW = 3600

const idKey      = (id) => `t:data:${id}`
const idTriesKey = (id) => `t:tries:${id}`
const ipTriesKey = (ip) => `t:ip-tries:${ip}`
const ipDepKey   = (ip) => `t:ip-dep:${ip}`

function clientIp(req) {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || req.headers.get('x-real-ip') || 'local'
}

// Un identifiant valide est une chaîne hexadécimale de 24 caractères
const isValidId = (id) => typeof id === 'string' && /^[0-9a-f]{24}$/.test(id)

// GET : disponibilité de la fonction sur cette instance
export async function GET() {
  return NextResponse.json({
    available: isKvConfigured(),
    ttlHours: TTL_SECONDS / 3600,
    endToEndEncrypted: true,
  })
}

// POST : déposer un bloc chiffré sous un identifiant dérivé
export async function POST(req) {
  if (!isKvConfigured()) return unavailable()

  try {
    const ip = clientIp(req)
    const deposits = await incrWithTtl(ipDepKey(ip), IP_WINDOW)
    if (deposits > MAX_DEPOSITS_PER_IP) {
      return NextResponse.json(
        { error: 'Trop de codes générés depuis cet appareil. Réessayez dans une heure.' },
        { status: 429 }
      )
    }

    const { id, payload } = await req.json()

    if (!isValidId(id)) {
      return NextResponse.json({ error: 'Identifiant de transfert invalide.' }, { status: 400 })
    }
    if (typeof payload !== 'string' || payload.length < 40) {
      return NextResponse.json({ error: 'Aucune donnée à transférer.' }, { status: 400 })
    }
    if (payload.length > MAX_PAYLOAD) {
      return NextResponse.json({
        error: "Vos documents dépassent la taille autorisée pour un transfert. Les images de signature en sont souvent la cause : allégez-les, ou utilisez la sauvegarde par fichier.",
      }, { status: 413 })
    }

    // Un identifiant déjà pris signifie un code identique : le navigateur en
    // tirera un autre. Cas quasi impossible (2^96), mais traité proprement.
    if (await get(idKey(id))) {
      return NextResponse.json({ error: 'COLLISION', code: 'COLLISION' }, { status: 409 })
    }

    await setWithTtl(idKey(id), payload, TTL_SECONDS)

    return NextResponse.json({
      ok: true,
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

// PUT : récupérer le bloc chiffré correspondant à un identifiant
export async function PUT(req) {
  if (!isKvConfigured()) return unavailable()

  try {
    const ip = clientIp(req)

    // Limite GLOBALE par visiteur : c'est elle qui empêche de balayer les
    // identifiants un par un. La limite par identifiant, seule, ne suffirait
    // pas — un attaquant essaierait un identifiant différent à chaque coup.
    const ipTries = await incrWithTtl(ipTriesKey(ip), IP_WINDOW)
    if (ipTries > MAX_TRIES_PER_IP) {
      return NextResponse.json(
        { error: 'Trop de tentatives depuis cet appareil. Réessayez dans une heure.' },
        { status: 429 }
      )
    }

    const { id } = await req.json()
    if (!isValidId(id)) {
      return NextResponse.json({ error: 'Code incomplet ou mal saisi.' }, { status: 400 })
    }

    const tries = await incrWithTtl(idTriesKey(id), TTL_SECONDS)
    if (tries > MAX_TRIES_PER_ID) {
      return NextResponse.json(
        { error: 'Trop de tentatives sur ce code. Générez-en un nouveau depuis votre premier appareil.' },
        { status: 429 }
      )
    }

    const payload = await get(idKey(id))
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

// DELETE : effacer un dépôt avant son expiration
export async function DELETE(req) {
  if (!isKvConfigured()) return unavailable()
  try {
    const { id } = await req.json()
    if (isValidId(id)) {
      await del(idKey(id))
      await del(idTriesKey(id))
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
