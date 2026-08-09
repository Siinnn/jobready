// ─────────────────────────────────────────────────────────────────────────────
// Sauvegarde et restauration de l'espace de travail (CV + lettres).
// Sert au transfert par code comme à la sauvegarde par fichier.
// ─────────────────────────────────────────────────────────────────────────────

export const BACKUP_FORMAT = 'jobready-backup'
export const BACKUP_VERSION = 1

/** Construit l'objet de sauvegarde à partir de l'état de l'application. */
export function buildBackup({ cvs = [], letters = [] }) {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    counts: { cvs: cvs.length, letters: letters.length },
    cvs,
    letters,
  }
}

/** Vérifie et normalise une sauvegarde reçue (fichier ou code). */
export function parseBackup(raw) {
  let data
  try {
    data = typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    throw new Error("Le contenu n'est pas une sauvegarde valide (fichier illisible).")
  }
  if (!data || data.format !== BACKUP_FORMAT) {
    throw new Error("Ce fichier n'est pas une sauvegarde JobReady.")
  }
  if (typeof data.version !== 'number' || data.version > BACKUP_VERSION) {
    throw new Error("Cette sauvegarde provient d'une version plus récente de l'application.")
  }
  const cvs = Array.isArray(data.cvs) ? data.cvs.filter(isPlausibleCv) : []
  const letters = Array.isArray(data.letters) ? data.letters.filter(isPlausibleLetter) : []
  if (cvs.length === 0 && letters.length === 0) {
    throw new Error('Cette sauvegarde ne contient aucun document.')
  }
  return { cvs, letters, createdAt: data.createdAt || null }
}

function isPlausibleCv(c) {
  return c && typeof c === 'object' && typeof c.id === 'string' && c.data && typeof c.data === 'object'
}
function isPlausibleLetter(l) {
  return l && typeof l === 'object' && typeof l.id === 'string' && Array.isArray(l.body)
}

/** Taille lisible d'une chaîne, pour informer l'utilisateur. */
export function humanSize(str) {
  const bytes = new Blob([str]).size
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

/** Déclenche le téléchargement d'un fichier de sauvegarde. */
export function downloadBackup(backup) {
  const text = JSON.stringify(backup, null, 2)
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `jobready-sauvegarde-${date}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Fusionne une sauvegarde avec l'existant.
 * Les documents portant un identifiant déjà présent sont dupliqués plutôt
 * qu'écrasés : on ne perd jamais de travail lors d'une restauration.
 */
export function mergeBackup(existing, incoming, suffix = '(importé)') {
  const known = new Set(existing.map(x => x.id))
  const added = incoming.map(doc => {
    if (!known.has(doc.id)) { known.add(doc.id); return doc }
    return {
      ...doc,
      id: `${doc.id}-imp-${Math.random().toString(36).slice(2, 7)}`,
      name: `${doc.name} ${suffix}`,
    }
  })
  return [...added, ...existing]
}
