'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import LetterPreview, { A4_W, A4_H } from '@/components/letter/LetterPreview'
import AppHeader from '@/components/ui/AppHeader'
import Icon from '@/components/ui/Icon'
import { letterWordCount, defaultSubject } from '@/lib/letterModel'
import { createDemoLetter } from '@/lib/demoData'

export default function MesLettresPage() {
  const router = useRouter()
  const { letters, activeLetterId, setActiveLetterId, removeLetter, duplicateLetterById, updateLetter, createLetter, isInitialized } = useApp()
  const [renaming, setRenaming] = useState(null)
  const [draftName, setDraftName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon name="clock" size={28} className="animate-spin" style={{ color: 'var(--c-muted)' }} />
      </div>
    )
  }

  const open = (id) => { setActiveLetterId(id); router.push('/lettres/editeur') }
  const scale = 0.23

  return (
    <div className="min-h-screen">
      <AppHeader actions={
        <button onClick={() => router.push('/lettres/creer')} className="btn-primary">
          <Icon name="plus" size={15} /> Nouvelle lettre
        </button>
      } />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold">Mes lettres de motivation</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--c-muted)' }}>
            {letters.length === 0
              ? 'Aucune lettre enregistrée pour le moment.'
              : `${letters.length} lettre${letters.length > 1 ? 's' : ''} enregistrée${letters.length > 1 ? 's' : ''} sur cet appareil.`}
          </p>
        </div>

        {letters.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-12 h-12 mx-auto flex items-center justify-center mb-4"
              style={{ background: 'var(--c-primary-light)', color: 'var(--c-primary)', borderRadius: 'var(--r-md)' }}>
              <Icon name="mail" size={22} />
            </div>
            <h2 className="text-base font-semibold mb-1.5">Rédigez votre première lettre</h2>
            <p className="text-sm mb-6 max-w-md mx-auto leading-relaxed" style={{ color: 'var(--c-muted)' }}>
              Un parcours guidé vous demande à qui vous écrivez et pour quel poste, puis vous
              aide à rédiger chaque paragraphe. Vos informations peuvent être reprises
              directement d'un de vos CV.
            </p>
            <button onClick={() => router.push('/lettres/creer')} className="btn-primary">
              <Icon name="plus" size={15} /> Créer une lettre
            </button>
            <div className="mt-6 pt-5 max-w-md mx-auto" style={{ borderTop: '1px solid var(--c-border)' }}>
              <p className="text-xs mb-2.5" style={{ color: 'var(--c-muted)' }}>
                Vous voulez d'abord voir un exemple de lettre complète ?
              </p>
              <button onClick={() => { createLetter(createDemoLetter()); router.push('/lettres/editeur') }}
                className="btn-secondary">
                <Icon name="eye" size={15} /> Charger une lettre d'exemple
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {letters.map(letter => {
              const words = letterWordCount(letter)
              const isActive = letter.id === activeLetterId
              const target = letter.recipient?.company || letter.job?.title || 'Destinataire à préciser'
              return (
                <article key={letter.id} className="card overflow-hidden flex flex-col transition-shadow hover:shadow-md"
                  style={isActive ? { borderColor: 'var(--c-primary-border)' } : undefined}>
                  <button onClick={() => open(letter.id)} title={`Ouvrir « ${letter.name} »`}
                    className="relative block w-full overflow-hidden"
                    style={{ height: A4_H * scale, background: '#eef1f5', borderBottom: '1px solid var(--c-border)' }}>
                    <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: A4_W, pointerEvents: 'none' }}>
                      <LetterPreview id={`thumb-lt-${letter.id}`} letter={letter} />
                    </div>
                    <span className="absolute top-2 left-2 badge"
                      style={{
                        background: 'rgba(255,255,255,.94)',
                        color: words < 150 ? 'var(--c-warn)' : words > 380 ? 'var(--c-warn)' : 'var(--c-success)',
                        border: '1px solid var(--c-border)',
                      }}>
                      {words} mots
                    </span>
                  </button>

                  <div className="p-3 flex flex-col flex-1">
                    {renaming === letter.id ? (
                      <input autoFocus className="input !py-1 !text-sm mb-1.5" value={draftName}
                        onChange={e => setDraftName(e.target.value)}
                        onBlur={() => { updateLetter(letter.id, { name: draftName.trim() || letter.name }); setRenaming(null) }}
                        onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setRenaming(null) }} />
                    ) : (
                      <button className="text-sm font-semibold truncate text-left" title="Cliquer pour renommer"
                        style={{ color: 'var(--c-ink)' }}
                        onClick={() => { setRenaming(letter.id); setDraftName(letter.name) }}>
                        {letter.name}
                      </button>
                    )}
                    <p className="text-xs mt-0.5 mb-3 truncate" style={{ color: 'var(--c-faint)' }}>
                      {target} · {new Date(letter.updatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </p>

                    {confirmDelete === letter.id ? (
                      <div className="mt-auto">
                        <p className="text-xs mb-2" style={{ color: 'var(--c-danger)' }}>Supprimer définitivement ?</p>
                        <div className="flex gap-1.5">
                          <button onClick={() => { removeLetter(letter.id); setConfirmDelete(null) }}
                            className="flex-1 py-1.5 text-xs font-semibold text-white"
                            style={{ background: 'var(--c-danger)', borderRadius: 'var(--r-md)' }}>Supprimer</button>
                          <button onClick={() => setConfirmDelete(null)}
                            className="flex-1 py-1.5 text-xs font-semibold"
                            style={{ background: '#eef1f5', borderRadius: 'var(--r-md)' }}>Annuler</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-1.5 mt-auto">
                        <button onClick={() => open(letter.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-white"
                          style={{ background: 'var(--c-primary)', borderRadius: 'var(--r-md)' }}>
                          <Icon name="pencil" size={13} /> Modifier
                        </button>
                        <button onClick={() => duplicateLetterById(letter.id)} title="Dupliquer pour une autre entreprise"
                          className="px-2 py-1.5" style={{ background: '#eef1f5', borderRadius: 'var(--r-md)', color: 'var(--c-body)' }}>
                          <Icon name="copy" size={13} />
                        </button>
                        <button onClick={() => setConfirmDelete(letter.id)} title="Supprimer"
                          className="px-2 py-1.5" style={{ background: '#eef1f5', borderRadius: 'var(--r-md)', color: 'var(--c-body)' }}>
                          <Icon name="trash" size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              )
            })}

            <button onClick={() => router.push('/lettres/creer')}
              className="flex flex-col items-center justify-center gap-2 min-h-[300px] transition-colors"
              style={{ border: '1px dashed var(--c-border-strong)', borderRadius: 'var(--r-lg)', color: 'var(--c-muted)' }}>
              <Icon name="plus" size={22} />
              <span className="text-sm font-semibold">Nouvelle lettre</span>
            </button>
          </div>
        )}

        {letters.length > 0 && (
          <p className="note mt-6 max-w-3xl">
            <Icon name="info" size={15} />
            <span>
              Astuce : dupliquez une lettre existante pour candidater ailleurs — il ne vous
              restera qu'à changer l'entreprise, le poste et le paragraphe de motivation.
            </span>
          </p>
        )}
      </main>
    </div>
  )
}
