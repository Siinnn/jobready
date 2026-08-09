'use client'
import { useRef, useEffect, useState } from 'react'
import { getTemplate, getAccent, getSidebarBg } from '@/templates'
import { FONTS, SECTION_TYPES } from '@/lib/cvModel'

// Dimensions A4 à 96 dpi
export const A4_W = 794
export const A4_H = 1123

// ─── Champ éditable inline (optionnel) ───────────────────────────────────────
function E({ value, onChange, tag: Tag = 'span', style, placeholder, block }) {
  const ref = useRef()
  // IMPORTANT : initialisé à un symbole "jamais écrit" pour que la valeur
  // initiale soit bien injectée dans le contentEditable au premier rendu.
  const prev = useRef(Symbol('unset'))
  useEffect(() => {
    if (ref.current && value !== prev.current) {
      ref.current.textContent = value ?? ''
      prev.current = value
    }
  }, [value])
  if (!onChange) {
    return value
      ? <Tag style={style}>{value}</Tag>
      : (placeholder ? <Tag style={{ ...style, color: '#c4c8d0', fontStyle: 'italic' }}>{placeholder}</Tag> : null)
  }
  return (
    <Tag
      ref={ref}
      contentEditable suppressContentEditableWarning
      onInput={() => { const v = ref.current?.textContent ?? ''; prev.current = v; onChange(v) }}
      data-ph={!value ? (placeholder ?? '') : ''}
      className="cv-editable"
      style={{ outline: 'none', minWidth: 10, display: block ? 'block' : 'inline', ...style }}
    />
  )
}

