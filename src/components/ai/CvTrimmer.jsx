'use client'
import { useState } from 'react'
import Icon from '@/components/ui/Icon'

const STRING_FIELDS = ['techSkills', 'softSkills', 'interests']
const FIELD_LABELS = {
  experiences: 'Expérience', education: 'Formation', projects: 'Projet',
  certifications: 'Certification', volunteering: 'Bénévolat',
  techSkills: 'Compétence technique', softSkills: 'Qualité personnelle', interests: "Centre d'intérêt",
}
// Pré-cochées : en dessous de ce seuil de pertinence, l'IA considère
// l'élément comme un bon candidat au masquage.
const SUGGESTED_THRESHOLD = 40

// Construit le patch à fusionner dans cv.data pour masquer les éléments
// sélectionnés. Ne touche à AUCUNE donnée : ajoute seulement `hidden: true`
// (listes d'objets) ou une entrée dans `data.hidden[champ]` (listes de texte).
function buildHidePatch(profile, selections) {
  const byField = {}
  selections.forEach(({ field, index }) => { (byField[field] ||= []).push(index) })

  const patch = {}
  Object.entries(byField).forEach(([field, indices]) => {
    if (STRING_FIELDS.includes(field)) {
      const values = indices.map(i => profile[field]?.[i]).filter(Boolean)
      const already = (patch.hidden || profile.hidden || {})[field] || []
      patch.hidden = { ...(patch.hidden || profile.hidden || {}), [field]: [...new Set([...already, ...values])] }
    } else {
      const list = profile[field] || []
      patch[field] = list.map((e, i) => indices.includes(i) ? { ...e, hidden: true } : e)
    }
  })
  return patch
}

