'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { scoreCv } from '@/lib/cvScore'
import Icon from '@/components/ui/Icon'

// Contrôle qualité du CV : score global, score ATS, et points à corriger.
// onGoto(sectionId) ouvre la rubrique concernée dans l'onglet Contenu.
export default function CvCoach({ cv, onGoto }) {
  const router = useRouter()
  const { score, atsScore, checks, level, atsLevel } = useMemo(() => scoreCv(cv), [cv])
  const [filter, setFilter] = useState('all') // all | contenu | ats

  const shown = filter === 'all' ? checks : checks.filter(c => c.cat === filter)
  const todo = shown.filter(c => !c.ok)
  const done = shown.filter(c => c.ok)

  return (
    <div>
      {/* Deux scores */}
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        <ScoreCard label="Qualité générale" score={score} level={level} />
        <ScoreCard label="Lisibilité ATS" score={atsScore} level={atsLevel} icon="shield" />
      </div>

      <button onClick={() => router.push('/guide-ats')}
        className="w-full flex items-center gap-2 text-xs p-2.5 mb-5 transition-colors"
        style={{ background: 'var(--c-primary-light)', color: 'var(--c-primary)', borderRadius: 'var(--r-md)' }}>
        <Icon name="info" size={14} />
        <span className="text-left flex-1">Qu'est-ce qu'un CV « compatible ATS » ? Lire le guide</span>
        <Icon name="chevronRight" size={13} />
      </button>

      {/* Filtres */}
      <div className="flex gap-1 mb-4 p-1 w-fit" style={{ background: '#eef1f5', borderRadius: 'var(--r-md)' }}>
        {[['all', 'Tout'], ['contenu', 'Contenu'], ['ats', 'ATS']].map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id)} aria-pressed={filter === id}
            className="px-2.5 py-1 text-xs font-semibold transition-colors"
            style={{
              borderRadius: 'var(--r-sm)',
              background: filter === id ? 'var(--c-surface)' : 'transparent',
              color: filter === id ? 'var(--c-primary)' : 'var(--c-muted)',
              boxShadow: filter === id ? '0 1px 2px rgba(18,33,61,.08)' : 'none',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Points à corriger */}
      {todo.length > 0 ? (
        <section className="mb-6">
          <h3 className="label flex items-center gap-1.5">
            <Icon name="alert" size={13} style={{ color: 'var(--c-warn)' }} />
            {todo.length} point{todo.length > 1 ? 's' : ''} à améliorer
          </h3>
          <ul className="flex flex-col gap-2">
            {todo.map(c => (
              <li key={c.id}>
                <button onClick={() => onGoto?.(c.section)}
                  className="w-full text-left p-3 transition-colors"
                  style={{ background: 'var(--c-warn-bg)', border: '1px solid #ecd9b4', borderRadius: 'var(--r-md)' }}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold" style={{ color: 'var(--c-ink)' }}>{c.label}</span>
                    {c.cat === 'ats' && <span className="badge badge-neutral shrink-0">ATS</span>}
                  </div>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--c-body)' }}>{c.advice}</p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold mt-1.5" style={{ color: 'var(--c-primary)' }}>
                    Corriger cette rubrique <Icon name="arrowRight" size={11} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <div className="note note-success mb-6">
          <Icon name="checkCircle" size={15} />
          <span>Tous les contrôles de cette catégorie sont validés. Votre CV est prêt à être exporté.</span>
        </div>
      )}

      {/* Validé */}
      {done.length > 0 && (
        <section>
          <h3 className="label flex items-center gap-1.5">
            <Icon name="check" size={13} style={{ color: 'var(--c-success)' }} />
            Validé ({done.length})
          </h3>
          <ul className="flex flex-col">
            {done.map(c => (
              <li key={c.id} className="flex items-center gap-2 py-1 text-xs" style={{ color: 'var(--c-muted)' }}>
                <Icon name="check" size={12} style={{ color: 'var(--c-success)' }} />
                <span className="flex-1">{c.label}</span>
                {c.cat === 'ats' && <span className="badge badge-neutral">ATS</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-[11px] mt-6 leading-relaxed" style={{ color: 'var(--c-faint)' }}>
        Ces vérifications reprennent les recommandations courantes des recruteurs et le
        fonctionnement connu des logiciels de suivi de candidatures. Elles se recalculent
        à chaque modification, sans envoi de données.
      </p>
    </div>
  )
}

function ScoreCard({ label, score, level, icon }) {
  return (
    <div className="p-3" style={{ border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)' }}>
      <div className="flex items-center gap-1.5 mb-2">
        {icon && <Icon name={icon} size={13} style={{ color: 'var(--c-muted)' }} />}
        <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--c-muted)' }}>
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold" style={{ color: level.color }}>{score}</span>
        <span className="text-xs" style={{ color: 'var(--c-faint)' }}>/100</span>
      </div>
      <div className="h-1.5 mt-2 overflow-hidden" style={{ background: '#eef1f5', borderRadius: 99 }}>
        <div style={{ width: `${score}%`, height: '100%', background: level.color, transition: 'width .3s' }} />
      </div>
      <p className="text-[11px] mt-1.5 font-medium" style={{ color: level.color }}>{level.label}</p>
    </div>
  )
}