// ─── Composant principal ─────────────────────────────────────────────────────
// cv       : CVDocument
// editable : active l'édition inline au clic
// onData   : (patch) => void — fusionné dans cv.data
// scale    : zoom d'affichage (1 = 100 %)
export default function CVPreview({ cv, editable = false, onData, onReorder, scale = 1, id = 'cv-print-root' }) {
  const [dragState, setDragState] = useState({ from: null, over: null })
  // Déplacement d'une entrée à l'intérieur d'une rubrique (une expérience,
  // une formation…) : { field, from, over }
  const [entryDrag, setEntryDrag] = useState({ field: null, from: null, over: null })
  const tpl = getTemplate(cv.templateId)
  const accent = getAccent(cv)
  const fontId = cv.theme?.font || tpl.defaultFont
  const font = (FONTS.find(f => f.id === fontId) || FONTS[0]).stack
  const fs = cv.theme?.fontSize || 1
  const sp = cv.theme?.spacing || 1
  const d = cv.data

  const up = editable && onData ? (field) => (v) => onData({ [field]: v }) : () => undefined
  const upArr = editable && onData
    ? (field, i, sub) => (v) => {
        const arr = [...(d[field] || [])]
        arr[i] = { ...arr[i], [sub]: v }
        onData({ [field]: arr })
      }
    : () => undefined

  // Tailles de base (px) modulées par le thème
  const S = {
    name: 30 * fs, title: 14 * fs, body: 11.5 * fs, small: 10.5 * fs,
    stitle: (tpl.dense ? 11 : 11.5) * fs,
    gap: (tpl.dense ? 12 : 18) * sp, pad: (tpl.dense ? 34 : 44) * sp,
  }

  const visible = (cv.sections || []).filter(s => s.visible !== false)
  const sidebarTypes = tpl.sidebar?.sections || []
  const mainSections = visible.filter(s => !sidebarTypes.includes(s.id))
  const sidebarBg = getSidebarBg(tpl, accent)

  // Les coordonnées ne doivent apparaître qu'une seule fois : si la colonne
  // latérale contient déjà le bloc « Contact », l'en-tête ne les répète pas.
  const contactInSidebar = sidebarTypes.includes('contact')

  // Le masquage des intitulés se règle rubrique par rubrique (`hideTitle` sur
  // chaque section). L'ancien réglage global reste pris en compte comme valeur
  // par défaut, pour les CV créés avant cette évolution.
  const legacyHideAll = cv.theme?.hideSectionTitles === true
  const hidesTitle = (s) => s.hideTitle ?? legacyHideAll

  // Réordonnancement des entrées d'une liste (expériences, formations…)
  const moveEntry = editable && onData
    ? (field, from, to) => {
        const arr = [...(d[field] || [])]
        if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return
        const [moved] = arr.splice(from, 1)
        arr.splice(to, 0, moved)
        onData({ [field]: arr })
      }
    : null

  const entryCtx = { moveEntry, entryDrag, setEntryDrag, accent }
  const ctx = { d, tpl, accent, S, sp, up, upArr, editable, contactInSidebar, ...entryCtx }

  // Réordonnancement directement sur la feuille : une poignée apparaît au
  // survol de chaque rubrique. Seule la poignée est déplaçable, afin de ne pas
  // gêner la sélection et la modification du texte au clic.
  const canReorder = editable && typeof onReorder === 'function'

  const moveSection = (fromId, toId) => {
    if (!fromId || fromId === toId) return
    const arr = [...(cv.sections || [])]
    const from = arr.findIndex(s => s.id === fromId)
    const to = arr.findIndex(s => s.id === toId)
    if (from < 0 || to < 0) return
    const [moved] = arr.splice(from, 1)
    arr.splice(to, 0, moved)
    onReorder(arr)
  }

  const renderSection = (s) => (
    <SectionShell
      key={s.id} id={s.id} accent={accent} canReorder={canReorder}
      drag={dragState} setDrag={setDragState} onMove={moveSection}
      label={SECTION_TYPES[s.id]?.label}
    >
      <SectionBlock type={s.id} hideTitles={hidesTitle(s)} {...ctx} />
    </SectionShell>
  )

  const body = tpl.layout === 'single' ? (
    <div style={{ padding: `${S.pad * 0.75}px ${S.pad}px`, display: 'flex', flexDirection: 'column', gap: S.gap }}>
      {mainSections.map(renderSection)}
    </div>
  ) : (
    <div style={{ display: 'flex', flexDirection: tpl.layout === 'sidebar-right' ? 'row-reverse' : 'row', minHeight: A4_H }}>
      <aside style={{
        width: tpl.sidebar.width, flexShrink: 0, background: sidebarBg,
        color: tpl.sidebar.text, padding: `${S.pad * 0.7}px ${22 * sp}px`,
        display: 'flex', flexDirection: 'column', gap: S.gap,
      }}>
        {tpl.headerVariant === 'sidebar' && <SidebarIdentity {...ctx} />}
        {sidebarTypes.map(t => visible.some(s => s.id === t) || t === 'contact'
          ? <SidebarBlock key={t} type={t} {...ctx} />
          : null)}
      </aside>
      <div style={{ flex: 1, padding: `${S.pad * 0.7}px ${S.pad * 0.8}px`, display: 'flex', flexDirection: 'column', gap: S.gap }}>
        {mainSections
          .filter(s => !(tpl.headerVariant === 'sidebar' && s.id === 'header'))
          .map(renderSection)}
      </div>
    </div>
  )

  return (
    <div
      id={id}
      className="cv-sheet"
      style={{
        width: A4_W, minHeight: A4_H, background: 'white',
        fontFamily: font, color: '#111827', boxSizing: 'border-box',
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top left',
      }}
    >
      {body}
    </div>
  )
}

