'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import CVPreview from '@/components/cv/CVPreview'
import SectionForm from '@/components/editor/SectionForms'
import TemplateGallery from '@/components/editor/TemplateGallery'
import CvCoach from '@/components/ai/CvCoach'
import CvTrimmer from '@/components/ai/CvTrimmer'
import Icon from '@/components/ui/Icon'
import useDragList, { dragStyle } from '@/components/ui/useDragList'
import ExportPdfButton from '@/components/ui/ExportPdfButton'
import { SECTION_TYPES, FONTS } from '@/lib/cvModel'
import { getTemplate, getAccent } from '@/templates'
import { scoreCv } from '@/lib/cvScore'

const ACCENTS = [
  { v: '#1f3a68', n: 'Bleu marine' }, { v: '#2563eb', n: 'Bleu' },
  { v: '#0f766e', n: 'Vert-bleu' },   { v: '#1c6b4a', n: 'Vert' },
  { v: '#4338ca', n: 'Indigo' },      { v: '#7c3aed', n: 'Violet' },
  { v: '#9c2c2c', n: 'Rouge' },       { v: '#475569', n: 'Gris ardoise' },
  { v: '#111827', n: 'Noir' },
]

const TABS = [
  { id: 'content',  label: 'Contenu',  icon: 'pencil' },
  { id: 'template', label: 'Modèle',   icon: 'layout' },
  { id: 'style',    label: 'Style',    icon: 'sliders' },
  { id: 'check',    label: 'Contrôle', icon: 'shield' },
]

// Correspondance rubrique → icône au trait
const SECTION_ICON = {
  header: 'user', summary: 'pencil', experience: 'briefcase', education: 'cap',
  skills: 'tools', languages: 'globe', projects: 'rocket',
  certifications: 'award', volunteering: 'heart', interests: 'star',
}

