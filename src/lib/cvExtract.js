// ─────────────────────────────────────────────────────────────────────────────
// Extraction et fiabilisation des données d'un CV existant.
//
// Trois niveaux, du plus fiable au plus interprétatif :
//   1. extractPdfText()   — sortir du texte propre d'un PDF (plusieurs moteurs)
//   2. deterministicScan()— repérer par expressions régulières ce qui est
//                           identifiable sans ambiguïté (email, téléphone,
//                           LinkedIn, dates, rubriques)
//   3. le modèle de langue (lib/ai.js) — structurer le reste
//
// Le niveau 2 sert de filet : si le modèle échoue ou oublie un champ, on garde
// au moins les coordonnées, ce qui évite un import totalement vide.
// ─────────────────────────────────────────────────────────────────────────────

// ─── 1. Extraction du texte d'un PDF ────────────────────────────────────────
export async function extractPdfText(buffer) {
  const attempts = []

  // Moteur principal : pdf-parse
  try {
    const pdfParse = (await import('pdf-parse')).default
    const data = await pdfParse(buffer, { max: 8 }) // 8 pages max
    if (data?.text) attempts.push({ engine: 'pdf-parse', text: data.text, pages: data.numpages })
  } catch (e) {
    console.warn('[extract] pdf-parse a échoué :', e.message)
  }

  // Repli : extraction brute des chaînes du flux PDF.
  // Utile pour certains PDF que pdf-parse refuse (structure inhabituelle).
  if (attempts.length === 0 || cleanText(attempts[0].text).length < 80) {
    try {
      const raw = rawPdfStrings(buffer)
      if (raw.length > 80) attempts.push({ engine: 'raw', text: raw })
    } catch (e) {
      console.warn('[extract] extraction brute a échoué :', e.message)
    }
  }

  if (attempts.length === 0) {
    throw new Error('PDF_UNREADABLE')
  }

  // On garde le résultat le plus riche
  attempts.sort((a, b) => cleanText(b.text).length - cleanText(a.text).length)
  const best = attempts[0]
  const text = cleanText(best.text)

  // Un PDF scanné (image) renvoie très peu de caractères exploitables
  if (text.length < 120) {
    const err = new Error('PDF_LIKELY_SCANNED')
    err.extracted = text
    throw err
  }

  return { text, engine: best.engine, pages: best.pages }
}

// Récupère les chaînes de texte visibles dans les opérateurs Tj/TJ du PDF
function rawPdfStrings(buffer) {
  const bin = buffer.toString('latin1')
  const out = []
  const re = /\(((?:\\.|[^\\()])*)\)\s*Tj|\[((?:\\.|[^\]])*)\]\s*TJ/g
  let m
  while ((m = re.exec(bin)) !== null) {
    const chunk = m[1] ?? m[2] ?? ''
    const pieces = chunk.match(/\((?:\\.|[^\\()])*\)/g) || [`(${chunk})`]
    pieces.forEach(p => {
      const s = p.slice(1, -1)
        .replace(/\\([()\\])/g, '$1')
        .replace(/\\n/g, '\n').replace(/\\r/g, '').replace(/\\t/g, ' ')
      if (s.trim()) out.push(s)
    })
  }
  return out.join(' ')
}

// ─── Nettoyage du texte extrait ─────────────────────────────────────────────
export function cleanText(input = '') {
  return String(input)
    // Ligatures et caractères de substitution fréquents dans les PDF
    .replace(/ﬁ/g, 'fi').replace(/ﬂ/g, 'fl')
    .replace(/[‘’‛]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '—')
    .replace(/ /g, ' ')
    .replace(/[•●▪·‣◦]/g, '• ')
    // Césures en fin de ligne : « respon-\nsable » → « responsable »
    .replace(/(\p{Ll})-\n(\p{Ll})/gu, '$1$2')
    // Espaces parasites
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n').map(l => l.trim()).join('\n')
    .trim()
}

