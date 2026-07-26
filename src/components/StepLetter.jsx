'use client'
import { useState, useRef } from 'react'
import Icon from '@/components/ui/Icon'

export default function StepLetter({ profile, onDone, onSkip }) {
  const [mode, setMode] = useState('upload')
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  const accept = (f) => {
    if (f && f.type === 'application/pdf') { setFile(f); setError('') }
    else setError('Seuls les fichiers PDF sont acceptés.')
  }

  const analyze = async () => {
    setLoading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('type', 'letter')
      if (mode === 'upload' && file) fd.append('file', file)
      else if (mode === 'paste' && text.trim()) fd.append('text', text)
      else { setError('Ajoutez votre lettre avant de continuer.'); setLoading(false); return }

      const res = await fetch('/api/analyze-cv', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur serveur')
      onDone(json.data, json.rawText)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-6 max-w-2xl mx-auto">
      {/* Rappel du profil */}
      {profile?.firstName && (
        <div className="note note-info mb-5">
          <Icon name="user" size={15} />
          <span>
            Profil utilisé : <strong>{profile.firstName} {profile.lastName}</strong>
            {profile.title ? ` — ${profile.title}` : ''}
          </span>
        </div>
      )}

      <h1 className="text-lg font-semibold mb-1.5">Votre lettre de motivation type</h1>
      <p className="text-sm mb-5" style={{ color: 'var(--c-muted)' }}>
        Déposez une lettre que vous avez déjà écrite : son style et son ton sont analysés
        pour rédiger ensuite des lettres qui vous ressemblent. Cette étape est facultative.
      </p>

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
              <p className="text-xs" style={{ color: 'var(--c-muted)' }}>{(file.size / 1024).toFixed(0)} Ko</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Icon name="mail" size={24} style={{ color: 'var(--c-muted)' }} />
              <p className="font-semibold text-sm" style={{ color: 'var(--c-ink)' }}>
                Glissez votre lettre ici, ou cliquez pour la choisir
              </p>
              <p className="text-xs" style={{ color: 'var(--c-muted)' }}>
                Format PDF · le style et le ton sont analysés automatiquement
              </p>
            </div>
          )}
        </div>
      )}

      {mode === 'paste' && (
        <textarea
          className="input h-48 resize-y"
          placeholder="Collez ici le texte de votre lettre de motivation type…"
          value={text}
          onChange={e => setText(e.target.value)}
        />
      )}

      {error && (
        <div className="note note-warn mt-4">
          <Icon name="alert" size={15} />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-2 mt-5">
        <button onClick={analyze} disabled={loading || (mode === 'upload' ? !file : !text.trim())}
          className="btn-primary flex-1">
          {loading
            ? <><Icon name="clock" size={15} className="animate-spin" /> Analyse en cours…</>
            : <><Icon name="search" size={15} /> Analyser ma lettre</>}
        </button>
        <button onClick={onSkip} className="btn-secondary">
          Passer cette étape
        </button>
      </div>
    </div>
  )
}
