// ─── CV de démarrage rapide, par intitulé de métier ─────────────────────────
// Aucun appel réseau, aucune IA : à partir du seul intitulé saisi, on pioche
// dans la grille de compétences existante (skillSuggestions.js) pour
// préremplir le titre, les compétences et une accroche basique. L'identité,
// les expériences et la formation restent volontairement vides : c'est ce
// qu'il reste à la personne à compléter, rapidement, dans l'éditeur.

import { createEmptyCv } from './cvModel'
import { SKILL_SUGGESTIONS } from './skillSuggestions'

// Assemble une accroche simple à partir des suggestions du métier. Rédigée
// sans accord de genre (aucun adjectif à accorder) : un point de départ à
// ajuster, jamais un texte figé — comme le rappelle déjà l'aide à la
// rédaction basée sur l'IA ailleurs dans l'outil.
export function buildStarterSummary(title, tech = [], soft = []) {
  const techList = tech.slice(0, 3).join(', ')
  const softList = soft.slice(0, 3).join(', ')
  let s = title
  if (techList) s += `, avec des compétences en ${techList}`
  s += '.'
  if (softList) s += ` Points forts : ${softList}.`
  s += " À la recherche d'un poste où mettre ce savoir-faire au service d'une équipe."
  return s
}

// Crée un CVDocument prérempli à partir d'un seul intitulé de métier.
export function createStarterCv(jobTitle, templateId = 'classique') {
  const title = jobTitle.trim()
  const { tech, soft } = SKILL_SUGGESTIONS.forJob(title)
  const cv = createEmptyCv(`CV ${title}`, templateId)
  cv.data.title = title
  cv.data.techSkills = tech.slice(0, 6)
  cv.data.softSkills = soft.slice(0, 4)
  cv.data.summary = buildStarterSummary(title, tech, soft)
  return cv
}