export default function EditeurPage() {
  const router = useRouter()
  const { activeCv, updateCv, isInitialized } = useApp()
  const [tab, setTab] = useState('content')
  const [openSection, setOpenSection] = useState('header')
  const [zoom, setZoom] = useState(0.7)
  const [pageInfo, setPageInfo] = useState({ pages: 1 })

  useEffect(() => {
    if (isInitialized && !activeCv) router.push('/mes-cv')
  }, [isInitialized, activeCv, router])

  if (!isInitialized || !activeCv) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon name="clock" size={28} className="animate-spin" style={{ color: 'var(--c-muted)' }} />
      </div>
    )
  }

  const cv = activeCv
  const tpl = getTemplate(cv.templateId)
  const { score, atsScore } = scoreCv(cv)
  const upData = (patch) => updateCv(cv.id, c => ({ data: { ...c.data, ...patch } }))
  const upTheme = (patch) => updateCv(cv.id, c => ({ theme: { ...c.theme, ...patch } }))
  const upSections = (fn) => updateCv(cv.id, c => ({ sections: fn(c.sections) }))

  // Mesure réelle du DOM de l'aperçu — voir CVPreview (onPageCount). useCallback
  // garde une référence stable pour éviter de redéclencher la mesure en boucle.
  const onPageCount = useCallback((info) => setPageInfo(info), [])

  const toggleSection = (id) => upSections(s => s.map(x => x.id === id ? { ...x, visible: x.visible === false } : x))
  // Masquer l'intitulé d'une rubrique sans masquer son contenu
  const toggleTitle = (id) => upSections(s => s.map(x => x.id === id
    ? { ...x, hideTitle: !(x.hideTitle ?? cv.theme?.hideSectionTitles === true) }
    : x))
  const moveSection = (id, dir) => upSections(secs => {
    const i = secs.findIndex(s => s.id === id), j = i + dir
    if (i < 0 || j < 0 || j >= secs.length) return secs
    const arr = [...secs]; [arr[i], arr[j]] = [arr[j], arr[i]]; return arr
  })
  const addSection = (id) => upSections(s => s.some(x => x.id === id) ? s : [...s, { id, visible: true }])
  const removeSection = (id) => upSections(s => s.filter(x => x.id !== id))
  const missing = Object.keys(SECTION_TYPES).filter(t => SECTION_TYPES[t].optional && !cv.sections.some(s => s.id === t))

  // Glisser-déposer des rubriques (les flèches restent l'équivalent clavier)
  const drag = useDragList(cv.sections, (arr) => updateCv(cv.id, { sections: arr }), (s) => s.id)

  return (
    <div className="h-screen flex flex-col">
      {/* ── Barre du haut ── */}
      <div className="bg-white px-4 h-14 flex items-center justify-between gap-4 shrink-0 print:hidden z-20"
        style={{ borderBottom: '1px solid var(--c-border)' }}>
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => router.push('/mes-cv')} className="btn-ghost !px-2" title="Retour à la liste">
            <Icon name="arrowLeft" size={16} />
            <span className="hidden sm:inline">Mes CV</span>
          </button>
          <div className="w-px h-6" style={{ background: 'var(--c-border)' }} />
          <input
            aria-label="Nom du CV"
            className="font-semibold text-sm bg-transparent outline-none min-w-0 px-1.5 py-1"
            style={{ color: 'var(--c-ink)', border: '1px solid transparent', borderRadius: 'var(--r-sm)' }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--c-border-strong)'}
            onBlur={e => e.currentTarget.style.borderColor = 'transparent'}
            value={cv.name}
            onChange={e => updateCv(cv.id, { name: e.target.value })}
          />
          <span className="hidden md:flex items-center gap-1 text-xs shrink-0" style={{ color: 'var(--c-success)' }}>
            <Icon name="check" size={12} /> Enregistré
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Scores en raccourci */}
          <button onClick={() => setTab('check')}
            className="hidden lg:flex items-center gap-2.5 px-2.5 py-1.5 text-xs"
            style={{ background: '#eef1f5', borderRadius: 'var(--r-md)' }} title="Voir le détail des contrôles">
            <span style={{ color: 'var(--c-muted)' }}>Qualité <strong style={{ color: 'var(--c-ink)' }}>{score}</strong></span>
            <span className="w-px h-3" style={{ background: 'var(--c-border-strong)' }} />
            <span style={{ color: 'var(--c-muted)' }}>ATS <strong style={{ color: 'var(--c-ink)' }}>{atsScore}</strong></span>
          </button>

          {/* Zoom */}
          <div className="hidden sm:flex items-center gap-0.5 text-xs" style={{ color: 'var(--c-muted)' }}>
            <button onClick={() => setZoom(z => Math.max(0.4, +(z - 0.1).toFixed(2)))}
              className="w-7 h-7 flex items-center justify-center hover:bg-gray-100" title="Réduire l'aperçu"
              style={{ borderRadius: 'var(--r-sm)' }}>−</button>
            <span className="w-9 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(1.2, +(z + 0.1).toFixed(2)))}
              className="w-7 h-7 flex items-center justify-center hover:bg-gray-100" title="Agrandir l'aperçu"
              style={{ borderRadius: 'var(--r-sm)' }}>+</button>
          </div>

          {/* Nombre de pages réel — mesuré sur l'aperçu, identique à l'impression.
              aria-live annonce le changement aux lecteurs d'écran sans être intrusif. */}
          <span aria-live="polite"
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold"
            title={pageInfo.pages > 1 ? "Ce CV s'étendra sur plusieurs pages à l'impression" : "Ce CV tient sur une page à l'impression"}
            style={{
              borderRadius: 'var(--r-md)',
              background: pageInfo.pages > 1 ? 'var(--c-warn-bg)' : '#eef1f5',
              color: pageInfo.pages > 1 ? 'var(--c-warn)' : 'var(--c-muted)',
            }}>
            <Icon name={pageInfo.pages > 1 ? 'alert' : 'file'} size={13} />
            {pageInfo.pages} page{pageInfo.pages > 1 ? 's' : ''}
          </span>

          {pageInfo.pages > 1 && (
            <CvTrimmer cv={cv} pages={pageInfo.pages}
              onApply={patch => updateCv(cv.id, c => ({ data: { ...c.data, ...patch } }))} />
          )}

          <ExportPdfButton label="Télécharger en PDF" documentLabel="votre CV"
            fileName={`CV ${[cv.data?.firstName, cv.data?.lastName].filter(Boolean).join(' ') || cv.name}`.trim()} />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* ── Panneau gauche ── */}
        <aside className="w-[420px] shrink-0 bg-white flex flex-col print:hidden"
          style={{ borderRight: '1px solid var(--c-border)' }}>
          {/* Onglets */}
          <div className="flex shrink-0" style={{ borderBottom: '1px solid var(--c-border)' }} role="tablist">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} role="tab" aria-selected={tab === t.id}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors"
                style={{
                  color: tab === t.id ? 'var(--c-primary)' : 'var(--c-muted)',
                  background: tab === t.id ? 'var(--c-primary-light)' : 'transparent',
                  boxShadow: tab === t.id ? 'inset 0 -2px 0 var(--c-primary)' : 'none',
                }}>
                <Icon name={t.icon} size={14} /> {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {/* ── Contenu ── */}
            {tab === 'content' && (
              <div className="flex flex-col gap-2">
                <p className="note">
                  <Icon name="sliders" size={14} />
                  <span>
                    Pour changer l'ordre : faites glisser une rubrique par sa poignée{' '}
                    <strong>⠿</strong>, ici ou <strong>directement sur le CV à droite</strong>
                    {' '}(la poignée apparaît au survol). Les flèches font la même chose au clavier.
                  </span>
                </p>

                {cv.sections.map((s, i) => {
                  const meta = SECTION_TYPES[s.id]
                  if (!meta) return null
                  const isOpen = openSection === s.id
                  const hidden = s.visible === false
                  const titleHidden = s.hideTitle ?? (cv.theme?.hideSectionTitles === true)
                  return (
                    <div key={s.id}
                      {...drag.dropProps(i)}
                      style={{
                        border: `1px solid ${isOpen ? 'var(--c-primary-border)' : 'var(--c-border)'}`,
                        borderRadius: 'var(--r-md)', overflow: 'hidden',
                        ...dragStyle({ dragging: drag.isDragging(i), over: drag.isOver(i) }),
                      }}>
                      <div className="flex items-center gap-1 px-2 py-2" style={{ opacity: hidden ? 0.55 : 1 }}>
                        <span {...drag.handleProps(i)}
                          title="Glisser pour déplacer cette rubrique" aria-hidden="true"
                          style={{ color: 'var(--c-faint)', fontSize: 13, letterSpacing: -1, padding: '2px 3px' }}>
                          ⠿
                        </span>
                        <button onClick={() => setOpenSection(isOpen ? null : s.id)}
                          aria-expanded={isOpen}
                          className="flex-1 flex items-center gap-2 text-left text-sm font-semibold"
                          style={{ color: 'var(--c-ink)' }}>
                          <Icon name={SECTION_ICON[s.id] || 'file'} size={14} style={{ color: 'var(--c-muted)' }} />
                          {meta.label}
                          {hidden && <span className="badge badge-neutral">masquée</span>}
                          {!hidden && titleHidden && <span className="badge badge-neutral">sans intitulé</span>}
                          <Icon name={isOpen ? 'chevronDown' : 'chevronRight'} size={14}
                            className="ml-auto" style={{ color: 'var(--c-faint)' }} />
                        </button>
                        <div className="flex items-center gap-0.5" style={{ color: 'var(--c-faint)' }}>
                          {s.id !== 'header' && (
                            <IconBtn
                              icon="layout"
                              title={titleHidden ? `Afficher l'intitulé « ${meta.label} »` : `Masquer l'intitulé « ${meta.label} »`}
                              active={titleHidden}
                              onClick={() => toggleTitle(s.id)} />
                          )}
                          <IconBtn icon="arrowUp" title="Monter" disabled={i === 0} onClick={() => moveSection(s.id, -1)} />
                          <IconBtn icon="arrowDown" title="Descendre" disabled={i === cv.sections.length - 1} onClick={() => moveSection(s.id, 1)} />
                          {!meta.required && (
                            <IconBtn icon={hidden ? 'eyeOff' : 'eye'} title={hidden ? 'Afficher sur le CV' : 'Masquer du CV'}
                              onClick={() => toggleSection(s.id)} />
                          )}
                          {meta.optional && (
                            <IconBtn icon="close" title="Retirer la rubrique" onClick={() => removeSection(s.id)} />
                          )}
                        </div>
                      </div>
                      {isOpen && (
                        <div className="px-3 pb-4 pt-3"
                          style={{ borderTop: '1px solid var(--c-border)', background: '#fbfcfd' }}>
                          <SectionForm type={s.id} d={cv.data} upData={upData} />
                        </div>
                      )}
                    </div>
                  )
                })}

                {missing.length > 0 && (
                  <div className="mt-3">
                    <span className="label">Ajouter une rubrique</span>
                    <div className="flex flex-wrap gap-1.5">
                      {missing.map(t => (
                        <button key={t} onClick={() => { addSection(t); setOpenSection(t) }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-colors"
                          style={{ background: '#eef1f5', color: 'var(--c-body)', borderRadius: 'var(--r-md)' }}>
                          <Icon name="plus" size={12} /> {SECTION_TYPES[t].label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <p className="note mt-4">
                  <Icon name="info" size={14} />
                  <span>Vous pouvez aussi cliquer directement sur un texte de l'aperçu, à droite, pour le corriger.</span>
                </p>
              </div>
            )}

            {/* ── Modèle ── */}
            {tab === 'template' && (
              <>
                <p className="note note-info mb-4">
                  <Icon name="shield" size={14} />
                  <span>
                    Pour un dépôt sur un site d'offres, privilégiez un modèle sur une seule
                    colonne (Classique, Moderne, Minimaliste, Simple ATS) : il est mieux lu
                    par les logiciels de recrutement.
                  </span>
                </p>
                <TemplateGallery compact selectedId={cv.templateId} data={cv.data} accent={cv.theme?.accent}
                  onSelect={id => updateCv(cv.id, { templateId: id })} />
              </>
            )}

            {/* ── Style ── */}
            {tab === 'style' && (
              <div className="flex flex-col gap-6">
                <div>
                  <span className="label">Couleur d'accent</span>
                  <div className="flex flex-wrap gap-2 items-center">
                    {ACCENTS.map(a => {
                      const sel = getAccent(cv) === a.v
                      return (
                        <button key={a.v} onClick={() => upTheme({ accent: a.v })} title={a.n}
                          aria-label={a.n} aria-pressed={sel}
                          className="w-7 h-7 transition-transform hover:scale-105"
                          style={{
                            background: a.v, borderRadius: 'var(--r-sm)',
                            boxShadow: sel ? `0 0 0 2px #fff, 0 0 0 4px ${a.v}` : 'none',
                          }} />
                      )
                    })}
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--c-muted)' }}>
                      <input type="color" value={getAccent(cv)} onChange={e => upTheme({ accent: e.target.value })}
                        className="w-7 h-7 cursor-pointer p-0 bg-transparent" style={{ border: 'none' }} />
                      Couleur personnalisée
                    </label>
                    <button onClick={() => upTheme({ accent: null })} className="text-xs underline"
                      style={{ color: 'var(--c-muted)' }}>
                      Rétablir la couleur du modèle
                    </button>
                  </div>
                </div>

                <div>
                  <span className="label">Police</span>
                  <div className="grid grid-cols-2 gap-2">
                    {FONTS.map(f => {
                      const sel = (cv.theme?.font || tpl.defaultFont) === f.id
                      return (
                        <button key={f.id} onClick={() => upTheme({ font: f.id })} aria-pressed={sel}
                          style={{
                            fontFamily: f.stack, borderRadius: 'var(--r-md)',
                            border: `1px solid ${sel ? 'var(--c-primary)' : 'var(--c-border-strong)'}`,
                            background: sel ? 'var(--c-primary-light)' : '#fff',
                            color: sel ? 'var(--c-primary)' : 'var(--c-body)',
                            fontWeight: sel ? 600 : 400,
                          }}
                          className="px-3 py-2.5 text-sm text-left transition-colors">
                          {f.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <Slider label="Taille du texte" value={cv.theme?.fontSize ?? 1} min={0.85} max={1.2} step={0.05}
                  onChange={v => upTheme({ fontSize: v })} />
                <Slider label="Espacement" value={cv.theme?.spacing ?? 1} min={0.8} max={1.3} step={0.05}
                  onChange={v => upTheme({ spacing: v })} />

                <div className="note">
                  <Icon name="layout" size={14} />
                  <span>
                    Pour retirer l'intitulé d'une rubrique — « Accroche » par exemple, souvent
                    inutile puisque le texte parle de lui-même — utilisez le bouton{' '}
                    <Icon name="layout" size={11} style={{ display: 'inline', verticalAlign: '-1px' }} />{' '}
                    en face de cette rubrique, dans l'onglet <strong>Contenu</strong>.
                    Le réglage est indépendant pour chaque rubrique.
                  </span>
                </div>

                <p className="note">
                  <Icon name="info" size={14} />
                  <span>Réduisez la taille ou l'espacement si votre CV dépasse d'une page.</span>
                </p>
              </div>
            )}

            {/* ── Contrôle ── */}
            {tab === 'check' && (
              <div className="flex flex-col gap-5">
                <div className="p-3 flex items-center justify-between gap-3 flex-wrap"
                  style={{ border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)' }}>
                  <div>
                    <span className="label !mb-0.5">Longueur à l'impression</span>
                    <p className="text-sm font-semibold" style={{ color: pageInfo.pages > 1 ? 'var(--c-warn)' : 'var(--c-success)' }}>
                      {pageInfo.pages} page{pageInfo.pages > 1 ? 's' : ''}
                      {pageInfo.pages > 1 && <span className="font-normal" style={{ color: 'var(--c-muted)' }}> — un CV d'une page est en général préférable</span>}
                    </p>
                  </div>
                  <CvTrimmer cv={cv} pages={pageInfo.pages}
                    onApply={patch => updateCv(cv.id, c => ({ data: { ...c.data, ...patch } }))} />
                </div>
                <CvCoach cv={cv} onGoto={(id) => { setTab('content'); setOpenSection(id) }} />
              </div>
            )}
          </div>
        </aside>

        {/* ── Aperçu ── */}
        <div className="flex-1 overflow-auto flex justify-center py-8 px-4 print:p-0 print:overflow-visible">
          <div style={{ width: 794 * zoom, height: 'fit-content' }}>
            <CVPreview cv={cv} editable onData={upData} scale={zoom}
              onReorder={(sections) => updateCv(cv.id, { sections })}
              pageGuides onPageCount={onPageCount} />
          </div>
        </div>
      </div>
    </div>
  )
}

function IconBtn({ icon, title, onClick, disabled, active }) {
  return (
    <button onClick={onClick} disabled={disabled} title={title} aria-label={title}
      aria-pressed={active === undefined ? undefined : active}
      className="w-6 h-6 flex items-center justify-center transition-colors disabled:opacity-25"
      style={{
        borderRadius: 'var(--r-sm)',
        background: active ? 'var(--c-primary-light)' : 'transparent',
        color: active ? 'var(--c-primary)' : 'inherit',
      }}
      onMouseEnter={e => !disabled && !active && (e.currentTarget.style.background = '#eef1f5')}
      onMouseLeave={e => (e.currentTarget.style.background = active ? 'var(--c-primary-light)' : 'transparent')}>
      <Icon name={icon} size={13} />
    </button>
  )
}

function Slider({ label, value, min, max, step, onChange }) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="label !mb-0">{label}</span>
        <span className="text-xs tabular-nums" style={{ color: 'var(--c-muted)' }}>{Math.round(value * 100)} %</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} aria-label={label}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full" style={{ accentColor: 'var(--c-primary)' }} />
    </div>
  )
}
