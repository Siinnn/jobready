// ─────────────────────────────────────────────────────────────────────────────
// Petit client pour un stockage clé-valeur temporaire (Vercel KV / Upstash),
// utilisé uniquement par le transfert entre appareils.
//
// Volontairement écrit avec `fetch` sur l'API REST, sans SDK : aucune
// dépendance supplémentaire, et l'application fonctionne sans ce service
// (le transfert propose alors la sauvegarde par fichier).
// ─────────────────────────────────────────────────────────────────────────────

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN

export function isKvConfigured() {
  return Boolean(URL_ && TOKEN)
}

async function command(...args) {
  if (!isKvConfigured()) throw new KvNotConfiguredError()
  const res = await fetch(URL_, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error(`KV ${res.status} : ${(await res.text()).slice(0, 200)}`)
  }
  const json = await res.json()
  if (json.error) throw new Error(`KV : ${json.error}`)
  return json.result
}

export class KvNotConfiguredError extends Error {
  constructor() {
    super('KV_NOT_CONFIGURED')
    this.code = 'KV_NOT_CONFIGURED'
  }
}

/** Écrit une valeur avec expiration automatique (en secondes). */
export function setWithTtl(key, value, ttlSeconds) {
  return command('SET', key, value, 'EX', String(ttlSeconds))
}

/** Lit une valeur (null si absente ou expirée). */
export function get(key) {
  return command('GET', key)
}

/** Supprime une valeur. */
export function del(key) {
  return command('DEL', key)
}

/** Incrémente un compteur avec expiration : sert à limiter les tentatives. */
export async function incrWithTtl(key, ttlSeconds) {
  const n = await command('INCR', key)
  if (n === 1) await command('EXPIRE', key, String(ttlSeconds))
  return n
}
