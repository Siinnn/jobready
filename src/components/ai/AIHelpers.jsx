'use client'
import { useState } from 'react'
import Icon from '@/components/ui/Icon'

const TONES = [
  { id: 'percutant', label: 'Percutant' },
  { id: 'sobre',     label: 'Sobre' },
  { id: 'dynamique', label: 'Dynamique' },
]

// ─── Liste de propositions cliquables ────────────────────────────────────────
function SuggestionList({ suggestions, onPick }) {
  return (
    <ul className="flex flex-col gap-2 mt-3">
      {suggestions.map((s, i) => (
        <li key={i}>
          <button type="button" onClick={() => onPick(s)}
            className="w-full text-left text-sm p-3 leading-relaxed transition-colors bg-white"
            style={{ border: '1px solid var(--c-border-strong)', borderRadius: 'var(--r-md)', color: 'var(--c-body)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--c-primary)'; e.currentTarget.style.background = 'var(--c-primary-light)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border-strong)'; e.currentTarget.style.background = '#fff' }}>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide mb-1.5"
              style={{ color: 'var(--c-primary)' }}>
              Proposition {i + 1}
              <Icon name="arrowRight" size={11} />
              <span className="font-normal normal-case tracking-normal" style={{ color: 'var(--c-faint)' }}>
                cliquer pour utiliser ce texte
              </span>
            </span>
            {s}
          </button>
        </li>
      ))}
    </ul>
  )
}

