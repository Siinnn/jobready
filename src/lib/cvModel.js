// ─── Modèle de données CVDocument ────────────────────────────────────────────
// Source de vérité unique pour la structure d'un CV.
// Un CV = données (data, forme "profil") + liste ordonnée de sections + thème + template.

export const SECTION_TYPES = {
  header:         { label: 'En-tête',           icon: '👤', required: true },
  summary:        { label: 'Accroche',           icon: '✍️' },
  experience:     { label: 'Expériences',        icon: '💼' },
  education:      { label: 'Formation',          icon: '🎓' },
  skills:         { label: 'Compétences',        icon: '🛠️' },
  languages:      { label: 'Langues',            icon: '🌍' },
  projects:       { label: 'Projets',            icon: '🚀', optional: true },
  certifications: { label: 'Certifications',     icon: '📜', optional: true },
  volunteering:   { label: 'Bénévolat',          icon: '🤝', optional: true },
  interests:      { label: "Centres d'intérêt",  icon: '⭐', optional: true },
}

export const DEFAULT_SECTIONS = [
  { id: 'header',     visible: true },
  { id: 'summary',    visible: true },
  { id: 'experience', visible: true },
  { id: 'education',  visible: true },
  { id: 'skills',     visible: true },
  { id: 'languages',  visible: true },
]

export const FONTS = [
  { id: 'sans',    label: 'Moderne (Sans)',    stack: "'Inter', 'Segoe UI', system-ui, sans-serif" },
  { id: 'serif',   label: 'Classique (Serif)', stack: "Georgia, 'Times New Roman', serif" },
  { id: 'mixte',   label: 'Élégant (Mixte)',   stack: "'Palatino Linotype', 'Book Antiqua', Palatino, serif" },
  { id: 'compact', label: 'Compact',           stack: "'Segoe UI', Tahoma, Arial, sans-serif" },
]

export const EMPTY_DATA = {
  firstName: '', lastName: '', title: '',
  email: '', phone: '', location: '', linkedin: '', portfolio: '',
  summary: '',
  experiences: [],   // { title, company, period, description }
  education: [],     // { degree, school, year }
  techSkills: [],    // string[]
  softSkills: [],    // string[]
  languages: [],     // { name, level }
  projects: [],      // { name, description, link }
  certifications: [],// { name, issuer, year }
  volunteering: [],  // { role, organization, period, description }
  interests: [],     // string[]
}

const uid = () => (crypto?.randomUUID ? crypto.randomUUID() : `cv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`)

export function createEmptyCv(name = 'Mon CV', templateId = 'classique') {
  const now = new Date().toISOString()
  return {
    id: uid(),
    name,
    templateId,
    theme: { accent: null, font: 'sans', fontSize: 1, spacing: 1 }, // accent null = accent par défaut du template
    data: structuredCloneSafe(EMPTY_DATA),
    sections: DEFAULT_SECTIONS.map(s => ({ ...s })),
    createdAt: now,
    updatedAt: now,
  }
}

// Crée un CVDocument depuis un "profil" (ancien format / CV importé / adaptation à une offre)
export function profileToCv(profile, name = 'Mon CV', templateId = 'classique') {
  const cv = createEmptyCv(name, templateId)
  cv.data = { ...cv.data, ...pickProfileFields(profile) }
  // Activer les sections optionnelles si des données existent
  const extras = ['projects', 'certifications', 'volunteering', 'interests']
  extras.forEach(id => {
    if ((cv.data[id] || []).length > 0 && !cv.sections.some(s => s.id === id)) {
      cv.sections.push({ id, visible: true })
    }
  })
  return cv
}

function pickProfileFields(p = {}) {
  // On garde TOUTES les clés du profil (y compris searchKeywords, seniority, etc.
  // utilisées par les modules offres/lettres), en garantissant les défauts du modèle.
  const out = { ...p }
  Object.keys(EMPTY_DATA).forEach(k => {
    if (out[k] === undefined || out[k] === null) out[k] = structuredCloneSafe(EMPTY_DATA[k])
  })
  // Normaliser les langues (parfois string[])
  if (Array.isArray(out.languages)) {
    out.languages = out.languages.map(l => typeof l === 'string' ? { name: l, level: '' } : l)
  }
  return out
}

// Le "profil" plat consommé par les modules offres/lettres (compatibilité)
export function cvToProfile(cv, legacyExtras = {}) {
  return { ...legacyExtras, ...cv.data }
}

export function duplicateCv(cv, name) {
  const copy = structuredCloneSafe(cv)
  copy.id = uid()
  copy.name = name || `${cv.name} (copie)`
  copy.createdAt = new Date().toISOString()
  copy.updatedAt = copy.createdAt
  return copy
}

export function structuredCloneSafe(obj) {
  return typeof structuredClone === 'function' ? structuredClone(obj) : JSON.parse(JSON.stringify(obj))
}

// ─── Entrées vides par type de liste (pour les formulaires) ─────────────────
export const EMPTY_ENTRIES = {
  experiences:    { title: '', company: '', period: '', description: '' },
  education:      { degree: '', school: '', year: '' },
  languages:      { name: '', level: '' },
  projects:       { name: '', description: '', link: '' },
  certifications: { name: '', issuer: '', year: '' },
  volunteering:   { role: '', organization: '', period: '', description: '' },
}

// ─── Masquage d'une entrée précise (sans la supprimer) ──────────────────────
// Deux familles de champs, deux mécanismes — chacun conçu pour survivre au
// réordonnancement et à l'ajout/suppression d'autres entrées :
//
//  • Listes d'objets (experiences, education, projects, certifications,
//    volunteering, languages) : le marqueur `hidden` voyage AVEC l'entrée,
//    directement sur l'objet. Pas d'index à tenir à jour.
//  • Listes de chaînes (techSkills, softSkills, interests) : les valeurs sont
//    uniques par champ (l'ajout empêche les doublons), donc un ensemble de
//    valeurs masquées — `data.hidden[champ]` — suffit et reste valide même
//    si la liste est réordonnée.
//
// Dans les deux cas, la donnée n'est JAMAIS supprimée : seule sa présence sur
// le CV exporté/imprimé est désactivée. L'utilisateur peut la réafficher à
// tout moment depuis le panneau d'édition.

// Listes d'objets : entrée masquée ?
export const isEntryHidden = (entry) => !!entry?.hidden

// Listes d'objets : ne garder que les entrées visibles (aperçu, export, score)
export const visibleEntries = (list = []) => list.filter(e => !isEntryHidden(e))

// Listes d'objets : bascule le masquage d'une entrée par son index courant
export function toggleEntryHidden(list = [], index) {
  return list.map((e, i) => i === index ? { ...e, hidden: !e.hidden } : e)
}

// Listes de chaînes : valeurs actuellement masquées pour un champ donné
export const hiddenStrings = (d, field) => new Set(d?.hidden?.[field] || [])

// Listes de chaînes : ne garder que les valeurs visibles
export function visibleStrings(d, field) {
  const hidden = hiddenStrings(d, field)
  return (d?.[field] || []).filter(v => !hidden.has(v))
}

// Listes de chaînes : bascule le masquage d'une valeur — renvoie le patch
// à fusionner dans data (ex. upData(toggleStringHidden(d, 'techSkills', v)))
export function toggleStringHidden(d, field, value) {
  const hidden = hiddenStrings(d, field)
  hidden.has(value) ? hidden.delete(value) : hidden.add(value)
  return { hidden: { ...(d?.hidden || {}), [field]: [...hidden] } }
}
