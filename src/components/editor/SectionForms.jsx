'use client'
import { TextInput, TextArea, TagInput, ListEditor, LIST_FIELDS, LIST_TITLES } from '@/components/editor/fields'
import { SummaryGenerator, AIRewriteButton } from '@/components/ai/AIHelpers'
import { SKILL_SUGGESTIONS } from '@/lib/skillSuggestions'

// Formulaire d'édition pour une section donnée.
// d : cv.data — upData(patch) : fusionne dans data
export default function SectionForm({ type, d, upData }) {
  switch (type) {
    case 'header':
      return (
        <div className="grid grid-cols-2 gap-3">
          <TextInput label="Prénom" value={d.firstName} onChange={v => upData({ firstName: v })} />
          <TextInput label="Nom" value={d.lastName} onChange={v => upData({ lastName: v })} />
          <div className="col-span-2">
            <TextInput label="Titre professionnel" value={d.title} onChange={v => upData({ title: v })}
              placeholder="Ex : Développeur web junior" />
          </div>
          <TextInput label="Email" value={d.email} onChange={v => upData({ email: v })} />
          <TextInput label="Téléphone" value={d.phone} onChange={v => upData({ phone: v })} />
          <TextInput label="Ville" value={d.location} onChange={v => upData({ location: v })} />
          <TextInput label="LinkedIn" value={d.linkedin} onChange={v => upData({ linkedin: v })} />
          <div className="col-span-2">
            <TextInput label="Portfolio / site web" hint="(laisser vide pour ne pas l'afficher)"
              value={d.portfolio} onChange={v => upData({ portfolio: v })} />
          </div>
        </div>
      )

    case 'summary':
      return (
        <div>
          <TextArea label="Accroche" hint="(2 à 4 phrases)" rows={5} value={d.summary}
            onChange={v => upData({ summary: v })}
            placeholder="Qui vous êtes, ce que vous visez, vos points forts…"
            actions={d.summary ? [
              <AIRewriteButton key="rw" text={d.summary} field="accroche" jobTitle={d.title}
                onApply={v => upData({ summary: v })} />,
            ] : null} />
          <div className="mt-4">
            <SummaryGenerator data={d} onApply={v => upData({ summary: v })} compact />
          </div>
        </div>
      )

    case 'experience':
      return (
        <ListEditor values={d.experiences} onChange={v => upData({ experiences: v })}
          entryType="experiences" fields={LIST_FIELDS.experiences} titleOf={LIST_TITLES.experiences}
          addLabel="Ajouter une expérience"
          renderExtra={(entry, i, key) => key === 'description' && entry.description ? [
            <AIRewriteButton key="rw" text={entry.description} field="description d'expérience"
              jobTitle={entry.title || d.title}
              onApply={v => {
                const arr = [...d.experiences]; arr[i] = { ...arr[i], description: v }
                upData({ experiences: arr })
              }} />,
          ] : null} />
      )

    case 'education':
      return (
        <ListEditor values={d.education} onChange={v => upData({ education: v })}
          entryType="education" fields={LIST_FIELDS.education} titleOf={LIST_TITLES.education}
          addLabel="Ajouter une formation" />
      )

    case 'skills':
      return (
        <div className="flex flex-col gap-4">
          <TagInput label="Compétences techniques / métier" values={d.techSkills}
            onChange={v => upData({ techSkills: v })}
            suggestions={SKILL_SUGGESTIONS.forJob(d.title).tech} />
          <TagInput label="Qualités personnelles" values={d.softSkills}
            onChange={v => upData({ softSkills: v })}
            suggestions={SKILL_SUGGESTIONS.forJob(d.title).soft} />
        </div>
      )

    case 'languages':
      return (
        <ListEditor values={d.languages} onChange={v => upData({ languages: v })}
          entryType="languages" fields={LIST_FIELDS.languages} titleOf={LIST_TITLES.languages}
          addLabel="Ajouter une langue" />
      )

    case 'projects':
      return (
        <ListEditor values={d.projects} onChange={v => upData({ projects: v })}
          entryType="projects" fields={LIST_FIELDS.projects} titleOf={LIST_TITLES.projects}
          addLabel="Ajouter un projet" />
      )

    case 'certifications':
      return (
        <ListEditor values={d.certifications} onChange={v => upData({ certifications: v })}
          entryType="certifications" fields={LIST_FIELDS.certifications} titleOf={LIST_TITLES.certifications}
          addLabel="Ajouter une certification" />
      )

    case 'volunteering':
      return (
        <ListEditor values={d.volunteering} onChange={v => upData({ volunteering: v })}
          entryType="volunteering" fields={LIST_FIELDS.volunteering} titleOf={LIST_TITLES.volunteering}
          addLabel="Ajouter une expérience bénévole" />
      )

    case 'interests':
      return (
        <TagInput label="Centres d'intérêt" values={d.interests}
          onChange={v => upData({ interests: v })}
          placeholder="Ex : Football, cuisine…" />
      )

    default:
      return null
  }
}
