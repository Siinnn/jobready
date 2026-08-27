'use client'
import { useState } from 'react'
import { EMPTY_ENTRIES } from '@/lib/cvModel'
import Icon from '@/components/ui/Icon'
import useDragList, { dragStyle } from '@/components/ui/useDragList'

// ─── Champs de base ──────────────────────────────────────────────────────────
export function Field({ label, hint, children }) {
  return (
    <div>
      {label && (
        <label className="label">
          {label}
          {hint && <span className="font-normal ml-1.5" style={{ color: 'var(--c-faint)' }}>{hint}</span>}
        </label>
      )}
      {children}
    </div>
  )
}

export function TextInput({ label, hint, value, onChange, placeholder, type = 'text' }) {
  return (
    <Field label={label} hint={hint}>
      <input type={type} className="input" value={value || ''} placeholder={placeholder}
        onChange={e => onChange(e.target.value)} />
    </Field>
  )
}

export function TextArea({ label, hint, value, onChange, placeholder, rows = 4, actions }) {
  return (
    <Field label={label} hint={hint}>
      <textarea className="input resize-y" rows={rows} value={value || ''} placeholder={placeholder}
        onChange={e => onChange(e.target.value)} />
      {actions && <div className="mt-1.5 flex flex-wrap gap-2">{actions}</div>}
    </Field>
  )
}

