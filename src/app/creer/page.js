'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { createEmptyCv } from '@/lib/cvModel'
import { TextInput, TextArea, TagInput, ListEditor, LIST_FIELDS, LIST_TITLES } from '@/components/editor/fields'
import TemplateGallery from '@/components/editor/TemplateGallery'
import { SummaryGenerator, AIRewriteButton } from '@/components/ai/AIHelpers'
import { SKILL_SUGGESTIONS, ACTION_VERBS } from '@/lib/skillSuggestions'
import Icon from '@/components/ui/Icon'

const STEPS = [
  { id: 'identity',   label: 'Identité',    icon: 'user' },
  { id: 'summary',    label: 'Accroche',    icon: 'pencil' },
  { id: 'experience', label: 'Expériences', icon: 'briefcase' },
  { id: 'education',  label: 'Formation',   icon: 'cap' },
  { id: 'skills',     label: 'Compétences', icon: 'tools' },
  { id: 'extras',     label: 'Langues',     icon: 'globe' },
  { id: 'template',   label: 'Modèle',      icon: 'layout' },
]

export default function CreerPage() {
  const router = useRouter()
  const { createCv } = useApp()
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState(() => createEmptyCv('Mon CV'))

  const d = draft.data
  const upData = (patch) => setDraft(prev => ({ ...prev, data: { ...prev.data, ...patch } }))
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  const finish = () => {
    const name = [d.firstName, d.lastName].filter(Boolean).join(' ')
    createCv({ ...draft, name: name ? `CV ${name}` : 'Mon CV' })
    router.push('/editeur')
  }

  return (
    <div className="min-h-screen">
      {/* En-tête du parcours */}
      <header className="sticky top-0 z-20 bg-white" style={{ borderBottom: '1px solid var(--c-border)' }}>
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 flex items-center justify-center text-white text-xs font-bold"
              style={{ background: 'var(--c-primary)', borderRadius: 'var(--r-md)' }}>JR</span>
            <span className="font-semibold text-[15px]" style={{ color: 'var(--c-ink)' }}>Créer mon CV</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs tabular-nums" style={{ color: 'var(--c-muted)' }}>
              Étape {step + 1} sur {STEPS.length}
            </span>
            <button onClick={() => router.push('/')} className="btn-ghost !px-2" title="Quitter">
              <Icon name="close" size={16} />
            </button>
          </div>
        </div>
        {/* Progression */}
        <div className="h-0.5" style={{ background: 'var(--c-border)' }}>
          <div style={{
            width: `${((step + 1) / STEPS.length) * 100}%`, height: '100%',
            background: 'var(--c-primary)', transition: 'width .25s',
          }} />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Fil d'étapes */}
        <nav aria-label="Étapes" className="flex items-center gap-1 mb-7 overflow-x-auto pb-1">
          {STEPS.map((s, i) => {
            const done = i < step, active = i === step
            return (
              <button key={s.id} onClick={() => done && setStep(i)} disabled={!done && !active}
                aria-current={active ? 'step' : undefined}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors"
                style={{
                  borderRadius: 'var(--r-md)',
                  background: active ? 'var(--c-primary)' : done ? 'var(--c-primary-light)' : '#eef1f5',
                  color: active ? '#fff' : done ? 'var(--c-primary)' : 'var(--c-faint)',
                  cursor: done ? 'pointer' : 'default',
                }}>
                <Icon name={done ? 'check' : s.icon} size={13} />
                {s.label}
              </button>
            )
          })}
        </nav>

        <div className="card p-6">
          {current.id === 'identity' && (
            <Step title="Vos informations de contact"
              help="Ces informations apparaissent en tête du CV. Seuls le prénom et le nom sont indispensables ; un titre de poste clair améliore nettement le repérage de votre candidature.">
              <div className="grid grid-cols-2 gap-4">
                <TextInput label="Prénom" value={d.firstName} onChange={v => upData({ firstName: v })} placeholder="Camille" />
                <TextInput label="Nom" value={d.lastName} onChange={v => upData({ lastName: v })} placeholder="Martin" />
                <div className="col-span-2">
                  <TextInput label="Titre professionnel" hint="— le poste que vous visez" value={d.title}
                    onChange={v => upData({ title: v })} placeholder="Ex : Assistante administrative" />
                  <p className="hint mt-1.5">
                    Reprenez l'intitulé exact employé dans les offres qui vous intéressent, en 2 à 5 mots.
                  </p>
                </div>
                <TextInput label="Email" type="email" value={d.email} onChange={v => upData({ email: v })} placeholder="camille.martin@mail.fr" />
                <TextInput label="Téléphone" value={d.phone} onChange={v => upData({ phone: v })} placeholder="06 12 34 56 78" />
                <TextInput label="Ville" value={d.location} onChange={v => upData({ location: v })} placeholder="Lyon" />
                <TextInput label="LinkedIn" hint="— facultatif" value={d.linkedin} onChange={v => upData({ linkedin: v })} placeholder="linkedin.com/in/…" />
                <div className="col-span-2">
                  <TextInput label="Portfolio ou site web" hint="— facultatif" value={d.portfolio}
                    onChange={v => upData({ portfolio: v })} placeholder="monsite.fr" />
                </div>
              </div>
            </Step>
          )}

          {current.id === 'summary' && (
            <Step title="Votre accroche"
              help="Deux à quatre phrases placées en haut du CV : qui vous êtes, ce que vous recherchez, vos points forts. C'est la première chose que lit un recruteur.">
              <TextArea value={d.summary} onChange={v => upData({ summary: v })} rows={5}
                placeholder="Ex : Vendeuse avec 3 ans d'expérience en prêt-à-porter, reconnue pour mon sens du service et ma capacité à gérer les périodes de forte affluence…"
                actions={d.summary ? [
                  <AIRewriteButton key="rw" text={d.summary} field="accroche" jobTitle={d.title}
                    onApply={v => upData({ summary: v })} />,
                ] : null} />
              <div className="mt-4">
                <SummaryGenerator data={d} onApply={v => upData({ summary: v })} />
              </div>
            </Step>
          )}

          {current.id === 'experience' && (
            <Step title="Vos expériences professionnelles"
              help="De la plus récente à la plus ancienne. Les stages, l'intérim, les jobs d'été et le bénévolat comptent : ils montrent votre savoir-faire et votre sérieux.">
              <div className="note note-info mb-4">
                <Icon name="info" size={14} />
                <span>
                  Pour chaque poste, décrivez vos missions avec un verbe d'action et, si possible,
                  un chiffre : <em>{ACTION_VERBS.slice(0, 4).join(', ').toLowerCase()}…</em> —
                  « accueil de 60 clients par jour », « gestion d'un stock de 300 références ».
                </span>
              </div>
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
            </Step>
          )}

          {current.id === 'education' && (
            <Step title="Votre formation"
              help="Diplômes, titres professionnels, formations qualifiantes, remises à niveau — du plus récent au plus ancien. Une formation en cours se mentionne aussi.">
              <ListEditor values={d.education} onChange={v => upData({ education: v })}
                entryType="education" fields={LIST_FIELDS.education} titleOf={LIST_TITLES.education}
                addLabel="Ajouter une formation" />
            </Step>
          )}

          {current.id === 'skills' && (
            <Step title="Vos compétences"
              help="Saisissez une compétence puis appuyez sur Entrée. Ce sont ces mots-clés que les logiciels de recrutement comparent aux offres : employez les termes des annonces qui vous intéressent.">
              <div className="flex flex-col gap-5">
                <TagInput label="Compétences techniques et savoir-faire métier" values={d.techSkills}
                  onChange={v => upData({ techSkills: v })}
                  suggestions={SKILL_SUGGESTIONS.forJob(d.title).tech}
                  placeholder="Ex : encaissement, Excel, CACES 3…" />
                <TagInput label="Qualités personnelles" values={d.softSkills}
                  onChange={v => upData({ softSkills: v })}
                  suggestions={SKILL_SUGGESTIONS.forJob(d.title).soft}
                  placeholder="Ex : ponctualité, esprit d'équipe…" />
              </div>
            </Step>
          )}

          {current.id === 'extras' && (
            <Step title="Langues et rubriques complémentaires"
              help="Tout est facultatif. Ne renseignez que ce qui valorise votre candidature : une rubrique vide n'apparaîtra pas sur le CV.">
              <div className="flex flex-col gap-6">
                <ListEditor label="Langues" values={d.languages} onChange={v => upData({ languages: v })}
                  entryType="languages" fields={LIST_FIELDS.languages} titleOf={LIST_TITLES.languages}
                  addLabel="Ajouter une langue" />
                <ListEditor label="Certifications, habilitations, permis" values={d.certifications}
                  onChange={v => upData({ certifications: v })}
                  entryType="certifications" fields={LIST_FIELDS.certifications} titleOf={LIST_TITLES.certifications}
                  addLabel="Ajouter une certification" />
                <TagInput label="Centres d'intérêt" values={d.interests} onChange={v => upData({ interests: v })}
                  placeholder="Ex : football, cuisine, lecture…" />
              </div>
            </Step>
          )}

          {current.id === 'template' && (
            <Step title="Choisissez la présentation"
              help="Les aperçus utilisent vos informations. Vous pourrez changer de modèle à tout moment depuis l'éditeur, sans rien perdre.">
              <div className="note note-info mb-4">
                <Icon name="shield" size={14} />
                <span>
                  Pour candidater via un site d'offres, un modèle sur une seule colonne
                  (Classique, Moderne, Minimaliste, Simple ATS) est plus sûr : il est mieux
                  lu par les logiciels de recrutement.
                </span>
              </div>
              <TemplateGallery selectedId={draft.templateId} data={d}
                onSelect={id => setDraft(prev => ({ ...prev, templateId: id, theme: { ...prev.theme, accent: null } }))} />
            </Step>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3 mt-7 pt-5"
            style={{ borderTop: '1px solid var(--c-border)' }}>
            <button onClick={() => step > 0 ? setStep(step - 1) : router.push('/')} className="btn-secondary">
              <Icon name="arrowLeft" size={14} /> {step > 0 ? 'Précédent' : 'Annuler'}
            </button>
            <div className="flex items-center gap-2">
              {!isLast && (
                <button onClick={() => setStep(step + 1)} className="btn-ghost text-xs">
                  Passer cette étape
                </button>
              )}
              {isLast ? (
                <button onClick={finish} className="btn-primary">
                  <Icon name="check" size={15} /> Créer mon CV
                </button>
              ) : (
                <button onClick={() => setStep(step + 1)} className="btn-primary">
                  Continuer <Icon name="arrowRight" size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        <p className="hint text-center mt-4">
          Votre CV est enregistré à la dernière étape, dans ce navigateur uniquement.
        </p>
      </main>
    </div>
  )
}

function Step({ title, help, children }) {
  return (
    <div>
      <h1 className="text-lg font-semibold mb-1.5">{title}</h1>
      <p className="text-sm mb-5 leading-relaxed" style={{ color: 'var(--c-muted)' }}>{help}</p>
      {children}
    </div>
  )
}
