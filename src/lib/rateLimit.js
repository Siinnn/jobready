// ─────────────────────────────────────────────────────────────────────────────
// Limitation de débit des routes qui consomment des crédits d'API.
//
// Objectif : empêcher qu'un usage anormal (robot, partage massif du lien) épuise
// le quota, sans gêner un utilisateur réel. L'administrateur connecté n'est pas
// limité.
//
// Implémentation : fenêtre glissante en mémoire du processus. Sur un hébergement
// sans état (Vercel), chaque instance a son propre compteur et la mémoire est
// remise à zéro à froid : la limite est donc une protection « au mieux », pas une
// garantie stricte. C'est suffisant pour l'usage visé ; un plafond de dépense
// côté fournisseur d'API reste la sécurité de dernier recours.
// Pour une limite stricte, il faudrait un stockage partagé (Vercel KV, Redis).
// ─────────────────────────────────────────────────────────────────────────────
import { verifyToken, ADMIN_COOKIE } from '@/lib/adminAuth'

const buckets = new Map() // clé -> number[] (horodatages)
const HOUR = 60 * 60 * 1000

// Quotas par heure et par visiteur, calibrés sur le coût de chaque appel
export const LIMITS = {
  rewrite:     { max: 25, window: HOUR, label: 'reformulations' },
  suggest:     { max: 15, window: HOUR, label: "générations d'accroche" },
  letterDraft: { max: 10, window: HOUR, label: 'brouillons de lettre' },
  analyzeCv:   { max: 6,  window: HOUR, label: 'analyses de CV' },
}

function clientKey(req) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || req.headers.get('x-real-ip')
    || 'local'
  return ip
}

// Purge périodique pour éviter que la table ne grossisse indéfiniment
let lastSweep = Date.now()
function sweep(now) {
  if (now - lastSweep < 10 * 60 * 1000) return
  lastSweep = now
  for (const [k, hits] of buckets) {
    const kept = hits.filter(t => now - t < HOUR)
    if (kept.length === 0) buckets.delete(k)
    else buckets.set(k, kept)
  }
}

/**
 * Vérifie le quota d'un visiteur pour une action donnée.
 * @returns {Promise<{ok: true} | {ok: false, response: Response}>}
 */
export async function enforceRateLimit(req, action) {
  const rule = LIMITS[action]
  if (!rule) return { ok: true }

  // L'administrateur connecté n'est pas limité
  const isAdmin = await verifyToken(req.cookies?.get?.(ADMIN_COOKIE)?.value)
  if (isAdmin) return { ok: true }

  const now = Date.now()
  sweep(now)

  const key = `${action}:${clientKey(req)}`
  const hits = (buckets.get(key) || []).filter(t => now - t < rule.window)

  if (hits.length >= rule.max) {
    const retryAfterMs = rule.window - (now - hits[0])
    const minutes = Math.max(1, Math.ceil(retryAfterMs / 60000))
    buckets.set(key, hits)

    return {
      ok: false,
      response: Response.json(
        {
          error: `Vous avez atteint la limite de ${rule.max} ${rule.label} par heure. Réessayez dans ${minutes} minute${minutes > 1 ? 's' : ''}. Toutes les autres fonctions restent disponibles : vous pouvez continuer à écrire, modifier et exporter vos documents.`,
          code: 'RATE_LIMITED',
          retryAfterMinutes: minutes,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(retryAfterMs / 1000)),
            'X-RateLimit-Limit': String(rule.max),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil((now + retryAfterMs) / 1000)),
          },
        }
      ),
    }
  }

  hits.push(now)
  buckets.set(key, hits)
  return { ok: true, remaining: rule.max - hits.length }
}

// En-têtes informatifs à joindre aux réponses réussies
export function rateLimitHeaders(action, remaining) {
  const rule = LIMITS[action]
  if (!rule || remaining == null) return {}
  return {
    'X-RateLimit-Limit': String(rule.max),
    'X-RateLimit-Remaining': String(Math.max(0, remaining)),
  }
}
