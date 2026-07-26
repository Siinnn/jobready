const APIFY_TOKEN = process.env.APIFY_API_TOKEN

/**
 * Lance un acteur Apify et attend les résultats
 */
async function runActor(actorId, input, timeoutSecs = 120) {
  const safeActorId = actorId.replace('/', '~');
  const runUrl = `https://api.apify.com/v2/acts/${safeActorId}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=${timeoutSecs}`

  const res = await fetch(runUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    const errText = await res.text()
    let errorMessage = `Apify error (${actorId}): ${errText}`
    
    try {
      const errJson = JSON.parse(errText)
      if (errJson.error?.type === 'actor-memory-limit-exceeded') {
        errorMessage = "Limite de mémoire Apify atteinte. Veuillez patienter 2-3 minutes que les sessions précédentes se terminent ou réduisez le nombre de résultats demandés."
      } else if (errJson.error?.message) {
        errorMessage = `Apify error: ${errJson.error.message}`
      }
    } catch (e) {
      // Not JSON, use raw text
    }
    
    throw new Error(errorMessage)
  }

  return res.json()
}

/**
 * Normalise une offre quelle que soit sa source
 */
/** Convertit n'importe quelle valeur en string affichable (évite les objets dans React) */
function toStr(val) {
  if (!val) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'number') return String(val)
  // Objet location Apify : { city, countryName, admin1Code, ... }
  if (typeof val === 'object') {
    return [val.city, val.admin1Code, val.countryName]
      .filter(Boolean)
      .join(', ')
  }
  return String(val)
}

/** Construit une URL de recherche fiable (toujours valide) pour une offre donnée */
function buildSearchUrl(raw, source) {
  const title   = toStr(raw.title || raw.jobTitle || raw.position || '')
  const company = toStr(typeof raw.company === 'object' ? raw.company?.name : raw.company || raw.companyName || '')
  const q = encodeURIComponent(title ? `${title} ${company}`.trim() : company)
  switch (source) {
    case 'Indeed':
      return `https://fr.indeed.com/jobs?q=${q}`
    case 'LinkedIn':
      return `https://www.linkedin.com/jobs/search/?keywords=${q}`
    case 'WTTJ':
      return `https://www.welcometothejungle.com/fr/jobs?query=${encodeURIComponent(title || company)}`
    case 'HelloWork':
      return `https://www.hellowork.com/fr-fr/recherche-emploi.html?k=${q}`
    default:
      return `https://fr.indeed.com/jobs?q=${q}`
  }
}

/** Choisit la meilleure URL directe pour postuler, en évitant les URLs Apify internes.
 *  Retourne { url, isSearch } — isSearch=true signifie que c'est un lien de recherche
 *  (l'offre directe n'était pas disponible). */
function pickBestUrl(raw, source) {
  const candidates = [
    raw.externalApplyLink,
    raw.applyUrl,
    raw.externalUrl,
    raw.jobUrl,
    raw.url,
    raw.link,
    raw.externalLink,
  ].map(u => toStr(u)).filter(u => u && u.startsWith('http'))

  // Rejeter les URLs qui sont clairement des redirects Apify, expirées, ou pages de recherche
  const isJunk = (u) =>
    u.includes('apify.com') ||
    u.includes('viewjob?') ||           // Indeed redirect (expirent en quelques heures)
    u.includes('/jobs/search') ||
    u.includes('jobs?q=') ||
    u.includes('?query=') ||
    u === '#'

  // Préférer les URLs directes stables des job boards
  const sourcePriority = {
    'Indeed':    (u) => u.includes('indeed.com/') && !u.includes('viewjob?') && !u.includes('jobs?'),
    'LinkedIn':  (u) => u.includes('linkedin.com/jobs/view/'),
    'WTTJ':      (u) => u.includes('welcometothejungle.com/') && u.includes('/jobs/'),
    'HelloWork': (u) => u.includes('hellowork.com/') && !u.includes('recherche'),
  }

  const preferred = candidates.find(u => sourcePriority[source]?.(u))
  if (preferred) return { url: preferred, isSearch: false }

  const clean = candidates.find(u => !isJunk(u))
  if (clean) return { url: clean, isSearch: false }

  // Aucune URL directe fiable → lien de recherche garanti valide
  return { url: buildSearchUrl(raw, source), isSearch: true }
}