// ─── 2. Repérage déterministe (filet de sécurité) ───────────────────────────
const RE = {
  email: /[\w.+-]+@[\w-]+\.[\w.]{2,}/,
  // Numéros français et internationaux courants
  phone: /(?:(?:\+|00)33\s?[1-9]|0[1-9])(?:[\s.\-]?\d{2}){4}/,
  linkedin: /(?:https?:\/\/)?(?:[\w.]*\.)?linkedin\.com\/in\/[\w\-%À-ÿ]+/i,
  site: /(?:https?:\/\/)?(?:www\.)?(?!linkedin\.)[\w-]+\.(?:fr|com|net|org|io|dev|eu|be|ch|ca)(?:\/\S*)?/i,
  postal: /\b(\d{5})\s+([A-ZÀ-Ÿ][\wÀ-ÿ' -]{2,})/,
}

// Rubriques usuelles d'un CV français, pour découper le texte
const SECTION_PATTERNS = {
  summary:        /^(?:profil|à propos|a propos|resume|résumé|presentation|présentation|accroche|objectif(?:s)? professionnel(?:s)?|synth[eè]se)/i,
  experience:     /^(?:exp[eé]riences?(?:\s+professionnelles?)?|parcours(?:\s+professionnel)?|carri[eè]re|emplois?|stages?(?:\s+et\s+exp[eé]riences?)?)/i,
  education:      /^(?:formations?|dipl[oô]mes?|[eé]tudes|cursus|scolarit[eé]|parcours\s+(?:scolaire|acad[eé]mique))/i,
  skills:         /^(?:comp[eé]tences?(?:\s+(?:techniques?|cl[eé]s|professionnelles?))?|savoir[- ]faire|aptitudes|qualit[eé]s|atouts)/i,
  languages:      /^(?:langues?(?:\s+(?:vivantes?|[eé]trang[eè]res?|parl[eé]es?))?)/i,
  certifications: /^(?:certifications?|habilitations?|permis|licences?|attestations?|caces)/i,
  projects:       /^(?:projets?(?:\s+personnels?)?|r[eé]alisations?|portfolio)/i,
  interests:      /^(?:centres?\s+d.int[eé]r[eê]ts?|loisirs|hobbies|activit[eé]s\s+extra|divers)/i,
  volunteering:   /^(?:b[eé]n[eé]volat|associatif|vie\s+associative|engagements?)/i,
}

// Découpe le texte en blocs par rubrique reconnue.
// Renvoie { rubrique: texte } + 'head' pour l'en-tête avant la première rubrique.
export function splitSections(text) {
  const lines = text.split('\n')
  const blocks = { head: [] }
  let current = 'head'

  for (const line of lines) {
    const bare = line.replace(/[^\p{L}\s'-]/gu, ' ').trim()
    // Un titre de rubrique est court et correspond à un motif connu
    if (bare.length > 0 && bare.length <= 40) {
      const hit = Object.entries(SECTION_PATTERNS).find(([, re]) => re.test(bare))
      if (hit) { current = hit[0]; blocks[current] = blocks[current] || []; continue }
    }
    ;(blocks[current] = blocks[current] || []).push(line)
  }

  const out = {}
  Object.entries(blocks).forEach(([k, v]) => {
    const t = v.join('\n').trim()
    if (t) out[k] = t
  })
  return out
}

// Extrait ce qui est identifiable sans interprétation
export function deterministicScan(text) {
  const found = {}
  const head = text.slice(0, 1200) // les coordonnées sont presque toujours en tête

  const email = (head.match(RE.email) || text.match(RE.email) || [])[0]
  if (email) found.email = email.toLowerCase()

  const phone = (head.match(RE.phone) || text.match(RE.phone) || [])[0]
  if (phone) found.phone = normalizePhone(phone)

  const linkedin = (text.match(RE.linkedin) || [])[0]
  if (linkedin) found.linkedin = linkedin.replace(/^https?:\/\//, '')

  // Ville : soit via code postal, soit première ligne courte contenant une majuscule
  const postal = head.match(RE.postal)
  if (postal) found.location = postal[2].trim()

  // Site perso : on exclut l'hôte de l'email et LinkedIn
  const site = (head.match(RE.site) || [])[0]
  if (site && (!email || !site.includes(email.split('@')[1])) && !/linkedin/i.test(site)) {
    found.portfolio = site.replace(/^https?:\/\//, '')
  }

  found.sections = splitSections(text)
  return found
}

function normalizePhone(p) {
  const digits = p.replace(/[^\d+]/g, '').replace(/^(?:\+33|0033)/, '0')
  return digits.length === 10
    ? digits.replace(/(\d{2})(?=\d)/g, '$1 ').trim()
    : p.trim()
}

// ─── 3. Normalisation du résultat du modèle ─────────────────────────────────
// Garantit que toutes les clés attendues existent et sont du bon type,
// puis complète les trous avec le repérage déterministe.
export function normalizeProfile(raw = {}, scan = {}) {
  const str = (v) => (typeof v === 'string' ? v.trim() : (v == null ? '' : String(v).trim()))
  const arr = (v) => {
    if (Array.isArray(v)) return v
    if (typeof v === 'string' && v.trim()) return v.split(/[;,·|\n]/).map(s => s.trim()).filter(Boolean)
    return []
  }
  const strArr = (v) => arr(v)
    .map(x => typeof x === 'string' ? x.trim() : (x?.name || x?.label || ''))
    .filter(Boolean)
    .filter((x, i, a) => a.indexOf(x) === i)   // dédoublonnage
    .slice(0, 30)

  const objArr = (v, keys) => arr(v).map(item => {
    if (typeof item === 'string') return { [keys[0]]: item.trim() }
    const o = {}
    keys.forEach(k => { o[k] = str(item?.[k]) })
    return o
  }).filter(o => Object.values(o).some(Boolean))

  const p = {
    firstName: str(raw.firstName),
    lastName:  str(raw.lastName),
    title:     str(raw.title),
    email:     str(raw.email)    || str(scan.email),
    phone:     str(raw.phone)    || str(scan.phone),
    location:  str(raw.location) || str(scan.location),
    linkedin:  str(raw.linkedin) || str(scan.linkedin),
    portfolio: str(raw.portfolio) || str(scan.portfolio),
    summary:   str(raw.summary),

    experiences:    objArr(raw.experiences,    ['title', 'company', 'period', 'location', 'description']),
    education:      objArr(raw.education,      ['degree', 'school', 'year', 'location']),
    certifications: objArr(raw.certifications, ['name', 'issuer', 'year']),
    projects:       objArr(raw.projects,       ['name', 'description', 'link']),
    volunteering:   objArr(raw.volunteering,   ['role', 'organization', 'period', 'description']),

    techSkills: strArr(raw.techSkills),
    softSkills: strArr(raw.softSkills),
    interests:  strArr(raw.interests),
    languages:  arr(raw.languages).map(l =>
      typeof l === 'string' ? { name: l.trim(), level: '' } : { name: str(l?.name), level: str(l?.level) }
    ).filter(l => l.name),

    // Champs utilisés par les modules offres / lettres
    yearsOfExperience:  Number.isFinite(+raw.yearsOfExperience) ? +raw.yearsOfExperience : 0,
    seniority:          str(raw.seniority),
    searchKeywords:     strArr(raw.searchKeywords),
    targetRoles:        strArr(raw.targetRoles),
    contractPreference: str(raw.contractPreference),
    salaryRange:        str(raw.salaryRange),
  }

  // Nom manquant : tenter la première ligne du CV (souvent le nom en gros)
  if (!p.firstName && !p.lastName) {
    const firstLine = (scan.sections?.head || '').split('\n').find(l => {
      const t = l.trim()
      return t.length >= 4 && t.length <= 45 && /^[\p{L}][\p{L}\s'-]+$/u.test(t) && !RE.email.test(t)
    })
    if (firstLine) {
      const parts = firstLine.trim().split(/\s+/)
      p.firstName = parts[0]
      p.lastName = parts.slice(1).join(' ')
    }
  }

  // Accroche absente : reprendre le bloc « Profil » du CV s'il existe
  if (!p.summary && scan.sections?.summary) {
    p.summary = scan.sections.summary.split('\n').join(' ').slice(0, 600)
  }

  // Estimer l'ancienneté à partir des périodes si le modèle ne l'a pas fait
  if (!p.yearsOfExperience) p.yearsOfExperience = estimateYears(p.experiences)

  return p
}

function estimateYears(experiences = []) {
  const years = experiences
    .map(e => (e.period || '').match(/(19|20)\d{2}/g) || [])
    .flat().map(Number).filter(y => y >= 1960 && y <= new Date().getFullYear() + 1)
  if (years.length < 2) return 0
  return Math.max(0, Math.min(50, Math.max(...years) - Math.min(...years)))
}

// ─── Bilan de l'import, affiché à l'utilisateur ─────────────────────────────
export function importReport(p) {
  const filled = []
  const missing = []
  const check = (label, ok) => (ok ? filled : missing).push(label)

  check('Nom et prénom', !!(p.firstName || p.lastName))
  check('Titre du poste', !!p.title)
  check('Email', !!p.email)
  check('Téléphone', !!p.phone)
  check('Accroche', !!p.summary)
  check(`Expériences (${p.experiences.length})`, p.experiences.length > 0)
  check(`Formation (${p.education.length})`, p.education.length > 0)
  check(`Compétences (${p.techSkills.length + p.softSkills.length})`, (p.techSkills.length + p.softSkills.length) > 0)
  check(`Langues (${p.languages.length})`, p.languages.length > 0)

  return { filled, missing, score: Math.round((filled.length / (filled.length + missing.length)) * 100) }
}
