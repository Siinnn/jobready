'use client'
import { useState, useRef } from 'react'
import Icon from '@/components/ui/Icon'

export default function StepCV({ onDone }) {
  const [mode, setMode] = useState('upload') // 'upload' | 'paste'
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null) // { data, rawText, report, notice }
  const fileRef = useRef()

  const accept = (f) => {
    if (!f) return
    if (f.type === 'application/pdf' || /\.pdf$/i.test(f.name)) { setFile(f); setError('') }
    else setError("Seuls les fichiers PDF sont acceptés. Si votre CV est un fichier Word, enregistrez-le d'abord en PDF (Fichier → Enregistrer sous → PDF).")
  }

  const analyze = async () => {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const fd = new FormData()
      fd.append('type', 'cv')
      if (mode === 'upload' && file) fd.append('file', file)
      else if (mode === 'paste' && text.trim()) fd.append('text', text)
      else {
        setError('Ajoutez votre CV avant de continuer.')
        setLoading(false)
        return
      }

      const res = await fetch('/api/analyze-cv', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "L'analyse a échoué. Réessayez dans un instant.")
      // json.code peut valoir RATE_LIMITED : le message serveur est déjà explicite
      // On montre le bilan avant de basculer vers l'éditeur
      setResult(json)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Bilan de l'import ──
  if (result) {
    const { report, notice, data } = result
    return (
      <div className="card p-6 max-w-2xl mx-auto">
        <div className="flex items-start gap-3 mb-5">
          <Icon name="checkCircle" size={22} style={{ color: 'var(--c-success)', marginTop: 2 }} />
          <div>
            <h1 className="text-lg font-semibold">CV analysé</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--c-muted)' }}>
              {report?.score >= 70
                ? "L'essentiel de votre CV a été récupéré. Vérifiez les informations, puis complétez ce qui manque."
                : "Une partie des informations a été récupérée. Il vous restera quelques rubriques à compléter."}
            </p>
          </div>
        </div>

        {notice && (
          <div className="note note-warn mb-4">
            <Icon name="alert" size={15} />
            <span>{notice}</span>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4 mb-5">
          <ReportList title="Récupéré" items={report?.filled} icon="check" color="var(--c-success)" />
          <ReportList title="À compléter" items={report?.missing} icon="alert" color="var(--c-warn)"
            empty="Toutes les rubriques sont renseignées." />
        </div>

        {(data?.experiences?.length > 0) && (
          <div className="note mb-5">
            <Icon name="briefcase" size={15} />
            <span>
              {data.experiences.length} expérience{data.experiences.length > 1 ? 's' : ''} et{' '}
              {data.education?.length || 0} formation{(data.education?.length || 0) > 1 ? 's' : ''} détectées.
              Contrôlez surtout les <strong>dates</strong> et les <strong>intitulés de poste</strong> :
              ce sont les éléments les plus souvent mal reconnus.
            </span>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={() => onDone(result.data, result.rawText)} className="btn-primary flex-1">
            <Icon name="pencil" size={15} /> Ouvrir dans l'éditeur
          </button>
          <button onClick={() => { setResult(null); setFile(null); setText('') }} className="btn-secondary">
            Recommencer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6 max-w-2xl mx-auto">
      <h1 className="text-lg font-semibold mb-1.5">Importer un CV existant</h1>
      <p className="text-sm mb-5" style={{ color: 'var(--c-muted)' }}>
        Le contenu est analysé automatiquement pour pré-remplir les rubriques.
        Vous pourrez ensuite tout relire, corriger et compléter dans l'éditeur.
      </p>

      {/* Choix du mode */}
      <div className="flex gap-1 mb-5 p-1 w-fit" style={{ background: '#eef1f5', borderRadius: 'var(--r-md)' }}>
        {[['upload', 'upload', 'Fichier PDF'], ['paste', 'pencil', 'Coller le texte']].map(([m, icon, label]) => (
          <button key={m} onClick={() => setMode(m)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold transition-colors"
            style={{
              borderRadius: 'var(--r-sm)',
              background: mode === m ? 'var(--c-surface)' : 'transparent',
              color: mode === m ? 'var(--c-primary)' : 'var(--c-muted)',
              boxShadow: mode === m ? '0 1px 2px rgba(18,33,61,.08)' : 'none',
            }}>
            <Icon name={icon} size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Dépôt de fichier */}
      {mode === 'upload' && (
        <div
          role="button" tabIndex={0}
          onClick={() => fileRef.current?.click()}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); accept(e.dataTransfer.files?.[0]) }}
          className="p-8 text-center cursor-pointer transition-colors"
          style={{
            border: `1px dashed ${file ? 'var(--c-success)' : 'var(--c-border-strong)'}`,
            borderRadius: 'var(--r-md)',
            background: file ? 'var(--c-success-bg)' : '#fbfcfd',
          }}
        >
          <input ref={fileRef} type="file" accept=".pdf" className="hidden"
            onChange={e => accept(e.target.files?.[0])} />
          {file ? (
            <div className="flex flex-col items-center gap-1.5">
              <Icon name="checkCircle" size={26} style={{ color: 'var(--c-success)' }} />
              <p className="font-semibold text-sm" style={{ color: 'var(--c-success)' }}>{file.name}</p>
              <p className="text-xs" style={{ color: 'var(--c-muted)' }}>
                {(file.size / 1024).toFixed(0)} Ko · prêt à être analysé
              </p>
              <button className="text-xs underline mt-1" style={{ color: 'var(--c-muted)' }}
                onClick={e => { e.stopPropagation(); setFile(null) }}>
                Choisir un autre fichier
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Icon name="upload" size={24} style={{ color: 'var(--c-muted)' }} />
              <p className="font-semibold text-sm" style={{ color: 'var(--c-ink)' }}>
                Glissez votre CV ici, ou cliquez pour le choisir
              </p>
              <p className="text-xs" style={{ color: 'var(--c-muted)' }}>Format PDF · 10 Mo maximum</p>
            </div>
          )}
        </div>
      )}

      {/* Collage de texte */}
      {mode === 'paste' && (
        <textarea
          className="input h-48 resize-y"
          placeholder="Collez ici le texte complet de votre CV…"
          value={text}
          onChange={e => setText(e.target.value)}
        />
      )}

      {error && (
        <div className="note note-warn mt-4">
          <Icon name="alert" size={15} />
          <span>
            {error}
            <br />
            Vous pouvez aussi{' '}
            <a href="/creer" className="underline font-semibold" style={{ color: 'inherit' }}>
              créer votre CV étape par étape
            </a>{' '}
            : c'est guidé et cela fonctionne toujours.
          </span>
        </div>
      )}

      <button
        onClick={analyze}
        disabled={loading || (mode === 'upload' ? !file : !text.trim())}
        className="btn-primary mt-5 w-full"
      >
        {loading ? (
          <><Icon name="clock" size={15} className="animate-spin" /> Analyse du CV en cours…</>
        ) : (
          <><Icon name="search" size={15} /> Analyser mon CV</>
        )}
      </button>

      <p className="hint mt-3 text-center">
        Vos données restent sur votre appareil ; seul le texte du CV est envoyé pour l'analyse, sans être conservé.
      </p>
    </div>
  )
}

function ReportList({ title, items = [], icon, color, empty }) {
  return (
    <div>
      <h2 className="label flex items-center gap-1.5">
        <Icon name={icon} size={13} style={{ color }} /> {title}
      </h2>
      {items.length === 0 ? (
        <p className="text-xs" style={{ color: 'var(--c-faint)' }}>{empty || '—'}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map(i => (
            <li key={i} className="flex items-start gap-1.5 text-xs" style={{ color: 'var(--c-body)' }}>
              <Icon name={icon} size={11} style={{ color, marginTop: 3 }} />
              <span>{i}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