// ─── Enveloppe d'une rubrique sur la feuille ────────────────────────────────
// Ajoute une poignée de déplacement au survol, quand l'aperçu est modifiable.
// Le contenu lui-même n'est pas déplaçable : la sélection et la modification
// du texte au clic restent intactes.
function SectionShell({ id, label, accent, canReorder, drag, setDrag, onMove, children }) {
  const [hover, setHover] = useState(false)
  if (!canReorder) return <div>{children}</div>

  const isDragged = drag.from === id
  const isTarget = drag.over === id && drag.from !== id

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onDragOver={(e) => {
        if (!drag.from) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        if (drag.over !== id) setDrag(d => ({ ...d, over: id }))
      }}
      onDrop={(e) => {
        e.preventDefault()
        onMove(drag.from, id)
        setDrag({ from: null, over: null })
      }}
      style={{
        position: 'relative',
        opacity: isDragged ? 0.35 : 1,
        boxShadow: isTarget ? `0 -2px 0 0 ${accent}` : undefined,
        borderRadius: 2,
        transition: 'opacity .12s',
      }}
    >
      {/* Poignée : seul élément déplaçable, hors du flux et jamais imprimée */}
      <span
        className="cv-drag-handle"
        draggable
        onDragStart={(e) => {
          setDrag({ from: id, over: null })
          e.dataTransfer.effectAllowed = 'move'
          try { e.dataTransfer.setData('text/plain', id) } catch {}
        }}
        onDragEnd={() => setDrag({ from: null, over: null })}
        title={label ? `Déplacer la rubrique « ${label} »` : 'Déplacer cette rubrique'}
        aria-hidden="true"
        style={{
          position: 'absolute', left: -25, top: 0,
          width: 19, height: 22,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'grab', userSelect: 'none',
          color: '#fff', background: accent, borderRadius: 3,
          fontSize: 11, lineHeight: 1, letterSpacing: -1,
          opacity: hover || isDragged ? 1 : 0,
          transition: 'opacity .15s',
        }}
      >
        ⠿
      </span>
      {children}
    </div>
  )
}

// ─── Enveloppe d'une entrée dans une rubrique ───────────────────────────────
// Permet de réordonner une expérience, une formation… directement sur la
// feuille. Même principe que SectionShell : seule la poignée est déplaçable.
function EntryShell({ field, index, accent, moveEntry, entryDrag, setEntryDrag, children }) {
  const [hover, setHover] = useState(false)
  if (!moveEntry) return children

  const active = entryDrag.field === field
  const isDragged = active && entryDrag.from === index
  const isTarget = active && entryDrag.over === index && entryDrag.from !== index

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onDragOver={(e) => {
        if (!active || entryDrag.from === null) return
        e.preventDefault()
        e.stopPropagation()
        e.dataTransfer.dropEffect = 'move'
        if (entryDrag.over !== index) setEntryDrag(s => ({ ...s, over: index }))
      }}
      onDrop={(e) => {
        if (!active || entryDrag.from === null) return
        e.preventDefault()
        e.stopPropagation()
        moveEntry(field, entryDrag.from, index)
        setEntryDrag({ field: null, from: null, over: null })
      }}
      style={{
        position: 'relative',
        opacity: isDragged ? 0.35 : 1,
        boxShadow: isTarget ? `0 -2px 0 0 ${accent}` : undefined,
        transition: 'opacity .12s',
      }}
    >
      <span
        className="cv-drag-handle"
        draggable
        onDragStart={(e) => {
          setEntryDrag({ field, from: index, over: null })
          e.dataTransfer.effectAllowed = 'move'
          try { e.dataTransfer.setData('text/plain', `${field}:${index}`) } catch {}
          e.stopPropagation()
        }}
        onDragEnd={() => setEntryDrag({ field: null, from: null, over: null })}
        title="Déplacer cette entrée"
        aria-hidden="true"
        style={{
          position: 'absolute', left: -21, top: 1,
          width: 15, height: 17,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'grab', userSelect: 'none',
          color: accent, background: '#fff',
          border: `1px solid ${accent}`, borderRadius: 3,
          fontSize: 9, lineHeight: 1, letterSpacing: -1,
          opacity: hover || isDragged ? 1 : 0,
          transition: 'opacity .15s',
        }}
      >
        ⠿
      </span>
      {children}
    </div>
  )
}

