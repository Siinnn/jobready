// ─── Contrôle qualité du CV : score et liste de vérifications ───────────────
// Règles déterministes calculées dans le navigateur (aucun appel réseau).
// Chaque contrôle porte une catégorie : 'contenu' ou 'ats'.
import { ACTION_VERBS } from '@/lib/skillSuggestions'
import { getTemplate } from '@/templates'

const hasDigit = (s = '') => /\d/.test(s)
const words = (s = '') => s.trim().split(/\s+/).filter(Boolean).length

export function scoreCv(cv) {
  const d = cv.data || {}
  const visible = new Set((cv.sections || []).filter(s => s.visible !== false).map(s => s.id))
  const checks = []
  const add = (c) => checks.push({ cat: 'contenu', ...c })

  // ── En-tête ──
  add({
    id: 'name', section: 'header', weight: 2,
    ok: !!(d.firstName && d.lastName),
    label: 'Nom et prénom renseignés',
    advice: 'Indiquez votre prénom et votre nom — c\'est la base du CV.',
  })
  add({
    id: 'title', section: 'header', weight: 2,
    ok: !!d.title,
    label: 'Titre professionnel présent',
    advice: 'Ajoutez un titre (le poste visé) : les recruteurs et les ATS s\'y réfèrent en premier.',
  })
  add({
    id: 'contact', section: 'header', weight: 2,
    ok: !!(d.email && d.phone),
    label: 'Email et téléphone présents',
    advice: 'Sans email ET téléphone, le recruteur ne peut pas vous joindre facilement.',
  })

  // ── Accroche ──
  const sw = words(d.summary)
  add({
    id: 'summary', section: 'summary', weight: 2,
    ok: visible.has('summary') && sw >= 15,
    label: 'Accroche rédigée',
    advice: 'Rédigez une accroche de 2 à 4 phrases — utilisez le générateur IA si besoin.',
  })
  add({
    id: 'summary-length', section: 'summary', weight: 1,
    ok: sw === 0 || (sw >= 20 && sw <= 90),
    label: 'Accroche de bonne longueur (20-90 mots)',
    advice: sw > 90 ? 'Votre accroche est trop longue : visez 20 à 90 mots.' : 'Étoffez un peu votre accroche (20 mots minimum).',
  })

  // ── Expériences ──
  const exps = d.experiences || []
  add({
    id: 'exp', section: 'experience', weight: 3,
    ok: exps.length >= 1,
    label: 'Au moins une expérience',
    advice: 'Ajoutez vos expériences — stages, intérim et jobs étudiants comptent aussi.',
  })
  add({
    id: 'exp-desc', section: 'experience', weight: 2,
    ok: exps.length === 0 || exps.every(e => words(e.description) >= 8),
    label: 'Chaque expérience est décrite',
    advice: 'Décrivez chaque expérience (missions, responsabilités) en au moins une phrase.',
  })
  add({
    id: 'exp-figures', section: 'experience', weight: 1,
    ok: exps.some(e => hasDigit(e.description)),
    label: 'Des résultats chiffrés',
    advice: 'Ajoutez des chiffres (équipe de 5, +20 % de ventes, 30 clients/jour…) : c\'est ce qui marque un recruteur.',
  })
  add({
    id: 'exp-verbs', section: 'experience', weight: 1,
    ok: exps.some(e => ACTION_VERBS.some(v => (e.description || '').toLowerCase().includes(v.toLowerCase().slice(0, 6)))),
    label: 'Des verbes d\'action',
    advice: `Commencez vos phrases par des verbes d'action : ${ACTION_VERBS.slice(0, 5).join(', ').toLowerCase()}…`,
  })
  add({
    id: 'exp-periods', section: 'experience', weight: 1,
    ok: exps.length === 0 || exps.every(e => !!e.period),
    label: 'Périodes indiquées partout',
    advice: 'Indiquez la période de chaque expérience — les trous inexpliqués inquiètent les recruteurs.',
  })

  // ── Formation ──
  add({
    id: 'edu', section: 'education', weight: 2,
    ok: (d.education || []).length >= 1,
    label: 'Formation renseignée',
    advice: 'Ajoutez au moins une formation ou un diplôme (même en cours).',
  })

  // ── Compétences ──
  const skillCount = (d.techSkills || []).length + (d.softSkills || []).length
  add({
    id: 'skills', section: 'skills', weight: 2,
    ok: skillCount >= 5,
    label: 'Au moins 5 compétences',
    advice: 'Listez au moins 5 compétences — les suggestions selon votre métier peuvent aider.',
  })
  add({
    id: 'skills-max', section: 'skills', weight: 1,
    ok: skillCount <= 18,
    label: 'Pas de liste de compétences interminable',
    advice: 'Au-delà de ~18 compétences, la liste se dilue : gardez les plus pertinentes pour le poste visé.',
  })

  // ── Langues ──
  add({
    id: 'lang', section: 'languages', weight: 1,
    ok: (d.languages || []).length >= 1,
    label: 'Langues indiquées',
    advice: 'Indiquez vos langues avec un niveau honnête (A2, B1, courant…).',
  })

  // ── Lisibilité par les logiciels de recrutement (ATS) ──
  const tpl = getTemplate(cv.templateId)
  const atsAdd = (c) => checks.push({ cat: 'ats', section: 'header', ...c })

  atsAdd({
    id: 'ats-title-keyword', weight: 2, section: 'header',
    ok: !!d.title && words(d.title) <= 8,
    label: 'Intitulé de poste court et explicite',
    advice: "Les logiciels comparent votre titre à l'intitulé de l'offre. Reprenez les mots exacts de l'annonce (ex. « Agent de production »), en 2 à 5 mots, sans slogan.",
  })
  atsAdd({
    id: 'ats-layout', weight: 2, section: 'header',
    ok: tpl.layout === 'single',
    label: 'Mise en page sur une seule colonne',
    advice: "Les modèles à colonne latérale (Designer, Créatif) peuvent désordonner le texte lors de la lecture automatique. Pour une candidature déposée sur un site d'offres, préférez Classique, Moderne, Minimaliste ou Simple ATS.",
  })
  atsAdd({
    id: 'ats-standard-sections', weight: 1, section: 'experience',
    ok: visible.has('experience') && visible.has('education'),
    label: 'Rubriques standard présentes',
    advice: "Gardez les rubriques attendues (Expériences, Formation) visibles et nommées classiquement : les logiciels les repèrent par leur intitulé.",
  })
  atsAdd({
    id: 'ats-contact-parse', weight: 1, section: 'header',
    ok: !!d.email && /\S+@\S+\.\S+/.test(d.email || ''),
    label: 'Adresse email dans un format reconnu',
    advice: "Écrivez votre email en entier et en clair (prenom.nom@exemple.fr), sans espace ni caractère décoratif : c'est souvent la clé d'identification de votre candidature.",
  })
  atsAdd({
    id: 'ats-keywords', weight: 2, section: 'skills',
    ok: (d.techSkills || []).length >= 4,
    label: 'Compétences listées en mots-clés',
    advice: "Listez au moins 4 compétences sous forme de mots-clés simples, avec les termes employés dans les offres visées : c'est sur ces mots que se fait le tri automatique.",
  })
  atsAdd({
    id: 'ats-length', weight: 1, section: 'experience',
    ok: (d.experiences || []).every(e => words(e.description) <= 120),
    label: 'Descriptions de longueur raisonnable',
    advice: 'Limitez chaque description à une centaine de mots : les blocs très longs sont mal découpés à la lecture automatique et rebutent le recruteur.',
  })

  const total = checks.reduce((s, c) => s + c.weight, 0)
  const earned = checks.reduce((s, c) => s + (c.ok ? c.weight : 0), 0)
  const score = Math.round((earned / total) * 100)

  const atsChecks = checks.filter(c => c.cat === 'ats')
  const atsTotal = atsChecks.reduce((s, c) => s + c.weight, 0)
  const atsEarned = atsChecks.reduce((s, c) => s + (c.ok ? c.weight : 0), 0)
  const atsScore = Math.round((atsEarned / atsTotal) * 100)

  return {
    score,
    atsScore,
    checks,
    level: levelOf(score),
    atsLevel: levelOf(atsScore),
  }
}

function levelOf(score) {
  if (score >= 85) return { label: 'Très bon', color: '#1c6b4a' }
  if (score >= 65) return { label: 'Correct', color: '#1f3a68' }
  if (score >= 40) return { label: 'À compléter', color: '#8a5a10' }
  return { label: 'À travailler', color: '#9c2c2c' }
}