// cv       : CVDocument actif
// onApply  : (patch) => void — fusionné dans cv.data (jamais de suppression)
// pages    : nombre de pages estimé (pour adapter le texte d'intro)
export default function CvTrimmer({ cv, onApply, pages }) {
  const [open, setOpen] = useState(false)
  const [offerText, setOfferText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [unavailable, setUnavailable] = useState(false)
  const [result, setResult] = useState(null) // { items, summary }
  const [selected, setSelected] = useState(new Set())

  const reset = () => { setResult(null); setError(''); setSelected(new Set()) }

  const analyze = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/trim-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: cv.data, offerText }),
      })
      const json = await res.json()
      if (!res.ok) {
        const err = new Error(json.error || 'Erreur serveur')
        err.unavailable = json.code === 'AI_NOT_CONFIGURED' || json.code === 'RATE_LIMITED'
        throw err
      }
      const items = [...json.items].sort((a, b) => a.relevance - b.relevance)
      setResult({ items, summary: json.summary })
      setSelected(new Set(
        items.filter(it => it.relevance < SUGGESTED_THRESHOLD).map(it => `${it.field}:${it.index}`)
      ))
    } catch (e) {
      setError(e.message)
      setUnavailable(!!e.unavailable)
    } finally {
      setLoading(false)
    }
  }

  const toggle = (key) => setSelected(prev => {
    const next = new Set(prev)
    next.has(key) ? next.delete(key) : next.add(key)
    return next
  })

  const apply = () => {
    const selections = [...selected].map(k => {
      const [field, index] = k.split(':')
      return { field, index: Number(index) }
    })
    if (selections.length > 0) onApply(buildHidePatch(cv.data, selections))
    setOpen(false)
    reset()
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold transition-colors"
        style={{ background: 'var(--c-primary-light)', color: 'var(--c-primary)', borderRadius: 'var(--r-md)' }}>
        <Icon name="target" size={13} /> Alléger mon CV
      </button>

      {open && (
        <div role="dialog" aria-modal="true" aria-labelledby="trim-title"
          onClick={e => e.target === e.currentTarget && setOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(18, 33, 61, 0.45)' }}>
          <div className="bg-white w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto" style={{ borderRadius: 'var(--r-lg)' }}>
            <div className="flex items-start justify-between gap-3 mb-1">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 flex items-center justify-center shrink-0"
                  style={{ background: 'var(--c-primary-light)', color: 'var(--c-primary)', borderRadius: 'var(--r-md)' }}>
                  <Icon name="target" size={18} />
                </div>
                <div>
                  <h2 id="trim-title" className="text-base font-semibold">Alléger mon CV</h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--c-muted)' }}>
                    {pages > 1 ? `Votre CV occupe actuellement ${pages} pages.` : 'Repérez les informations les moins utiles pour une offre.'}
                  </p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Fermer" style={{ color: 'var(--c-muted)' }}>
                <Icon name="close" size={16} />
              </button>
            </div>

            <div className="note note-info my-4">
              <Icon name="eyeOff" size={14} />
              <span>Rien n'est jamais supprimé : les éléments choisis sont masqués (retirés de l'aperçu et de l'impression) et restent réaffichables à tout moment depuis le panneau de gauche.</span>
            </div>

            {!result && (
              <>
                <label className="label">Offre visée (optionnel, mais recommandé)</label>
                <textarea className="input resize-y" rows={6} value={offerText}
                  onChange={e => setOfferText(e.target.value)}
                  placeholder="Collez ici le texte de l'offre d'emploi : l'analyse hiérarchisera vos informations selon leur pertinence pour ce poste précis." />
                <p className="text-[11px] mt-1.5" style={{ color: 'var(--c-faint)' }}>
                  Sans offre, le classement se base sur l'ancienneté et l'impact général des informations.
                </p>

                {error && (
                  unavailable ? (
                    <div className="note mt-3"><Icon name="info" size={14} /><span>{error}</span></div>
                  ) : (
                    <p className="text-xs mt-3" style={{ color: 'var(--c-danger)' }}>{error}</p>
                  )
                )}

                <button type="button" onClick={analyze} disabled={loading} className="btn-primary w-full !py-2.5 mt-4">
                  {loading
                    ? <><Icon name="clock" size={14} className="animate-spin" /> Analyse en cours…</>
                    : <><Icon name="wand" size={14} /> Analyser mon CV</>}
                </button>
              </>
            )}

            {result && (
              <>
                {result.summary && (
                  <p className="text-sm mb-3 leading-relaxed" style={{ color: 'var(--c-body)' }}>{result.summary}</p>
                )}
                {result.items.length === 0 ? (
                  <div className="note note-success"><Icon name="checkCircle" size={14} /><span>Rien à alléger : toutes les informations semblent pertinentes.</span></div>
                ) : (
                  <>
                    <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--c-muted)' }}>
                      {selected.size} élément{selected.size > 1 ? 's' : ''} sélectionné{selected.size > 1 ? 's' : ''} à masquer
                    </p>
                    <ul className="flex flex-col gap-2">
                      {result.items.map(it => {
                        const key = `${it.field}:${it.index}`
                        const checked = selected.has(key)
                        return (
                          <li key={key}>
                            <label className="flex items-start gap-2.5 p-2.5 cursor-pointer transition-colors"
                              style={{ border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', background: checked ? 'var(--c-primary-light)' : '#fff' }}>
                              <input type="checkbox" checked={checked} onChange={() => toggle(key)}
                                className="mt-0.5 w-3.5 h-3.5 shrink-0" style={{ accentColor: 'var(--c-primary)' }} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="badge badge-neutral">{FIELD_LABELS[it.field] || it.field}</span>
                                  <span className="text-[11px] font-semibold" style={{ color: it.relevance < SUGGESTED_THRESHOLD ? 'var(--c-warn)' : 'var(--c-muted)' }}>
                                    pertinence {it.relevance}/100
                                  </span>
                                </div>
                                <p className="text-xs mt-1" style={{ color: 'var(--c-body)' }}>{it.reason}</p>
                              </div>
                            </label>
                          </li>
                        )
                      })}
                    </ul>
                  </>
                )}

                <div className="flex gap-2 mt-4">
                  <button type="button" onClick={apply} disabled={selected.size === 0} className="btn-primary flex-1">
                    <Icon name="eyeOff" size={14} /> Masquer {selected.size > 0 ? `(${selected.size})` : ''}
                  </button>
                  <button type="button" onClick={reset} className="btn-secondary">
                    Recommencer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
