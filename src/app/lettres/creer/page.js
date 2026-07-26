'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { createEmptyLetter, letterFromCv, LETTER_TONES } from '@/lib/letterModel'
import { TextInput, TextArea } from '@/components/editor/fields'
import Icon from '@/components/ui/Icon'

const STEPS = [
  { id: 'source',    label: 'Vos infos',   icon: 'user' },
  { id: 'recipient', label: 'Destinataire', icon: 'briefcase' },
  { id: 'content',   label: 'Contenu',     icon: 'pencil' },
]

export default function CreerLettrePage() {
  const router = useRouter()
  const { cvs, createLetter } = useApp()
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState(() => createEmptyLetter('Ma lettre'))
  const [notes, setNotes] = useState('')
  const [sourceCvId, setSourceCvId] = useState(cvs[0]?.id ?? null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const current = STEPS[step]
  const up = (patch) => setDraft(prev => ({ ...prev, ...patch }))
  const upSender = (patch) => setDraft(prev => ({ ...prev, sender: { ...prev.sender, ...patch } }))
  const upRecipient = (patch) => setDraft(prev => ({ ...prev, recipient: { ...prev.recipient, ...patch } }))
  const upJob = (patch) => setDraft(prev => ({ ...prev, job: { ...prev.job, ...patch } }))

  // Reprendre les coordonnées d'un CV
  const applyCv = (id) => {
    setSourceCvId(id)
    const cv = cvs.find(c => c.id === id)
    if (!cv) return
    const filled = letterFromCv(cv, draft.name)
    setDraft(prev => ({ ...prev, sender: filled.sender, sourceCvId: cv.id }))
  }

  const finish = (body) => {
    const name = draft.recipient.company
      ? `Lettre — ${draft.recipient.company}`
      : draft.job.title ? `Lettre — ${draft.job.title}` : 'Ma lettre'
    createLetter({ ...draft, name, body: body || draft.body })
    router.push('/lettres/editeur')
  }

  // Génération du brouillon
  const generate = async () => {
    setGenerating(true); setError('')
    try {
      const cv = cvs.find(c => c.id === sourceCvId)
      const res = await fetch('/api/letter-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: draft.sender, recipient: draft.recipient, job: draft.job,
          tone: draft.tone, notes,
          cvSummary: cv?.data?.summary || '',
          experiences: cv?.data?.experiences || [],
          skills: [...(cv?.data?.techSkills || []), ...(cv?.data?.softSkills || [])],
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      finish([
        { id: 'hook',       text: json.draft.hook },
        { id: 'profile',    text: json.draft.profile },
        { id: 'motivation', text: json.draft.motivation },
        { id: 'closing',    text: json.draft.closing || draft.body[3].text },
      ])
    } catch (e) {
      setError(e.message)
      setGenerating(false)
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 bg-white" style={{ borderBottom: '1px solid var(--c-border)' }}>
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 flex items-center justify-center text-white text-xs font-bold"
              style={{ background: 'var(--c-primary)', borderRadius: 'var(--r-md)' }}>JR</span>
            <span className="font-semibold text-[15px]" style={{ color: 'var(--c-ink)' }}>Nouvelle lettre</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs tabular-nums" style={{ color: 'var(--c-muted)' }}>
              Étape {step + 1} sur {STEPS.length}
            </span>
            <button onClick={() => router.push('/mes-lettres')} className="btn-ghost !px-2" title="Quitter">
              <Icon name="close" size={16} />
            </button>
          </div>
        </div>
        <div className="h-0.5" style={{ background: 'var(--c-border)' }}>
          <div style={{ width: `${((step + 1) / STEPS.length) * 100}%`, height: '100%', background: 'var(--c-primary)', transition: 'width .25s' }} />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <nav aria-label="Étapes" className="flex items-center gap-1 mb-7">
          {STEPS.map((s, i) => {
            const done = i < step, active = i === step
            return (
              <button key={s.id} onClick={() => done && setStep(i)} disabled={!done && !active}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap"
                style={{
                  borderRadius: 'var(--r-md)',
                  background: active ? 'var(--c-primary)' : done ? 'var(--c-primary-light)' : '#eef1f5',
                  color: active ? '#fff' : done ? 'var(--c-primary)' : 'var(--c-faint)',
                  cursor: done ? 'pointer' : 'default',
                }}>
                <Icon name={done ? 'check' : s.icon} size={13} /> {s.label}
              </button>
            )
          })}
        </nav>

        <div className="card p-6">
          {/* ── Vos informations ── */}
          {current.id === 'source' && (
            <Step title="Vos coordonnées"
              help="Elles apparaissent en haut à gauche de la lettre, comme sur un courrier classique.">
              {cvs.length > 0 && (
                <div className="mb-5">
                  <span className="label">Reprendre les informations d'un de vos CV</span>
                  <div className="flex flex-col gap-2">
                    {cvs.map(cv => (
                      <button key={cv.id} onClick={() => applyCv(cv.id)}
                        className="flex items-center gap-2.5 p-2.5 text-left text-sm transition-colors"
                        style={{
                          border: `1px solid ${sourceCvId === cv.id ? 'var(--c-primary)' : 'var(--c-border-strong)'}`,
                          background: sourceCvId === cv.id ? 'var(--c-primary-light)' : '#fff',
                          borderRadius: 'var(--r-md)',
                        }}>
                        <Icon name="file" size={15} style={{ color: 'var(--c-muted)' }} />
                        <span className="flex-1 font-medium truncate">{cv.name}</span>
                        {sourceCvId === cv.id && <Icon name="check" size={14} style={{ color: 'var(--c-primary)' }} />}
                      </button>
                    ))}
                  </div>
                  <p className="hint mt-2">
                    Le contenu du CV sert aussi de base à la rédaction du brouillon, à l'étape suivante.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <TextInput label="Prénom" value={draft.sender.firstName} onChange={v => upSender({ firstName: v })} />
                <TextInput label="Nom" value={draft.sender.lastName} onChange={v => upSender({ lastName: v })} />
                <div className="col-span-2">
                  <TextInput label="Titre professionnel" hint="— facultatif" value={draft.sender.title}
                    onChange={v => upSender({ title: v })} placeholder="Ex : Agent logistique" />
                </div>
                <TextInput label="Email" type="email" value={draft.sender.email} onChange={v => upSender({ email: v })} />
                <TextInput label="Téléphone" value={draft.sender.phone} onChange={v => upSender({ phone: v })} />
                <TextInput label="Ville" value={draft.sender.location} onChange={v => upSender({ location: v })}
                  placeholder="Lyon" />
                <TextInput label="Adresse postale" hint="— facultatif" value={draft.sender.address}
                  onChange={v => upSender({ address: v })} placeholder="12 rue des Lilas" />
              </div>
            </Step>
          )}

          {/* ── Destinataire ── */}
          {current.id === 'recipient' && (
            <Step title="À qui écrivez-vous ?"
              help="Adressez si possible votre lettre à une personne nommée : cela montre que vous vous êtes renseigné. À défaut, « Madame, Monsieur » sera utilisé.">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <TextInput label="Entreprise ou organisme" value={draft.recipient.company}
                    onChange={v => upRecipient({ company: v })} placeholder="Ex : Transports Berger" />
                </div>
                <div className="col-span-2">
                  <TextInput label="Personne destinataire" hint="— facultatif" value={draft.recipient.contact}
                    onChange={v => upRecipient({ contact: v })} placeholder="Ex : Madame Dupont, Responsable RH" />
                </div>
                <TextInput label="Adresse" hint="— facultatif" value={draft.recipient.address}
                  onChange={v => upRecipient({ address: v })} placeholder="8 avenue de la Gare" />
                <TextInput label="Code postal et ville" hint="— facultatif" value={draft.recipient.city}
                  onChange={v => upRecipient({ city: v })} placeholder="69003 Lyon" />
              </div>

              <div className="mt-6 pt-5" style={{ borderTop: '1px solid var(--c-border)' }}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <TextInput label="Poste visé" value={draft.job.title} onChange={v => upJob({ title: v })}
                      placeholder="Ex : Préparateur de commandes" />
                  </div>
                  <TextInput label="Référence de l'offre" hint="— si elle en a une" value={draft.job.reference}
                    onChange={v => upJob({ reference: v })} placeholder="Ex : 178FKQR" />
                  <TextInput label="Où avez-vous vu l'offre ?" hint="— facultatif" value={draft.job.source}
                    onChange={v => upJob({ source: v })} placeholder="Ex : France Travail" />
                </div>
                <p className="hint mt-2">
                  Sans poste précis, la lettre sera présentée comme une candidature spontanée.
                </p>
              </div>
            </Step>
          )}

          {/* ── Contenu ── */}
          {current.id === 'content' && (
            <Step title="Le contenu de votre lettre"
              help="Choisissez le ton, ajoutez ce que vous voulez absolument mentionner, et un brouillon en quatre paragraphes vous sera proposé. Vous pourrez tout réécrire ensuite.">
              <div className="mb-5">
                <span className="label">Ton de la lettre</span>
                <div className="flex flex-col gap-2">
                  {LETTER_TONES.map(t => (
                    <button key={t.id} onClick={() => up({ tone: t.id })}
                      className="text-left p-3 transition-colors"
                      style={{
                        border: `1px solid ${draft.tone === t.id ? 'var(--c-primary)' : 'var(--c-border-strong)'}`,
                        background: draft.tone === t.id ? 'var(--c-primary-light)' : '#fff',
                        borderRadius: 'var(--r-md)',
                      }}>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold"
                          style={{ color: draft.tone === t.id ? 'var(--c-primary)' : 'var(--c-ink)' }}>{t.label}</span>
                        {draft.tone === t.id && <Icon name="check" size={14} style={{ color: 'var(--c-primary)' }} />}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--c-muted)' }}>{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <TextArea label="Ce que vous souhaitez mettre en avant" hint="— facultatif mais recommandé"
                rows={4} value={notes} onChange={setNotes}
                placeholder="Ex : je connais déjà le secteur du transport, je suis disponible immédiatement, j'ai le CACES 1 et je vise un poste stable près de chez moi." />
              <p className="hint mt-1.5">
                Plus vous êtes précis, moins la lettre sera générique. Aucun fait ne sera inventé :
                seules vos informations et celles de votre CV sont utilisées.
              </p>

              {error && (
                <div className="note note-warn mt-4">
                  <Icon name="alert" size={15} />
                  <span>
                    {error}
                    <br />
                    Vous pouvez tout de même continuer et écrire votre lettre vous-même :
                    chaque paragraphe est guidé par une consigne dans l'éditeur.
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-2 mt-6">
                <button onClick={generate} disabled={generating} className="btn-primary">
                  {generating
                    ? <><Icon name="clock" size={15} className="animate-spin" /> Rédaction du brouillon…</>
                    : <><Icon name="wand" size={15} /> Proposer un brouillon et ouvrir l'éditeur</>}
                </button>
                <button onClick={() => finish()} disabled={generating} className="btn-secondary">
                  <Icon name="pencil" size={15} /> Écrire moi-même, sans brouillon
                </button>
              </div>
            </Step>
          )}

          {/* Navigation */}
          {current.id !== 'content' && (
            <div className="flex items-center justify-between gap-3 mt-7 pt-5"
              style={{ borderTop: '1px solid var(--c-border)' }}>
              <button onClick={() => step > 0 ? setStep(step - 1) : router.push('/mes-lettres')} className="btn-secondary">
                <Icon name="arrowLeft" size={14} /> {step > 0 ? 'Précédent' : 'Annuler'}
              </button>
              <button onClick={() => setStep(step + 1)} className="btn-primary">
                Continuer <Icon name="arrowRight" size={14} />
              </button>
            </div>
          )}
          {current.id === 'content' && (
            <div className="mt-5 pt-5" style={{ borderTop: '1px solid var(--c-border)' }}>
              <button onClick={() => setStep(step - 1)} className="btn-secondary">
                <Icon name="arrowLeft" size={14} /> Précédent
              </button>
            </div>
          )}
        </div>
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
