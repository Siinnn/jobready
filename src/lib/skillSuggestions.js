// ─── Suggestions de compétences par famille de métiers ──────────────────────
// Base statique (gratuite, instantanée) — complétée par l'IA via /api/suggest.

const FAMILIES = [
  {
    match: /vend|commerc|caiss|magasin|retail|boutique/i,
    tech: ['Encaissement', 'Conseil client', 'Merchandising', 'Gestion des stocks', 'Inventaires', 'Ouverture/fermeture magasin', 'Objectifs de vente'],
    soft: ['Sens du service', 'Aisance relationnelle', 'Dynamisme', 'Fiabilité'],
  },
  {
    match: /dévelop|program|informat|software|web|data|devops/i,
    tech: ['JavaScript', 'Python', 'SQL', 'Git', 'React', 'Node.js', 'API REST', 'Docker'],
    soft: ['Résolution de problèmes', 'Autonomie', 'Veille technologique', 'Travail en équipe'],
  },
  {
    match: /admin|assistant|secrétar|accueil|gestion/i,
    tech: ['Pack Office', 'Excel', 'Gestion d\'agenda', 'Accueil téléphonique', 'Rédaction de courriers', 'Classement / archivage', 'Facturation'],
    soft: ['Organisation', 'Discrétion', 'Rigueur', 'Polyvalence'],
  },
  {
    match: /communic|market|social|contenu|community/i,
    tech: ['Réseaux sociaux', 'SEO', 'Canva', 'Newsletters', 'Google Analytics', 'Rédaction web', 'Meta Ads'],
    soft: ['Créativité', 'Curiosité', 'Esprit de synthèse', 'Adaptabilité'],
  },
  {
    match: /logist|cariste|prépar|entrepôt|magasinier|manuten/i,
    tech: ['CACES 1-3-5', 'Préparation de commandes', 'Gestion de stocks', 'Scan / picking', 'Chargement / déchargement', 'Contrôle qualité'],
    soft: ['Ponctualité', 'Endurance', 'Esprit d\'équipe', 'Respect des consignes'],
  },
  {
    match: /restaur|cuisin|serveur|serveuse|hôtel|barman/i,
    tech: ['Service en salle', 'Prise de commandes', 'Normes HACCP', 'Encaissement', 'Mise en place', 'Gestion du rush'],
    soft: ['Résistance au stress', 'Sens du contact', 'Rapidité', 'Esprit d\'équipe'],
  },
  {
    match: /soin|infirmi|aide.?soign|auxiliaire|santé|médic/i,
    tech: ['Soins d\'hygiène et de confort', 'Prise de constantes', 'Transmissions', 'Aide à la mobilité', 'Protocoles d\'hygiène'],
    soft: ['Empathie', 'Patience', 'Discrétion professionnelle', 'Sang-froid'],
  },
  {
    match: /bâtiment|maçon|électric|plombier|chantier|peintre|menuis/i,
    tech: ['Lecture de plans', 'Habilitations électriques', 'Sécurité chantier', 'Pose / installation', 'Finitions', 'Outillage électroportatif'],
    soft: ['Précision', 'Travail en équipe', 'Respect des délais', 'Autonomie'],
  },
  {
    match: /chauffeur|livr|transport|vtc|routier/i,
    tech: ['Permis B', 'Permis C / FIMO', 'Tournées de livraison', 'Éco-conduite', 'Manutention', 'Applications GPS'],
    soft: ['Ponctualité', 'Sens de l\'orientation', 'Courtoisie', 'Fiabilité'],
  },
  {
    match: /enseign|form|éduc|animat|professeur/i,
    tech: ['Conception de supports', 'Pédagogie différenciée', 'Évaluation', 'Gestion de groupe', 'Outils numériques éducatifs'],
    soft: ['Pédagogie', 'Écoute', 'Patience', 'Créativité'],
  },
]

const DEFAULT_SUGGESTIONS = {
  tech: ['Pack Office', 'Excel', 'Outils numériques', 'Gestion de projet', 'Relation client'],
  soft: ['Rigueur', 'Autonomie', 'Esprit d\'équipe', 'Adaptabilité', 'Ponctualité', 'Sens de l\'organisation'],
}

export const SKILL_SUGGESTIONS = {
  forJob(title = '') {
    const family = FAMILIES.find(f => f.match.test(title || ''))
    return family ? { tech: family.tech, soft: family.soft } : DEFAULT_SUGGESTIONS
  },
}

// ─── Verbes d'action (aide à la rédaction des expériences) ──────────────────
export const ACTION_VERBS = [
  'Piloter', 'Coordonner', 'Développer', 'Optimiser', 'Gérer', 'Concevoir',
  'Mettre en place', 'Animer', 'Négocier', 'Analyser', 'Former', 'Superviser',
  'Réduire', 'Augmenter', 'Fidéliser', 'Organiser', 'Créer', 'Automatiser',
]