// ─── Bouton « Reformuler » (accroche, descriptions…) ─────────────────────────
export function AIRewriteButton({ text, field, jobTitle, onApply }) {
  const [open, setOpen] = useState(false)
  const [tone, setTone] = useState('percutant')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [error, setError] = useState('')
  const [unavailable, setUnavailable] = useState(false)

  const run = async (t = tone) => {
    setLoading(true); setError(''); setSuggestions([])
    try {
      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, field, tone: t, jobTitle }),
      })
      const json = await res.json()
      if (!res.ok) {
        const err = new Error(json.error || 'Erreur serveur')
        // Ces deux cas ne sont pas des pannes : on les présente comme
        // une information, sans bouton « Réessayer » inutile.
        err.unavailable = json.code === 'AI_NOT_CONFIGURED' || json.code === 'RATE_LIMITED'
        throw err
      }
      setSuggestions(json.suggestions)
    } catch (e) {
      setError(e.message)
      setUnavailable(!!e.unavailable)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <button type="button" aria-expanded={open}
        onClick={() => { setOpen(!open); if (!open && suggestions.length === 0) run() }}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold transition-colors"
        style={{ background: 'var(--c-primary-light)', color: 'var(--c-primary)', borderRadius: 'var(--r-md)' }}>
        <Icon name="wand" size={13} /> Proposer des reformulations
      </button>

      {open && (
        <div className="mt-2 p-3"
          style={{ background: '#fbfcfd', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)' }}>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide mr-1" style={{ color: 'var(--c-muted)' }}>
              Ton
            </span>
            {TONES.map(t => (
              <button key={t.id} type="button" onClick={() => { setTone(t.id); run(t.id) }}
                aria-pressed={tone === t.id}
                className="px-2.5 py-1 text-xs font-semibold transition-colors"
                style={{
                  borderRadius: 'var(--r-sm)',
                  background: tone === t.id ? 'var(--c-primary)' : '#fff',
                  color: tone === t.id ? '#fff' : 'var(--c-body)',
                  border: `1px solid ${tone === t.id ? 'var(--c-primary)' : 'var(--c-border-strong)'}`,
                }}>
                {t.label}
              </button>
            ))}
            <button type="button" onClick={() => setOpen(false)}
              className="ml-auto text-xs flex items-center gap-1" style={{ color: 'var(--c-muted)' }}>
              <Icon name="close" size={12} /> Fermer
            </button>
          </div>

          {loading && (
            <p className="flex items-center gap-2 text-xs mt-3" style={{ color: 'var(--c-muted)' }}>
              <Icon name="clock" size={13} className="animate-spin" /> Rédaction de trois variantes…
            </p>
          )}
          {error && (
            unavailable ? (
              <div className="note mt-3">
                <Icon name="info" size={14} />
                <span>{error}</span>
              </div>
            ) : (
              <p className="text-xs mt-3" style={{ color: 'var(--c-danger)' }}>
                {error} <button type="button" className="underline" onClick={() => run()}>Réessayer</button>
              </p>
            )
          )}
          {!loading && suggestions.length > 0 && (
            <>
              <SuggestionList suggestions={suggestions} onPick={(s) => { onApply(s); setOpen(false); setSuggestions([]) }} />
              <p className="text-[11px] mt-2.5 leading-relaxed" style={{ color: 'var(--c-faint)' }}>
                Relisez toujours la proposition retenue : vous restez responsable de l'exactitude
                des informations de votre CV.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Générateur d'accroche guidé ─────────────────────────────────────────────
export function SummaryGenerator({ data, onApply, compact = false }) {
  const [open, setOpen] = useState(false)
  const [jobTitle, setJobTitle] = useState(data.title || '')
  const [years, setYears] = useState('')
  const [strengths, setStrengths] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [error, setError] = useState('')
  const [unavailable, setUnavailable] = useState(false)

  const run = async () => {
    setLoading(true); setError(''); setSuggestions([])
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'summary',
          payload: { jobTitle, years, strengths, experiences: data.experiences || [] },
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        const err = new Error(json.error || 'Erreur serveur')
        // Ces deux cas ne sont pas des pannes : on les présente comme
        // une information, sans bouton « Réessayer » inutile.
        err.unavailable = json.code === 'AI_NOT_CONFIGURED' || json.code === 'RATE_LIMITED'
        throw err
      }
      setSuggestions(json.suggestions)
    } catch (e) {
      setError(e.message)
      setUnavailable(!!e.unavailable)
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className={`w-full flex items-center justify-center gap-2 font-semibold transition-colors ${compact ? 'py-2.5 text-xs' : 'py-3 text-sm'}`}
        style={{
          border: '1px dashed var(--c-border-strong)', borderRadius: 'var(--r-md)',
          color: 'var(--c-primary)', background: '#fbfcfd',
        }}>
        <Icon name="wand" size={15} />
        {data.summary ? 'Proposer une autre accroche' : "Vous ne savez pas quoi écrire ? Rédiger l'accroche avec vous"}
      </button>
    )
  }

  return (
    <div className="p-4" style={{ background: '#fbfcfd', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)' }}>
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Icon name="wand" size={15} style={{ color: 'var(--c-primary)' }} /> Aide à la rédaction de l'accroche
        </h3>
        <button type="button" onClick={() => setOpen(false)} style={{ color: 'var(--c-muted)' }} title="Fermer">
          <Icon name="close" size={14} />
        </button>
      </div>
      <p className="text-xs mb-3.5 leading-relaxed" style={{ color: 'var(--c-muted)' }}>
        Répondez à ces trois questions : trois accroches vous seront proposées, à ajuster ensuite librement.
      </p>
      <div className="flex flex-col gap-2.5">
        <div>
          <label className="label">1. Quel poste visez-vous ?</label>
          <input className="input !text-sm" placeholder="Ex : vendeur en magasin"
            value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
        </div>
        <div>
          <label className="label">2. Quelle est votre expérience dans ce domaine ?</label>
          <input className="input !text-sm" placeholder="Ex : 3 ans, débutant, en reconversion…"
            value={years} onChange={e => setYears(e.target.value)} />
        </div>
        <div>
          <label className="label">3. Vos deux principaux points forts ?</label>
          <input className="input !text-sm" placeholder="Ex : sens du contact, rigueur"
            value={strengths} onChange={e => setStrengths(e.target.value)} />
        </div>
        <button type="button" onClick={run} disabled={loading || !jobTitle.trim()} className="btn-primary !py-2 mt-1">
          {loading
            ? <><Icon name="clock" size={14} className="animate-spin" /> Rédaction en cours…</>
            : 'Proposer trois accroches'}
        </button>
      </div>
      {error && (
        unavailable ? (
          <div className="note mt-3"><Icon name="info" size={14} /><span>{error}</span></div>
        ) : (
          <p className="text-xs mt-2" style={{ color: 'var(--c-danger)' }}>{error}</p>
        )
      )}
      {suggestions.length > 0 && (
        <SuggestionList suggestions={suggestions} onPick={(s) => { onApply(s); setOpen(false); setSuggestions([]) }} />
      )}
    </div>
  )
}
