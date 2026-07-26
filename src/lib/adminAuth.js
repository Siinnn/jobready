// ─── Authentification de l'espace administrateur ────────────────────────────
// Un seul administrateur, identifié par un code défini dans .env.local.
// Le cookie de session contient un jeton signé (HMAC) : il ne peut pas être
// fabriqué côté navigateur sans connaître le secret.

export const ADMIN_COOKIE = 'jr_admin'
const SESSION_HOURS = 12

function secret() {
  const code = process.env.ADMIN_CODE
  if (!code || code.length < 6) return null
  return code
}

// Jeton : "<expiration>.<signature>"
export async function createToken() {
  const s = secret()
  if (!s) return null
  const exp = Date.now() + SESSION_HOURS * 3600 * 1000
  return `${exp}.${await sign(String(exp), s)}`
}

export async function verifyToken(token) {
  const s = secret()
  if (!s || !token || typeof token !== 'string') return false
  const [exp, sig] = token.split('.')
  if (!exp || !sig) return false
  if (Number(exp) < Date.now()) return false
  const expected = await sign(exp, s)
  return timingSafeEqual(sig, expected)
}

export function checkCode(input) {
  const s = secret()
  if (!s) return false
  return timingSafeEqual(String(input || ''), s)
}

export function isAdminConfigured() {
  return secret() !== null
}

// Signature HMAC-SHA256 via l'API Web Crypto (compatible Edge runtime)
async function sign(data, key) {
  const enc = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sigBuf = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(data))
  return Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// Comparaison à durée constante (évite de révéler le code par le temps de réponse)
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_HOURS * 3600,
}
