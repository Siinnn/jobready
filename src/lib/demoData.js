// ─── Jeu de démonstration ────────────────────────────────────────────────────
// Permet de découvrir l'outil sans rien saisir. Profil volontairement réaliste
// et modeste, représentatif d'un public de demandeurs d'emploi.

import { profileToCv } from '@/lib/cvModel'
import { createEmptyLetter } from '@/lib/letterModel'

const DEMO_PROFILE = {
  firstName: 'Sofiane', lastName: 'Benali',
  title: 'Préparateur de commandes',
  email: 'sofiane.benali@exemple.fr',
  phone: '06 24 71 08 53',
  location: 'Vénissieux',
  linkedin: '', portfolio: '',
  summary: "Préparateur de commandes avec 4 ans d'expérience en entrepôt logistique, titulaire des CACES 1 et 3. Habitué aux cadences soutenues et au travail en équipe, reconnu pour ma ponctualité et le soin apporté à la préparation. Je recherche un poste stable en CDI dans l'agglomération lyonnaise.",
  experiences: [
    {
      title: 'Préparateur de commandes',
      company: 'Logistique Rhône Distribution',
      location: 'Corbas',
      period: 'Septembre 2022 — Aujourd\'hui',
      description: "Préparation de 180 à 220 lignes de commandes par jour au scan vocal. Conduite de chariots CACES 1 et 3 pour l'approvisionnement des zones de picking. Contrôle qualité avant expédition et signalement des anomalies de stock. Formation de 3 nouveaux arrivants aux procédures de l'entrepôt.",
    },
    {
      title: 'Agent de quai',
      company: 'Transports Mercier',
      location: 'Saint-Priest',
      period: 'Mars 2021 — Août 2022',
      description: "Chargement et déchargement de camions, tri des colis par tournée de livraison. Vérification des bordereaux et saisie informatique des entrées. Respect des consignes de sécurité sur une zone de quai à forte activité.",
    },
    {
      title: 'Employé polyvalent',
      company: 'Supermarché Casino',
      location: 'Vénissieux',
      period: 'Juin 2020 — Février 2021',
      description: "Mise en rayon, gestion des dates de péremption et tenue de la réserve. Encaissement en renfort lors des pics d'affluence et accueil des clients.",
    },
  ],
  education: [
    { degree: 'Titre professionnel Préparateur de commandes', school: 'AFPA Vénissieux', year: '2021', location: '' },
    { degree: 'CAP Opérateur logistique', school: 'Lycée professionnel Hélène Boucher', year: '2019', location: '' },
  ],
  techSkills: ['CACES 1', 'CACES 3', 'Préparation de commandes', 'Scan vocal', 'Gestion de stocks', 'Chargement et déchargement', 'Contrôle qualité', 'Filmage palettes'],
  softSkills: ['Ponctualité', 'Rigueur', 'Esprit d\'équipe', 'Endurance'],
  languages: [
    { name: 'Français', level: 'Langue maternelle' },
    { name: 'Arabe', level: 'Courant' },
    { name: 'Anglais', level: 'Notions' },
  ],
  certifications: [
    { name: 'CACES R489 catégories 1 et 3', issuer: 'AFTRAL', year: '2023' },
    { name: 'Permis B', issuer: '', year: '2019' },
  ],
  projects: [],
  volunteering: [
    { role: 'Bénévole distribution alimentaire', organization: 'Restos du Cœur', period: '2022 — 2023', description: "Aide à la préparation et à la distribution des colis, deux samedis par mois." },
  ],
  interests: ['Football', 'Course à pied', 'Mécanique'],
  yearsOfExperience: 4,
  seniority: 'confirme',
  searchKeywords: ['préparateur de commandes', 'cariste', 'agent logistique'],
  targetRoles: ['Préparateur de commandes', 'Cariste', 'Agent de quai'],
  contractPreference: 'CDI',
  salaryRange: '',
}

export function createDemoCv() {
  const cv = profileToCv(DEMO_PROFILE, 'CV Sofiane Benali (exemple)', 'ats')
  cv.isDemo = true
  return cv
}

export function createDemoLetter() {
  const letter = createEmptyLetter('Lettre — Groupe Delarue (exemple)')
  letter.isDemo = true
  letter.tone = 'direct'
  letter.sender = {
    firstName: 'Sofiane', lastName: 'Benali',
    title: 'Préparateur de commandes',
    email: 'sofiane.benali@exemple.fr', phone: '06 24 71 08 53',
    location: 'Vénissieux', address: '14 rue des Frères Lumière',
  }
  letter.recipient = {
    company: 'Groupe Delarue Logistique',
    contact: 'Madame Rousseau',
    address: '7 avenue de l\'Industrie',
    city: '69800 Saint-Priest',
  }
  letter.job = { title: 'Préparateur de commandes', reference: '187KTBQ', source: 'France Travail' }
  letter.body = [
    {
      id: 'hook',
      text: "Votre offre de préparateur de commandes publiée sur France Travail (réf. 187KTBQ) a retenu mon attention, car elle correspond précisément au poste que j'occupe aujourd'hui et au secteur que je connais bien. Implanté à Saint-Priest, votre entrepôt se trouve à quinze minutes de mon domicile, ce qui me garantit une disponibilité sans faille.",
    },
    {
      id: 'profile',
      text: "Je travaille depuis quatre ans en entrepôt logistique, dont deux ans chez Logistique Rhône Distribution où je prépare entre 180 et 220 lignes de commandes par jour au scan vocal. Je suis titulaire des CACES 1 et 3, que j'utilise quotidiennement pour l'approvisionnement des zones de picking. J'ai également été chargé de former trois nouveaux arrivants aux procédures de l'entrepôt.",
    },
    {
      id: 'motivation',
      text: "Votre annonce mentionne un travail en horaires d'équipe et des objectifs de productivité : ce sont mes conditions de travail actuelles, et je m'y suis pleinement adapté. Ce qui m'intéresse dans votre structure, c'est la perspective d'un poste en CDI et la polyvalence entre préparation et réception, qui me permettrait d'élargir mes compétences.",
    },
    {
      id: 'closing',
      text: "Je reste à votre disposition pour un entretien, à la date qui vous conviendra, et peux me présenter dans vos locaux à tout moment.\n\nDans l'attente de votre réponse, je vous prie d'agréer, Madame, l'expression de mes salutations distinguées.",
    },
  ]
  return letter
}
