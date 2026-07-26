// ─── Registre des modèles de CV ──────────────────────────────────────────────
// UNE SEULE source de vérité : chaque modèle est une CONFIG consommée par
// CVPreview (affichage écran ET export PDF via impression).
// Ajouter un modèle = ajouter une entrée ici, rien d'autre.

export const TEMPLATES = {
  classique: {
    id: 'classique',
    name: 'Classique',
    icon: '📄',
    description: 'Sobre et structuré, valeurs sûres pour tous les secteurs.',
    tags: ['classique', 'ats'],
    layout: 'single',
    defaultAccent: '#4338ca',
    defaultFont: 'serif',
    headerVariant: 'underline',   // nom + trait accent sous l'en-tête
    titleVariant: 'underline',    // titres de section soulignés accent
  },

  moderne: {
    id: 'moderne',
    name: 'Moderne',
    icon: '🔷',
    description: 'Bandeau coloré en tête, lisible et contemporain.',
    tags: ['moderne'],
    layout: 'single',
    defaultAccent: '#2563eb',
    defaultFont: 'sans',
    headerVariant: 'band',        // en-tête sur fond accent
    titleVariant: 'plain',        // titres accent sans trait
  },

  minimaliste: {
    id: 'minimaliste',
    name: 'Minimaliste',
    icon: '✨',
    description: "L'essentiel, beaucoup d'air, typographie fine.",
    tags: ['minimaliste'],
    layout: 'single',
    defaultAccent: '#111827',
    defaultFont: 'sans',
    headerVariant: 'plain',
    titleVariant: 'muted',        // titres gris clair, trait fin neutre
    timeline: true,               // dates en colonne gauche (expériences/formation)
  },

  ats: {
    id: 'ats',
    name: 'Simple ATS',
    icon: '🤖',
    description: 'Ultra sobre, optimisé pour les robots de recrutement (type France Travail).',
    tags: ['ats', 'classique'],
    layout: 'single',
    defaultAccent: '#111827',
    defaultFont: 'compact',
    headerVariant: 'plain',
    titleVariant: 'caps',         // MAJUSCULES noires, trait gris
    dense: true,
  },

  designer: {
    id: 'designer',
    name: 'Designer',
    icon: '🎨',
    description: 'Colonne latérale sombre, idéal profils créatifs et tech.',
    tags: ['creatif', 'moderne'],
    layout: 'sidebar-left',
    defaultAccent: '#7c3aed',
    defaultFont: 'sans',
    headerVariant: 'sidebar',
    titleVariant: 'plain',
    sidebar: {
      bg: '#1e1b4b',
      text: '#e5e7ef',
      muted: '#a5b4fc',
      width: 250,
      sections: ['contact', 'skills', 'languages', 'interests'],
    },
  },

  creatif: {
    id: 'creatif',
    name: 'Créatif',
    icon: '🎯',
    description: "Colonne latérale à droite aux couleurs de l'accent.",
    tags: ['creatif'],
    layout: 'sidebar-right',
    defaultAccent: '#0f766e',
    defaultFont: 'sans',
    headerVariant: 'plain',
    titleVariant: 'underline',
    sidebar: {
      bg: null,                  // null = dérivé de l'accent (teinte foncée)
      text: '#f0fdfa',
      muted: '#ccfbf1',
      width: 235,
      sections: ['contact', 'skills', 'languages', 'certifications'],
    },
  },
}

export const TEMPLATE_LIST = Object.values(TEMPLATES)

export const TEMPLATE_TAGS = [
  { id: 'all',         label: 'Tous' },
  { id: 'classique',   label: 'Classique' },
  { id: 'moderne',     label: 'Moderne' },
  { id: 'minimaliste', label: 'Minimaliste' },
  { id: 'creatif',     label: 'Créatif' },
  { id: 'ats',         label: 'Spécial ATS' },
]

export function getTemplate(id) {
  return TEMPLATES[id] || TEMPLATES.classique
}

// Accent effectif d'un CV (thème perso > défaut du modèle)
export function getAccent(cv) {
  return cv?.theme?.accent || getTemplate(cv?.templateId).defaultAccent
}

// Fond de sidebar dérivé de l'accent quand bg === null
export function getSidebarBg(tpl, accent) {
  if (!tpl.sidebar) return null
  return tpl.sidebar.bg || darken(accent, 0.25)
}

function darken(hex, amount = 0.2) {
  try {
    const n = hex.replace('#', '')
    const [r, g, b] = [0, 2, 4].map(i => parseInt(n.slice(i, i + 2), 16))
    const f = (v) => Math.max(0, Math.round(v * (1 - amount)))
    return `rgb(${f(r)}, ${f(g)}, ${f(b)})`
  } catch { return hex }
}

// ─── Profil de démonstration (miniatures de la galerie) ─────────────────────
export const DEMO_DATA = {
  firstName: 'Camille', lastName: 'Martin',
  title: 'Chargée de communication',
  email: 'camille.martin@mail.fr', phone: '06 12 34 56 78', location: 'Lyon',
  linkedin: 'linkedin.com/in/cmartin', portfolio: '',
  summary: "5 ans d'expérience en communication digitale. Pilotage de campagnes multicanales et création de contenus qui engagent.",
  experiences: [
    { title: 'Chargée de communication', company: 'Agence Lumo', period: '2021 — 2024', description: 'Stratégie éditoriale, +40% d\'audience sur les réseaux sociaux, gestion d\'un budget de 50 k€.' },
    { title: 'Assistante marketing', company: 'Groupe Vertex', period: '2019 — 2021', description: 'Newsletters (25 000 abonnés), organisation de 12 événements clients par an.' },
  ],
  education: [
    { degree: 'Master Communication', school: 'Université Lyon 2', year: '2019' },
    { degree: 'Licence Information-Communication', school: 'Université Lyon 2', year: '2017' },
  ],
  techSkills: ['SEO', 'Canva', 'Meta Ads', 'WordPress', 'Mailchimp'],
  softSkills: ['Créativité', 'Rigueur', 'Esprit d\'équipe'],
  languages: [{ name: 'Français', level: 'Natif' }, { name: 'Anglais', level: 'C1' }],
  projects: [], certifications: [], volunteering: [], interests: ['Photographie', 'Randonnée'],
}
