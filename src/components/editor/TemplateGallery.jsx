'use client'
import { useState } from 'react'
import CVPreview, { A4_W, A4_H } from '@/components/cv/CVPreview'
import { TEMPLATE_LIST, TEMPLATE_TAGS, DEMO_DATA } from '@/templates'
import { DEFAULT_SECTIONS } from '@/lib/cvModel'
import Icon from '@/components/ui/Icon'

// Galerie de modèles avec miniatures live.
// data : données à afficher dans les miniatures (par défaut, profil de démo)
export default function TemplateGallery({ selectedId, onSelect, data, accent, compact = false }) {
  const [tag, setTag] = useState('all')
  const list = tag === 'all' ? TEMPLATE_LIST : TEMPLATE_LIST.filter(t => t.tags.includes(tag))
  const miniScale = compact ? 0.24 : 0.3
  const previewData = data && (data.firstName || data.lastName || (data.experiences || []).length) ? data : DEMO_DATA

  return (
    <div>
      {/* Filtres */}
      <div className="flex flex-wrap gap-1.5 mb-4" role="group" aria-label="Filtrer les modèles">
        {TEMPLATE_TAGS.map(t => {
          const sel = tag === t.id
          return (
            <button key={t.id} onClick={() => setTag(t.id)} aria-pressed={sel}
              className="px-2.5 py-1.5 text-xs font-semibold transition-colors"
              style={{
                borderRadius: 'var(--r-md)',
                background: sel ? 'var(--c-primary)' : '#eef1f5',
                color: sel ? '#fff' : 'var(--c-body)',
              }}>
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Miniatures */}
      <div className={`grid gap-3.5 ${compact ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`}>
        {list.map(tpl => {
          const sel = selectedId === tpl.id
          const oneCol = tpl.layout === 'single'
          return (
            <button key={tpl.id} onClick={() => onSelect(tpl.id)} aria-pressed={sel}
              className="text-left overflow-hidden transition-shadow bg-white hover:shadow-md"
              style={{
                border: `1px solid ${sel ? 'var(--c-primary)' : 'var(--c-border)'}`,
                borderRadius: 'var(--r-lg)',
                boxShadow: sel ? '0 0 0 2px var(--c-primary-light)' : undefined,
              }}>
              <div className="relative overflow-hidden"
                style={{ height: A4_H * miniScale, background: '#eef1f5', borderBottom: '1px solid var(--c-border)' }}>
                <div style={{ transform: `scale(${miniScale})`, transformOrigin: 'top left', width: A4_W, pointerEvents: 'none' }}>
                  <CVPreview
                    id={`mini-${tpl.id}`}
                    cv={{
                      templateId: tpl.id,
                      theme: { accent: accent || null, font: null, fontSize: 1, spacing: 1 },
                      data: previewData,
                      sections: DEFAULT_SECTIONS,
                    }}
                  />
                </div>
                {sel && (
                  <span className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center text-white"
                    style={{ background: 'var(--c-primary)', borderRadius: 'var(--r-sm)' }}>
                    <Icon name="check" size={12} strokeWidth={2.6} />
                  </span>
                )}
              </div>
              <div className="px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold" style={{ color: 'var(--c-ink)' }}>{tpl.name}</span>
                  {oneCol && (
                    <span className="badge badge-success !text-[10px] gap-1" title="Une seule colonne : mieux lu par les logiciels de recrutement">
                      <Icon name="shield" size={9} strokeWidth={2.2} /> ATS
                    </span>
                  )}
                </div>
                {!compact && (
                  <p className="text-xs mt-1 leading-snug" style={{ color: 'var(--c-muted)' }}>{tpl.description}</p>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