// ─── Saisie de tags (compétences, centres d'intérêt) ────────────────────────
// L'ordre de saisie est conservé et modifiable : les premières compétences
// listées sont celles que le recruteur lit en premier.
export function TagInput({ label, hint, values = [], onChange, placeholder = 'Ajouter puis Entrée', suggestions = [], hiddenValues, onToggleHidden }) {
  const [draft, setDraft] = useState('')
  const drag = useDragList(values, onChange, (v) => v)
  const hiddenSet = hiddenValues instanceof Set ? hiddenValues : new Set(hiddenValues || [])

  const add = (v) => {
    const t = v.trim()
    if (!t || values.includes(t)) return
    onChange([...values, t])
    setDraft('')
  }
  const remove = (i) => onChange(values.filter((_, j) => j !== i))

  const remaining = suggestions.filter(s => !values.includes(s))

  return (
    <Field label={label} hint={hint}>
      <div className="input flex flex-wrap gap-1.5 items-center cursor-text !py-1.5"
        onClick={e => e.currentTarget.querySelector('input')?.focus()}>
        {values.map((v, i) => {
          const hidden = hiddenSet.has(v)
          return (
            <span key={v} {...drag.dropProps(i)} {...drag.handleProps(i)}
              title="Glisser pour changer l'ordre"
              className={hidden ? 'badge badge-neutral gap-1' : 'badge badge-primary gap-1'}
              style={{ cursor: 'grab', opacity: hidden ? 0.6 : 1, ...dragStyle({ dragging: drag.isDragging(i), over: drag.isOver(i) }) }}>
              {v}
              {hidden && <span className="text-[10px] font-normal">(masqué)</span>}
              {onToggleHidden && (
                <button type="button" onClick={() => onToggleHidden(v)}
                  aria-label={hidden ? `Afficher « ${v} » sur le CV` : `Masquer « ${v} » du CV`}
                  title={hidden ? 'Afficher sur le CV' : 'Masquer du CV (sans le supprimer)'}
                  className="leading-none opacity-60 hover:opacity-100">
                  <Icon name={hidden ? 'eyeOff' : 'eye'} size={10} strokeWidth={2.4} />
                </button>
              )}
              <button type="button" onClick={() => remove(i)} aria-label={`Supprimer « ${v} » définitivement`}
                className="leading-none opacity-60 hover:opacity-100">
                <Icon name="close" size={10} strokeWidth={2.4} />
              </button>
            </span>
          )
        })}
        <input
          className="flex-1 min-w-[120px] outline-none text-sm bg-transparent"
          value={draft} placeholder={values.length === 0 ? placeholder : ''}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(draft) }
            if (e.key === 'Backspace' && !draft && values.length) remove(values.length - 1)
          }}
          onBlur={() => draft && add(draft)}
        />
      </div>
      {remaining.length > 0 && (
        <div className="mt-2">
          <span className="text-[11px] font-medium" style={{ color: 'var(--c-faint)' }}>
            Suggestions pour votre métier :
          </span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {remaining.slice(0, 10).map(s => (
              <button key={s} type="button" onClick={() => add(s)}
                className="badge badge-neutral gap-1 transition-colors hover:opacity-75">
                <Icon name="plus" size={10} strokeWidth={2.4} /> {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </Field>
  )
}

// ─── Sélecteur de période (type France Travail / CVDesignR) ─────────────────
// Stocke une chaîne lisible ("Mars 2022 — Aujourd'hui") → compatible avec
// l'aperçu, l'export PDF et l'adaptation IA sans changer le modèle de données.
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
const THIS_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: THIS_YEAR + 1 - 1960 + 1 }, (_, i) => String(THIS_YEAR + 1 - i))

function parsePart(str = '') {
  const m = MONTHS.find(mo => str.toLowerCase().includes(mo.toLowerCase()))
  const y = (str.match(/(19|20)\d{2}/) || [])[0] || ''
  return { month: m || '', year: y }
}

function parsePeriod(value = '') {
  const [rawStart = '', rawEnd = ''] = String(value).split(/—|–|->|\bà\b| - /i).map(s => (s || '').trim())
  const current = /aujourd|présent|present|en cours|en poste/i.test(value)
  return { start: parsePart(rawStart), end: current ? { month: '', year: '' } : parsePart(rawEnd), current }
}

function formatPeriod(start, end, current) {
  const fmt = (p) => [p.month, p.year].filter(Boolean).join(' ')
  const s = fmt(start)
  const e = current ? "Aujourd'hui" : fmt(end)
  if (!s && !e) return ''
  if (s && e) return `${s} — ${e}`
  return s || e
}

function MonthYearSelects({ part, onPart, disabled }) {
  return (
    <div className="flex gap-1.5 flex-1 min-w-0">
      <select className="input !px-2 flex-1 disabled:opacity-40" value={part.month} disabled={disabled}
        onChange={e => onPart({ ...part, month: e.target.value })}>
        <option value="">Mois</option>
        {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      <select className="input !px-2 w-[86px] disabled:opacity-40" value={part.year} disabled={disabled}
        onChange={e => onPart({ ...part, year: e.target.value })}>
        <option value="">Année</option>
        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  )
}

export function PeriodPicker({ label = 'Période', value, onChange, currentLabel = 'Poste actuel' }) {
  // Entièrement dérivé de la valeur (pas d'état local) → fiable même si la liste est réordonnée
  const { start, end, current } = parsePeriod(value)
  const emit = (s, e, c) => onChange(formatPeriod(s, e, c))
  const [freeText, setFreeText] = useState(false)

  // Saisie libre : indispensable pour les formulations que les listes ne
  // couvrent pas (« Été 2021 », « 2019 — 2020 », « 6 mois en 2022 »).
  if (freeText) {
    return (
      <Field label={label}>
        <input className="input" value={value || ''} onChange={e => onChange(e.target.value)}
          placeholder="Ex : Été 2021, ou Mars 2020 — Juin 2022" autoFocus />
        <button type="button" onClick={() => setFreeText(false)}
          className="text-xs underline mt-1.5" style={{ color: 'var(--c-muted)' }}>
          Revenir aux listes déroulantes
        </button>
      </Field>
    )
  }

  return (
    <Field label={label}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs w-8 shrink-0" style={{ color: 'var(--c-muted)' }}>Début</span>
          <MonthYearSelects part={start} onPart={p => emit(p, end, current)} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs w-8 shrink-0" style={{ color: 'var(--c-muted)' }}>Fin</span>
          <MonthYearSelects part={end} disabled={current} onPart={p => emit(start, p, false)} />
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer w-fit"
            style={{ color: 'var(--c-body)' }}>
            <input type="checkbox" checked={current} className="w-3.5 h-3.5"
              style={{ accentColor: 'var(--c-primary)' }}
              onChange={e => emit(start, e.target.checked ? { month: '', year: '' } : end, e.target.checked)} />
            {currentLabel}
            <span style={{ color: 'var(--c-faint)' }}>(affiche « Aujourd'hui »)</span>
          </label>
          <button type="button" onClick={() => setFreeText(true)}
            className="text-xs underline" style={{ color: 'var(--c-muted)' }}>
            Saisir librement
          </button>
        </div>
        {value && (
          <p className="text-xs" style={{ color: 'var(--c-faint)' }}>
            Affiché sur le CV : <strong style={{ color: 'var(--c-body)' }}>{value}</strong>
          </p>
        )}
      </div>
    </Field>
  )
}

export function YearSelect({ label = 'Année', value, onChange, allowOngoing = true }) {
  return (
    <Field label={label}>
      <select className="input" value={value || ''} onChange={e => onChange(e.target.value)}>
        <option value="">—</option>
        {allowOngoing && <option value="En cours">En cours</option>}
        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </Field>
  )
}

// ─── Éditeur de liste générique (expériences, formations…) ──────────────────
// fields : [{ key, label, placeholder, textarea?, half? }]
export function ListEditor({ label, values = [], onChange, entryType, fields, addLabel = 'Ajouter', titleOf, renderExtra }) {
  const drag = useDragList(values, onChange, (_, i) => `entry-${i}`)

  const update = (i, key, v) => {
    const arr = [...values]
    arr[i] = { ...arr[i], [key]: v }
    onChange(arr)
  }
  const add = () => onChange([...values, { ...(EMPTY_ENTRIES[entryType] || {}) }])
  const remove = (i) => onChange(values.filter((_, j) => j !== i))
  const move = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= values.length) return
    const arr = [...values]
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    onChange(arr)
  }
  // Masquer une entrée la retire de l'aperçu et de l'export, SANS la
  // supprimer : elle reste modifiable ici et peut être réaffichée à tout moment.
  const toggleHidden = (i) => onChange(values.map((e, j) => j === i ? { ...e, hidden: !e.hidden } : e))

  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="flex flex-col gap-3">
        {values.map((entry, i) => {
          const hidden = !!entry.hidden
          return (
          <div key={i} className="p-4"
            {...drag.dropProps(i)}
            style={{
              background: '#fff', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)',
              opacity: hidden ? 0.6 : 1,
              ...dragStyle({ dragging: drag.isDragging(i), over: drag.isOver(i) }),
            }}>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide truncate"
                style={{ color: 'var(--c-muted)' }}>
                {/* Seule la poignée est déplaçable : les champs restent sélectionnables */}
                <span {...drag.handleProps(i)}
                  title="Glisser pour changer l'ordre" aria-hidden="true"
                  className="px-1 -ml-1 py-0.5 rounded"
                  style={{ letterSpacing: -1, fontSize: 13, color: 'var(--c-faint)' }}>⠿</span>
                {titleOf ? (titleOf(entry) || `Élément ${i + 1}`) : `Élément ${i + 1}`}
                {hidden && <span className="badge badge-neutral">masqué</span>}
              </span>
              <div className="flex gap-0.5 shrink-0" style={{ color: 'var(--c-faint)' }}>
                <ListBtn icon={hidden ? 'eyeOff' : 'eye'} active={hidden}
                  title={hidden ? 'Afficher sur le CV' : 'Masquer du CV (sans supprimer)'}
                  onClick={() => toggleHidden(i)} />
                <ListBtn icon="arrowUp" title="Monter" disabled={i === 0} onClick={() => move(i, -1)} />
                <ListBtn icon="arrowDown" title="Descendre" disabled={i === values.length - 1} onClick={() => move(i, 1)} />
                <ListBtn icon="trash" title="Supprimer définitivement" onClick={() => remove(i)} danger />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {fields.map(f => (
                <div key={f.key} className={f.half ? '' : 'col-span-2'}>
                  {f.type === 'period' ? (
                    <PeriodPicker label={f.label} value={entry[f.key]} currentLabel={f.currentLabel}
                      onChange={v => update(i, f.key, v)} />
                  ) : f.type === 'year' ? (
                    <YearSelect label={f.label} value={entry[f.key]}
                      onChange={v => update(i, f.key, v)} />
                  ) : f.textarea ? (
                    <TextArea label={f.label} value={entry[f.key]} placeholder={f.placeholder} rows={3}
                      onChange={v => update(i, f.key, v)}
                      actions={renderExtra ? renderExtra(entry, i, f.key) : undefined} />
                  ) : (
                    <TextInput label={f.label} value={entry[f.key]} placeholder={f.placeholder}
                      onChange={v => update(i, f.key, v)} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )})}
      </div>
      <button type="button" onClick={add}
        className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold transition-colors"
        style={{ border: '1px dashed var(--c-border-strong)', borderRadius: 'var(--r-md)', color: 'var(--c-primary)' }}>
        <Icon name="plus" size={14} /> {addLabel}
      </button>
    </div>
  )
}

function ListBtn({ icon, title, onClick, disabled, danger, active }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title} aria-label={title}
      aria-pressed={active === undefined ? undefined : active}
      className="w-7 h-7 flex items-center justify-center transition-colors disabled:opacity-25"
      style={{
        borderRadius: 'var(--r-sm)',
        background: active ? 'var(--c-primary-light)' : 'transparent',
        color: active ? 'var(--c-primary)' : 'inherit',
      }}
      onMouseEnter={e => !disabled && !active && (e.currentTarget.style.background = danger ? 'var(--c-danger-bg)' : '#eef1f5',
        e.currentTarget.style.color = danger ? 'var(--c-danger)' : 'var(--c-ink)')}
      onMouseLeave={e => (e.currentTarget.style.background = active ? 'var(--c-primary-light)' : 'transparent', e.currentTarget.style.color = active ? 'var(--c-primary)' : 'inherit')}>
      <Icon name={icon} size={13} />
    </button>
  )
}

// Configurations de champs réutilisées par le wizard et l'éditeur
export const LIST_FIELDS = {
  experiences: [
    { key: 'title',       label: 'Poste',       placeholder: 'Ex : Vendeur en boulangerie', half: true },
    { key: 'company',     label: 'Entreprise',  placeholder: 'Ex : Boulangerie Dupain',     half: true },
    { key: 'period',      label: 'Période',     type: 'period', currentLabel: 'Poste actuel' },
    { key: 'description', label: 'Description', placeholder: 'Missions principales, résultats chiffrés…', textarea: true },
  ],
  education: [
    { key: 'degree', label: 'Diplôme',          placeholder: 'Ex : Bac Pro Commerce', half: true },
    { key: 'school', label: 'École / organisme', placeholder: 'Ex : Lycée Jean Moulin', half: true },
    { key: 'year',   label: 'Année d\'obtention', type: 'year' },
  ],
  languages: [
    { key: 'name',  label: 'Langue', placeholder: 'Ex : Anglais', half: true },
    { key: 'level', label: 'Niveau', placeholder: 'Ex : B2, courant…', half: true },
  ],
  projects: [
    { key: 'name',        label: 'Nom du projet', placeholder: 'Ex : Site vitrine associatif', half: true },
    { key: 'link',        label: 'Lien',          placeholder: 'Ex : monprojet.fr', half: true },
    { key: 'description', label: 'Description',   placeholder: 'En une ou deux phrases', textarea: true },
  ],
  certifications: [
    { key: 'name',   label: 'Certification', placeholder: 'Ex : CACES 3', half: true },
    { key: 'issuer', label: 'Organisme',     placeholder: 'Ex : AFPA', half: true },
    { key: 'year',   label: 'Année',         type: 'year' },
  ],
  volunteering: [
    { key: 'role',         label: 'Rôle',        placeholder: 'Ex : Bénévole distribution', half: true },
    { key: 'organization', label: 'Organisation', placeholder: 'Ex : Restos du Cœur', half: true },
    { key: 'period',       label: 'Période',      type: 'period', currentLabel: 'Toujours en cours' },
    { key: 'description',  label: 'Description',  placeholder: 'Ce que vous y faisiez', textarea: true },
  ],
}

export const LIST_TITLES = {
  experiences:    e => [e.title, e.company].filter(Boolean).join(' · '),
  education:      e => [e.degree, e.school].filter(Boolean).join(' · '),
  languages:      e => e.name,
  projects:       e => e.name,
  certifications: e => e.name,
  volunteering:   e => [e.role, e.organization].filter(Boolean).join(' · '),
}
