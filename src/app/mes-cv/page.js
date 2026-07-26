'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import CVPreview, { A4_W, A4_H } from '@/components/cv/CVPreview'
import AppHeader from '@/components/ui/AppHeader'
import Icon from '@/components/ui/Icon'
import { getTemplate } from '@/templates'
import { scoreCv } from '@/lib/cvScore'
import { createDemoCv } from '@/lib/demoData'

export default function MesCvPage() {
  const router = useRouter()
  const { cvs, activeCvId, setActiveCvId, removeCv, duplicateCvById, updateCv, createCv, isInitialized } = useApp()
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

  const open = (id) => { setActiveCvId(id); router.push('/editeur') }
  const scale = 0.23

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold">Mes CV</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--c-muted)' }}>
              {cvs.length === 0
                ? 'Aucun CV enregistré pour le moment.'
                : `${cvs.length} CV enregistré${cvs.length > 1 ? 's' : ''} sur cet appareil.`}
            </p>
          </div>
        </div>

        {cvs.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-12 h-12 mx-auto flex items-center justify-center mb-4"
              style={{ background: 'var(--c-primary-light)', color: 'var(--c-primary)', borderRadius: 'var(--r-md)' }}>
              <Icon name="files" size={22} />
            </div>
            <h2 className="text-base font-semibold mb-1.5">Commencez votre premier CV</h2>
            <p className="text-sm mb-6 max-w-md mx-auto leading-relaxed" style={{ color: 'var(--c-muted)' }}>
              Créez un CV de zéro avec un parcours guidé, ou importez un CV existant
              au format PDF pour le reprendre et l'améliorer.
            </p>
            <div className="flex flex-wrap justify-center gap-2.5">
              <button onClick={() => router.push('/creer')} className="btn-primary">
                <Icon name="plus" size={15} /> Créer un CV
              </button>
              <button onClick={() => router.push('/importer')} className="btn-secondary">
                <Icon name="upload" size={15} /> Importer un CV
              </button>
            </div>
            <div className="mt-6 pt-5 max-w-md mx-auto" style={{ borderTop: '1px solid var(--c-border)' }}>
              <p className="text-xs mb-2.5" style={{ color: 'var(--c-muted)' }}>
                Vous voulez d'abord voir à quoi ressemble le résultat ?
              </p>
              <button onClick={() => { const cv = createDemoCv(); createCv(cv); router.push('/editeur') }}
                className="btn-secondary">
                <Icon name="eye" size={15} /> Charger un CV d'exemple
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {cvs.map(cv => {
              const tpl = getTemplate(cv.templateId)
              const { score, level } = scoreCv(cv)
              const isActive = cv.id === activeCvId
              return (
                <article key={cv.id} className="card overflow-hidden flex flex-col transition-shadow hover:shadow-md"
                  style={isActive ? { borderColor: 'var(--c-primary-border)' } : undefined}>
                  {/* Aperçu */}
                  <button onClick={() => open(cv.id)} title={`Ouvrir « ${cv.name} »`}
                    className="relative block w-full overflow-hidden"
                    style={{ height: A4_H * scale, background: '#eef1f5', borderBottom: '1px solid var(--c-border)' }}>
                    <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: A4_W, pointerEvents: 'none' }}>
                      <CVPreview id={`thumb-${cv.id}`} cv={cv} />
                    </div>
                    <span className="absolute top-2 left-2 badge"
                      style={{ background: 'rgba(255,255,255,.94)', color: level.color, border: `1px solid ${level.color}33` }}>
                      {score}/100
                    </span>
                  </button>

                  {/* Informations */}
                  <div className="p-3 flex flex-col flex-1">
                    {renaming === cv.id ? (
                      <input autoFocus className="input !py-1 !text-sm mb-1.5" value={draftName}
                        onChange={e => setDraftName(e.target.value)}
                        onBlur={() => { updateCv(cv.id, { name: draftName.trim() || cv.name }); setRenaming(null) }}
                        onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setRenaming(null) }} />
                    ) : (
                      <button className="text-sm font-semibold truncate text-left" title="Cliquer pour renommer"
                        style={{ color: 'var(--c-ink)' }}
                        onClick={() => { setRenaming(cv.id); setDraftName(cv.name) }}>
                        {cv.name}
                      </button>
                    )}
                    <p className="text-xs mt-0.5 mb-3" style={{ color: 'var(--c-faint)' }}>
                      {tpl.name} · {new Date(cv.updatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>

                    {confirmDelete === cv.id ? (
                      <div className="mt-auto">
                        <p className="text-xs mb-2" style={{ color: 'var(--c-danger)' }}>Supprimer définitivement ?</p>
                        <div className="flex gap-1.5">
                          <button onClick={() => { removeCv(cv.id); setConfirmDelete(null) }}
                            className="flex-1 py-1.5 text-xs font-semibold text-white"
                            style={{ background: 'var(--c-danger)', borderRadius: 'var(--r-md)' }}>Supprimer</button>
                          <button onClick={() => setConfirmDelete(null)}
                            className="flex-1 py-1.5 text-xs font-semibold"
                            style={{ background: '#eef1f5', borderRadius: 'var(--r-md)' }}>Annuler</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-1.5 mt-auto">
                        <button onClick={() => open(cv.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-white"
                          style={{ background: 'var(--c-primary)', borderRadius: 'var(--r-md)' }}>
                          <Icon name="pencil" size={13} /> Modifier
                        </button>
                        <button onClick={() => duplicateCvById(cv.id)} title="Dupliquer"
                          className="px-2 py-1.5" style={{ background: '#eef1f5', borderRadius: 'var(--r-md)', color: 'var(--c-body)' }}>
                          <Icon name="copy" size={13} />
                        </button>
                        <button onClick={() => setConfirmDelete(cv.id)} title="Supprimer"
                          className="px-2 py-1.5" style={{ background: '#eef1f5', borderRadius: 'var(--r-md)', color: 'var(--c-body)' }}>
                          <Icon name="trash" size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              )
            })}

            {/* Nouveau CV */}
            <button onClick={() => router.push('/creer')}
              className="flex flex-col items-center justify-center gap-2 min-h-[300px] transition-colors"
              style={{ border: '1px dashed var(--c-border-strong)', borderRadius: 'var(--r-lg)', color: 'var(--c-muted)' }}>
              <Icon name="plus" size={22} />
              <span className="text-sm font-semibold">Nouveau CV</span>
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