function normalizeOffer(raw, source) {
  const { url, isSearch } = pickBestUrl(raw, source)
  return {
    id:           toStr(raw.id || raw.jobId || raw.url) || Math.random().toString(36).slice(2),
    title:        toStr(raw.title || raw.jobTitle || raw.position) || 'Poste non précisé',
    company:      toStr(typeof raw.company === 'object' ? (raw.company?.name || raw.company?.displayName) : raw.company)
                  || toStr(raw.companyName || raw.employer) || 'Entreprise inconnue',
    location:     toStr(raw.location || raw.city || raw.place || raw.jobLocation || ''),
    description:  toStr(raw.description || raw.jobDescription || raw.content || ''),
    salary:       toStr(raw.salary || raw.salaryRange || raw.compensation || '') || null,
    contractType: toStr(raw.contractType || raw.employmentType || raw.type || '') || null,
    url,
    urlIsSearch:  isSearch,   // true → lien de recherche (pas d'URL directe disponible)
    searchUrl:    buildSearchUrl(raw, source), // toujours valide, utilisable en fallback
    postedAt:     toStr(raw.postedAt || raw.date || raw.publishedAt || '') || null,
    skills:       Array.isArray(raw.skills) ? raw.skills.map(toStr) :
                  Array.isArray(raw.requiredSkills) ? raw.requiredSkills.map(toStr) : [],
    source,
    logo:         toStr(raw.companyLogo || raw.logo || '') || null,
  }
}

/**
 * Recherche sur France Travail + WTTJ + HelloWork (acteur gratuit tout-en-un)
 */
export async function searchFranceJobs({ keywords, location = 'Paris', contractType, maxResults = 30 }) {
  try {
    const input = {
      keywords,
      location,
      maxResults,
      maxDaysOld: 7,
    }
    if (contractType) input.contractType = contractType

    const results = await runActor('joyouscam35875/france-job-scraper', input)
    return (results || []).map(r => normalizeOffer(r, r.source || 'France Travail/WTTJ/HelloWork'))
  } catch (err) {
    console.error('France jobs error:', err.message)
    return []
  }
}

/**
 * Recherche sur Indeed France
 * Limite volontairement basse (5 max) pour éviter les erreurs de mémoire Apify
 */
export async function searchIndeed({ keywords, location = 'Paris', limit = 5 }) {
  try {
    const safeLimit = Math.min(limit, 5) // Hard cap : l'acteur dépasse la mémoire au-delà
    const results = await runActor('valig/indeed-jobs-scraper', {
      country: 'fr',
      title: keywords,
      location,
      limit: safeLimit,
      datePosted: '7',
    }, 90) // timeout réduit à 90s
    return (results || []).map(r => normalizeOffer(r, 'Indeed'))
  } catch (err) {
    console.error('Indeed error:', err.message)
    return []
  }
}

/**
 * Recherche sur LinkedIn
 */
export async function searchLinkedIn({ keywords, location = 'France', limit = 10 }) {
  try {
    const results = await runActor('worldunboxer/rapid-linkedin-scraper', {
      job_title: keywords,
      location,
      jobs_entries: limit,
      job_post_time: 'r604800', // 7 derniers jours
    })
    return (results || []).map(r => normalizeOffer(r, 'LinkedIn'))
  } catch (err) {
    console.error('LinkedIn error:', err.message)
    return []
  }
}

/**
 * Recherche combinée sur toutes les plateformes
 */
export async function searchAllPlatforms({ keywords, location, contractType, limit = 15 }) {
  const [france, indeed, linkedin] = await Promise.allSettled([
    searchFranceJobs({ keywords, location, contractType, maxResults: limit }),
    searchIndeed({ keywords, location, limit: 5 }),   // cap 5 — évite les erreurs mémoire Apify
    searchLinkedIn({ keywords, location, limit }),
  ])

  const all = [
    ...(france.status === 'fulfilled' ? france.value : []),
    ...(indeed.status === 'fulfilled' ? indeed.value : []),
    ...(linkedin.status === 'fulfilled' ? linkedin.value : []),
  ]

  // Dédupliquer sur le titre + entreprise
  const seen = new Set()
  return all.filter(o => {
    const key = `${o.title}__${o.company}`.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
