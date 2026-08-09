// ─────────────────────────────────────────────────────────────────────────────
// Chiffrement de bout en bout du transfert entre appareils.
//
// PRINCIPE
// Le code de transfert ne quitte JAMAIS le navigateur. On en dérive deux choses
// distinctes, par des chemins à sens unique :
//
//   code ──SHA-256──────────────────► identifiant (envoyé au serveur)
//        └─PBKDF2(250 000 tours)───► clé AES-256 (jamais envoyée)
//
// Le serveur ne reçoit donc qu'un identifiant opaque et un bloc chiffré qu'il
// est incapable de lire. Même l'hébergeur de la base, même l'administrateur du
// site, ne peuvent pas déchiffrer les CV : il leur manque le code, que seul
// l'utilisateur possède.
//
// SOLIDITÉ DU CODE
// 12 caractères tirés d'un alphabet de 32 symboles (chiffres et lettres sans
// les ambigus O/0, I/1) = 32^12 ≈ 1,15 × 10^18 combinaisons, soit 60 bits.
// Associé aux 250 000 tours de PBKDF2, une attaque hors ligne sur une donnée
// qui n'existe que 24 heures n'est pas réaliste.
//
// Tout s'appuie sur l'API Web Crypto du navigateur : aucune dépendance.
// ─────────────────────────────────────────────────────────────────────────────

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sans I, O, 0, 1
const CODE_LENGTH = 12
const PBKDF2_ROUNDS = 250000

/** Génère un code aléatoire cryptographiquement sûr. */
export function generateTransferCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH))
  // Rejet du biais modulo : l'alphabet fait 32 symboles, 256 en est un multiple
  return Array.from(bytes, b => ALPHABET[b % ALPHABET.length]).join('')
}

/** Met en forme un code pour l'affichage : ABCD-EFGH-JKLM */
export function formatCode(code) {
  return (code || '').match(/.{1,4}/g)?.join('-') ?? ''
}

/**
 * Nettoie une saisie utilisateur : passe en majuscules, retire tirets et
 * espaces, et ne garde que les symboles de l'alphabet.
 *
 * L'alphabet exclut volontairement O, 0, I, 1 et L, qui se confondent à la
 * lecture : un utilisateur qui tape l'un d'eux s'est forcément trompé, et
 * aucune substitution ne serait fiable. Le caractère est simplement ignoré,
 * ce qui laisse le champ incomplet et signale l'erreur.
 */
export function normalizeCode(input) {
  return String(input || '')
    .toUpperCase()
    .split('')
    .filter(ch => ALPHABET.includes(ch))
    .join('')
    .slice(0, CODE_LENGTH)
}

export function isCompleteCode(code) {
  return normalizeCode(code).length === CODE_LENGTH
}

// ─── Dérivations ────────────────────────────────────────────────────────────
const enc = new TextEncoder()

/**
 * Identifiant de stockage : SHA-256 du code, tronqué.
 * Fonction à sens unique — le serveur ne peut pas remonter au code.
 */
export async function deriveStorageId(code) {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(`jobready-id:${code}`))
  return [...new Uint8Array(digest)].slice(0, 12)
    .map(b => b.toString(16).padStart(2, '0')).join('')
}

/** Clé AES-GCM 256 bits dérivée du code par PBKDF2. */
async function deriveKey(code, salt) {
  const material = await crypto.subtle.importKey(
    'raw', enc.encode(code), 'PBKDF2', false, ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ROUNDS, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

// ─── Chiffrement / déchiffrement ────────────────────────────────────────────

/**
 * Chiffre une chaîne avec le code.
 * @returns {Promise<string>} enveloppe base64 : version | sel | vecteur | données
 */
export async function encryptPayload(plaintext, code) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(code, salt)

  const cipher = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key, enc.encode(plaintext)
  ))

  const envelope = new Uint8Array(1 + salt.length + iv.length + cipher.length)
  envelope[0] = 1                                   // version du format
  envelope.set(salt, 1)
  envelope.set(iv, 1 + salt.length)
  envelope.set(cipher, 1 + salt.length + iv.length)
  return toBase64(envelope)
}

/**
 * Déchiffre une enveloppe avec le code.
 * Lève une erreur explicite si le code est faux : AES-GCM authentifie les
 * données, un mauvais code ne peut pas produire un résultat plausible.
 */
export async function decryptPayload(envelopeB64, code) {
  let envelope
  try {
    envelope = fromBase64(envelopeB64)
  } catch {
    throw new Error('Les données reçues sont illisibles.')
  }
  if (envelope.length < 30 || envelope[0] !== 1) {
    throw new Error('Format de transfert non reconnu.')
  }

  const salt = envelope.slice(1, 17)
  const iv = envelope.slice(17, 29)
  const cipher = envelope.slice(29)
  const key = await deriveKey(code, salt)

  try {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher)
    return new TextDecoder().decode(plain)
  } catch {
    throw new Error("Le code saisi ne permet pas de déchiffrer ces données. Vérifiez chaque caractère et réessayez.")
  }
}

// ─── Utilitaires base64 ─────────────────────────────────────────────────────
function toBase64(bytes) {
  let bin = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(bin)
}

function fromBase64(b64) {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}