// ─── Titre de section (variantes par modèle, masquable) ─────────────────────
function STitle({ label, tpl, accent, S, hideTitles }) {
  if (hideTitles) return <div style={{ height: 4 }} />
  const base = { fontSize: S.stitle, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }
  const variants = {
    underline: { ...base, color: accent, borderBottom: `2px solid ${accent}`, paddingBottom: 4 },
    plain:     { ...base, color: accent },
    muted:     { ...base, color: '#9ca3af', fontWeight: 400, letterSpacing: 2.5, borderBottom: '1px solid #e5e7eb', paddingBottom: 5 },
    caps:      { ...base, color: '#111827', borderBottom: '1px solid #d1d5db', paddingBottom: 4 },
  }
  return <div style={variants[tpl.titleVariant] || variants.plain}>{label}</div>
}

// ─── Sections principales ────────────────────────────────────────────────────
function SectionBlock(props) {
  const { type } = props
  switch (type) {
    case 'header':         return <Header {...props} />
    case 'summary':        return <Summary {...props} />
    case 'experience':     return <Experience {...props} />
    case 'education':      return <Education {...props} />
    case 'skills':         return <Skills {...props} />
    case 'languages':      return <Languages {...props} />
    case 'projects':       return <Projects {...props} />
    case 'certifications': return <Certifications {...props} />
    case 'volunteering':   return <Volunteering {...props} />
    case 'interests':      return <Interests {...props} />
    default: return null
  }
}

function ContactLine({ d, S, color = '#6b7280', up, editable }) {
  // Seuls les champs REMPLIS apparaissent (identique au PDF final).
  // Pour ajouter/retirer un champ : formulaire "En-tête" du panneau de gauche.
  const shown = ['email', 'phone', 'location', 'linkedin', 'portfolio'].filter(f => d[f])
  if (shown.length === 0) return null
  return (
    <div style={{ fontSize: S.small, color, display: 'flex', flexWrap: 'wrap', gap: '2px 18px', marginTop: 8 }}>
      {shown.map(f => (
        <span key={f}>
          <E value={d[f]} onChange={editable ? up(f) : undefined} />
        </span>
      ))}
    </div>
  )
}

function Header({ d, tpl, accent, S, up, editable, contactInSidebar }) {
  const name = (
    <div style={{ fontSize: S.name, fontWeight: tpl.id === 'minimaliste' ? 300 : 800, lineHeight: 1.1 }}>
      <E value={d.firstName} onChange={editable ? up('firstName') : undefined} placeholder="Prénom" />{' '}
      <span style={{ fontWeight: 700 }}>
        <E value={d.lastName} onChange={editable ? up('lastName') : undefined} placeholder="Nom" />
      </span>
    </div>
  )
  const title = (
    <div style={{ fontSize: S.title, marginTop: 5, fontWeight: 500, color: tpl.headerVariant === 'band' ? 'rgba(255,255,255,0.9)' : accent }}>
      <E value={d.title} onChange={editable ? up('title') : undefined} placeholder="Titre professionnel (ex : Développeur web)" />
    </div>
  )

  if (tpl.headerVariant === 'band') {
    return (
      <div style={{ background: accent, color: 'white', margin: `-${S.pad * 0.75}px -${S.pad}px 0`, padding: `${S.pad * 0.6}px ${S.pad}px` }}>
        {name}{title}
        {!contactInSidebar && <ContactLine d={d} S={S} color="rgba(255,255,255,0.85)" up={up} editable={editable} />}
      </div>
    )
  }
  return (
    <div style={tpl.headerVariant === 'underline' ? { borderBottom: `2.5px solid ${accent}`, paddingBottom: 12 } : {}}>
      {name}{title}
      {!contactInSidebar && <ContactLine d={d} S={S} up={up} editable={editable} />}
    </div>
  )
}

function Summary({ d, tpl, accent, S, up, editable, hideTitles }) {
  if (!d.summary && !editable) return null
  return (
    <div>
      <STitle label="Accroche" tpl={tpl} accent={accent} S={S} hideTitles={hideTitles} />
      <E tag="div" block value={d.summary} onChange={editable ? up('summary') : undefined}
        placeholder="Votre accroche : qui vous êtes, ce que vous visez, vos points forts…"
        style={{ fontSize: S.body, color: '#374151', lineHeight: 1.55, fontStyle: tpl.id === 'minimaliste' ? 'italic' : 'normal' }} />
    </div>
  )
}

