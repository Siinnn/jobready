// ─── Modèle de données LetterDocument ────────────────────────────────────────
// Une lettre = expéditeur + destinataire + objet + corps découpé en paragraphes.
// Le corps est structuré (et non un seul bloc de texte) afin de pouvoir
// reformuler chaque paragraphe indépendamment.

export const PARAGRAPH_KINDS = {
  hook:        { label: 'Accroche',   help: "Pourquoi vous écrivez, et ce qui vous attire dans ce poste ou cette entreprise." },
  profile:     { label: 'Votre profil', help: 'Votre parcours et vos compétences, en lien direct avec le poste visé.' },
  motivation:  { label: 'Votre motivation', help: "Ce que vous apporteriez concrètement, et pourquoi cette entreprise en particulier." },
  closing:     { label: 'Conclusion', help: 'Demande d\'entretien et formule de politesse.' },
}

export const LETTER_TONES = [
  { id: 'formel',    label: 'Formel',    desc: 'Registre classique, adapté aux grandes structures et au secteur public.' },
  { id: 'direct',    label: 'Direct',    desc: 'Phrases courtes, orienté résultats. Adapté aux PME et aux métiers de terrain.' },
  { id: 'chaleureux',label: 'Chaleureux',desc: 'Plus personnel, adapté aux métiers de contact et au secteur associatif.' },
]

const DEFAULT_BODY = [
  { id: 'hook',       text: '' },
  { id: 'profile',    text: '' },
  { id: 'motivation', text: '' },
  { id: 'closing',    text: "Je reste à votre disposition pour un entretien afin de vous exposer ma motivation plus en détail.\n\nDans l'attente de votre réponse, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées." },
]

const uid = () => (crypto?.randomUUID ? crypto.randomUUID() : `lt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`)

// Signature de la lettre.
// - 'none'        : rien sous la formule de politesse
// - 'handwritten' : le nom affiché dans une police manuscrite
// - 'image'       : un scan ou une photo de la signature (données en base64)
export const SIGNATURE_MODES = [
  { id: 'none',        label: 'Aucune',        desc: 'Seul votre nom apparaît, en caractères normaux.' },
  { id: 'handwritten', label: 'Nom manuscrit', desc: 'Votre nom écrit dans une police imitant l\'écriture à la main.' },
  { id: 'image',       label: 'Image',         desc: 'Une photo ou un scan de votre signature.' },
]

export const HANDWRITING_FONTS = [
  { id: 'cursive',  label: 'Anglaise',  stack: "'Segoe Script', 'Brush Script MT', 'Apple Chancery', cursive" },
  { id: 'casual',   label: 'Décontractée', stack: "'Comic Sans MS', 'Segoe Print', 'Bradley Hand', cursive" },
  { id: 'elegant',  label: 'Élégante',  stack: "'Palatino Linotype', 'Book Antiqua', Palatino, serif" },
]

export function createEmptyLetter(name = 'Ma lettre') {
  const now = new Date().toISOString()
  return {
    id: uid(),
    name,
    tone: 'formel',
    theme: { accent: null, font: 'serif', fontSize: 1, spacing: 1 },
    sender:    { firstName: '', lastName: '', title: '', email: '', phone: '', location: '', address: '' },
    recipient: { company: '', contact: '', address: '', city: '' },
    job:       { title: '', reference: '', source: '' },
    subject: '',
    showDate: true,
    signature: { mode: 'none', font: 'cursive', image: null, size: 1 },
    body: DEFAULT_BODY.map(p => ({ ...p })),
    createdAt: now,
    updatedAt: now,
  }
}

// Pré-remplit l'expéditeur depuis un CV existant
export function letterFromCv(cv, name) {
  const letter = createEmptyLetter(name || 'Ma lettre')
  if (!cv?.data) return letter
  const d = cv.data
  letter.sender = {
    firstName: d.firstName || '', lastName: d.lastName || '', title: d.title || '',
    email: d.email || '', phone: d.phone || '', location: d.location || '', address: '',
  }
  letter.sourceCvId = cv.id
  return letter
}

export function duplicateLetter(letter, name) {
  const copy = JSON.parse(JSON.stringify(letter))
  copy.id = uid()
  copy.name = name || `${letter.name} (copie)`
  copy.createdAt = new Date().toISOString()
  copy.updatedAt = copy.createdAt
  return copy
}

// Objet par défaut, calculé si l'utilisateur ne le renseigne pas
export function defaultSubject(letter) {
  const t = letter.job?.title?.trim()
  if (!t) return 'Candidature spontanée'
  const ref = letter.job?.reference?.trim()
  return `Candidature au poste de ${t}${ref ? ` (réf. ${ref})` : ''}`
}

// Texte complet de la lettre (export, copie, comptage)
export function letterPlainText(letter) {
  return (letter.body || [])
    .map(p => p.text?.trim())
    .filter(Boolean)
    .join('\n\n')
}

export function letterWordCount(letter) {
  return letterPlainText(letter).split(/\s+/).filter(Boolean).length
}