function DatedEntry({ left, right, period, timeline, S }) {
  if (timeline) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '105px 1fr', gap: '0 20px', marginBottom: 13 }}>
        <div style={{ fontSize: S.small, color: '#9ca3af', textAlign: 'right', paddingTop: 2 }}>{period}</div>
        <div>{left}{right}</div>
      </div>
    )
  }
  return (
    <div style={{ marginBottom: 13 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <div style={{ flex: 1 }}>{left}</div>
        <div style={{ fontSize: S.small, color: '#9ca3af', whiteSpace: 'nowrap' }}>{period}</div>
      </div>
      {right}
    </div>
  )
}

function Experience({ d, tpl, accent, S, upArr, editable, hideTitles, moveEntry, entryDrag, setEntryDrag }) {
  const list = d.experiences || []
  if (list.length === 0 && !editable) return null
  return (
    <div>
      <STitle label="Expériences professionnelles" tpl={tpl} accent={accent} S={S} hideTitles={hideTitles} />
      {list.map((exp, i) => (
        <EntryShell key={i} field="experiences" index={i} accent={accent}
          moveEntry={moveEntry} entryDrag={entryDrag} setEntryDrag={setEntryDrag}>
          <DatedEntry timeline={tpl.timeline} S={S}
            period={<E value={exp.period} onChange={editable ? upArr('experiences', i, 'period') : undefined} placeholder="Période" />}
            left={
              <>
                <span style={{ fontSize: S.body + 0.5, fontWeight: 700 }}>
                  <E value={exp.title} onChange={editable ? upArr('experiences', i, 'title') : undefined} placeholder="Poste" />
                </span>
                <div style={{ fontSize: S.small + 0.5, color: accent, fontWeight: 600 }}>
                  <E value={exp.company} onChange={editable ? upArr('experiences', i, 'company') : undefined} placeholder="Entreprise" />
                </div>
              </>
            }
            right={(exp.description || editable) ? (
              <E tag="div" block value={exp.description} onChange={editable ? upArr('experiences', i, 'description') : undefined}
                placeholder="Missions, résultats chiffrés…"
                style={{ fontSize: S.small + 0.5, color: '#4b5563', lineHeight: 1.45, marginTop: 3, whiteSpace: 'pre-wrap' }} />
            ) : null}
          />
        </EntryShell>
      ))}
    </div>
  )
}

function Education({ d, tpl, accent, S, upArr, editable, hideTitles, moveEntry, entryDrag, setEntryDrag }) {
  const list = d.education || []
  if (list.length === 0 && !editable) return null
  return (
    <div>
      <STitle label="Formation" tpl={tpl} accent={accent} S={S} hideTitles={hideTitles} />
      {list.map((edu, i) => (
        <EntryShell key={i} field="education" index={i} accent={accent}
          moveEntry={moveEntry} entryDrag={entryDrag} setEntryDrag={setEntryDrag}>
          <DatedEntry timeline={tpl.timeline} S={S}
            period={<E value={edu.year} onChange={editable ? upArr('education', i, 'year') : undefined} placeholder="Année" />}
            left={
              <>
                <span style={{ fontSize: S.body, fontWeight: 700 }}>
                  <E value={edu.degree} onChange={editable ? upArr('education', i, 'degree') : undefined} placeholder="Diplôme" />
                </span>
                <div style={{ fontSize: S.small, color: '#6b7280' }}>
                  <E value={edu.school} onChange={editable ? upArr('education', i, 'school') : undefined} placeholder="École / organisme" />
                </div>
              </>
            }
          />
        </EntryShell>
      ))}
    </div>
  )
}

function Skills({ d, tpl, accent, S, hideTitles }) {
  const tech = d.techSkills || []
  const soft = d.softSkills || []
  if (tech.length + soft.length === 0) return null
  if (tpl.id === 'minimaliste') {
    return (
      <div>
        <STitle label="Compétences" tpl={tpl} accent={accent} S={S} hideTitles={hideTitles} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {[...tech, ...soft].map((s, i) => (
            <span key={i} style={{ fontSize: S.small, padding: '2.5px 11px', border: '1px solid #e5e7eb', borderRadius: 20 }}>{s}</span>
          ))}
        </div>
      </div>
    )
  }
  return (
    <div>
      <STitle label="Compétences" tpl={tpl} accent={accent} S={S} hideTitles={hideTitles} />
      {tech.length > 0 && <div style={{ fontSize: S.small + 0.5, marginBottom: 4 }}><strong>Techniques : </strong>{tech.join(' · ')}</div>}
      {soft.length > 0 && <div style={{ fontSize: S.small + 0.5 }}><strong>Personnelles : </strong>{soft.join(' · ')}</div>}
    </div>
  )
}

function Languages({ d, tpl, accent, S, hideTitles }) {
  const list = d.languages || []
  if (list.length === 0) return null
  return (
    <div>
      <STitle label="Langues" tpl={tpl} accent={accent} S={S} hideTitles={hideTitles} />
      <div style={{ fontSize: S.small + 0.5, display: 'flex', flexWrap: 'wrap', gap: '3px 22px' }}>
        {list.map((l, i) => (
          <span key={i}><strong>{l.name}</strong>{l.level ? ` — ${l.level}` : ''}</span>
        ))}
      </div>
    </div>
  )
}

function Projects({ d, tpl, accent, S, upArr, editable, hideTitles }) {
  const list = d.projects || []
  if (list.length === 0) return null
  return (
    <div>
      <STitle label="Projets" tpl={tpl} accent={accent} S={S} hideTitles={hideTitles} />
      {list.map((p, i) => (
        <div key={i} style={{ marginBottom: 9 }}>
          <span style={{ fontSize: S.body, fontWeight: 700 }}>
            <E value={p.name} onChange={editable ? upArr('projects', i, 'name') : undefined} placeholder="Nom du projet" />
          </span>
          {p.link && <span style={{ fontSize: S.small, color: accent }}> — {p.link}</span>}
          {(p.description || editable) && (
            <E tag="div" block value={p.description} onChange={editable ? upArr('projects', i, 'description') : undefined}
              placeholder="Description courte" style={{ fontSize: S.small + 0.5, color: '#4b5563', lineHeight: 1.45 }} />
          )}
        </div>
      ))}
    </div>
  )
}

function Certifications({ d, tpl, accent, S, hideTitles }) {
  const list = d.certifications || []
  if (list.length === 0) return null
  return (
    <div>
      <STitle label="Certifications" tpl={tpl} accent={accent} S={S} hideTitles={hideTitles} />
      {list.map((c, i) => (
        <div key={i} style={{ fontSize: S.small + 0.5, marginBottom: 4 }}>
          <strong>{c.name}</strong>{c.issuer ? ` — ${c.issuer}` : ''}{c.year ? ` (${c.year})` : ''}
        </div>
      ))}
    </div>
  )
}

function Volunteering({ d, tpl, accent, S, upArr, editable, hideTitles }) {
  const list = d.volunteering || []
  if (list.length === 0) return null
  return (
    <div>
      <STitle label="Bénévolat" tpl={tpl} accent={accent} S={S} hideTitles={hideTitles} />
      {list.map((v, i) => (
        <DatedEntry key={i} timeline={tpl.timeline} S={S}
          period={v.period}
          left={
            <>
              <span style={{ fontSize: S.body, fontWeight: 700 }}>{v.role}</span>
              <div style={{ fontSize: S.small, color: '#6b7280' }}>{v.organization}</div>
            </>
          }
          right={v.description ? (
            <div style={{ fontSize: S.small + 0.5, color: '#4b5563', lineHeight: 1.45, marginTop: 2 }}>{v.description}</div>
          ) : null}
        />
      ))}
    </div>
  )
}

function Interests({ d, tpl, accent, S, hideTitles }) {
  const list = d.interests || []
  if (list.length === 0) return null
  return (
    <div>
      <STitle label="Centres d'intérêt" tpl={tpl} accent={accent} S={S} hideTitles={hideTitles} />
      <div style={{ fontSize: S.small + 0.5 }}>{list.join(' · ')}</div>
    </div>
  )
}

// ─── Blocs de la colonne latérale (modèles 2 colonnes) ──────────────────────
function SidebarIdentity({ d, tpl, accent, S, up, editable }) {
  return (
    <div>
      <div style={{
        width: 76, height: 76, borderRadius: '50%', background: `${accent}55`,
        border: `2.5px solid ${accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 26, fontWeight: 700, color: 'white', marginBottom: 14,
      }}>
        {(d.firstName?.[0] ?? '?')}{(d.lastName?.[0] ?? '')}
      </div>
      <div style={{ fontSize: 19, fontWeight: 800, color: 'white', lineHeight: 1.2 }}>
        <E value={d.firstName} onChange={editable ? up('firstName') : undefined} placeholder="Prénom" />{' '}
        <E value={d.lastName} onChange={editable ? up('lastName') : undefined} placeholder="Nom" />
      </div>
      <div style={{ fontSize: S.small + 1, marginTop: 5, color: tpl.sidebar.muted }}>
        <E value={d.title} onChange={editable ? up('title') : undefined} placeholder="Titre" />
      </div>
    </div>
  )
}

function SbTitle({ label, accent, S }) {
  return (
    <div style={{ fontSize: S.small, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: accent, marginBottom: 7 }}>
      {label}
    </div>
  )
}

function SidebarBlock({ type, d, tpl, accent, S, up, editable }) {
  const { text } = tpl.sidebar
  // Pour les sidebars claires dérivées de l'accent, l'accent lui-même n'est pas lisible → blanc
  const titleColor = tpl.sidebar.bg ? accent : 'rgba(255,255,255,0.95)'

  if (type === 'contact') {
    const fields = ['email', 'phone', 'location', 'linkedin', 'portfolio'].filter(f => d[f])
    if (fields.length === 0) return null
    return (
      <div>
        <SbTitle label="Contact" accent={titleColor} S={S} />
        {fields.map(f => (
          <div key={f} style={{ fontSize: S.small, marginBottom: 5, color: text, wordBreak: 'break-word' }}>
            <E value={d[f]} onChange={editable ? up(f) : undefined} />
          </div>
        ))}
      </div>
    )
  }
  if (type === 'skills') {
    const all = [...(d.techSkills || []), ...(d.softSkills || [])]
    if (all.length === 0) return null
    return (
      <div>
        <SbTitle label="Compétences" accent={titleColor} S={S} />
        {all.map((s, i) => <div key={i} style={{ fontSize: S.small, marginBottom: 4, color: text }}>• {s}</div>)}
      </div>
    )
  }
  if (type === 'languages') {
    const list = d.languages || []
    if (list.length === 0) return null
    return (
      <div>
        <SbTitle label="Langues" accent={titleColor} S={S} />
        {list.map((l, i) => (
          <div key={i} style={{ fontSize: S.small, marginBottom: 4, color: text }}>
            {l.name}{l.level ? ` — ${l.level}` : ''}
          </div>
        ))}
      </div>
    )
  }
  if (type === 'certifications') {
    const list = d.certifications || []
    if (list.length === 0) return null
    return (
      <div>
        <SbTitle label="Certifications" accent={titleColor} S={S} />
        {list.map((c, i) => <div key={i} style={{ fontSize: S.small, marginBottom: 4, color: text }}>{c.name}{c.year ? ` (${c.year})` : ''}</div>)}
      </div>
    )
  }
  if (type === 'interests') {
    const list = d.interests || []
    if (list.length === 0) return null
    return (
      <div>
        <SbTitle label="Centres d'intérêt" accent={titleColor} S={S} />
        <div style={{ fontSize: S.small, color: text }}>{list.join(' · ')}</div>
      </div>
    )
  }
  return null
}
