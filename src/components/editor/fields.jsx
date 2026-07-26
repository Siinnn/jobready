'use client'
import { useState } from 'react'
import { EMPTY_ENTRIES } from '@/lib/cvModel'
import Icon from '@/components/ui/Icon'

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
export function TagInput({ label, hint, values = [], onChange, placeholder = 'Ajouter puis Entrée', suggestions = [] }) {
  const [draft, setDraft] = useState('')

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
        {values.map((v, i) => (
          <span key={i} className="badge badge-primary gap-1">
            {v}
            <button type="button" onClick={() => remove(i)} aria-label={`Retirer ${v}`}
              className="leading-none opacity-60 hover:opacity-100">
              <Icon name="close" size={10} strokeWidth={2.4} />
            </button>
          </span>
        ))}
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
  return (
    <Field label={label}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 w-8 shrink-0">De</span>
          <MonthYearSelects part={start} onPart={p => emit(p, end, current)} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 w-8 shrink-0">À</span>
          <MonthYearSelects part={end} disabled={current} onPart={p => emit(start, p, false)} />
        </div>
        <label className="flex items-center gap-2 text-xs font-medium text-gray-600 cursor-pointer w-fit">
          <input type="checkbox" checked={current} className="accent-indigo-600 w-3.5 h-3.5"
            onChange={e => emit(start, e.target.checked ? { month: '', year: '' } : end, e.target.checked)} />
          {currentLabel} <span className="text-gray-400">(affiche « Aujourd'hui »)</span>
        </label>
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

  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="flex flex-col gap-3">
        {values.map((entry, i) => (
          <div key={i} className="p-4" style={{ background: '#fff', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)' }}>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wide truncate" style={{ color: 'var(--c-muted)' }}>
                {titleOf ? (titleOf(entry) || `Élément ${i + 1}`) : `Élément ${i + 1}`}
              </span>
              <div className="flex gap-0.5 shrink-0" style={{ color: 'var(--c-faint)' }}>
                <ListBtn icon="arrowUp" title="Monter" disabled={i === 0} onClick={() => move(i, -1)} />
                <ListBtn icon="arrowDown" title="Descendre" disabled={i === values.length - 1} onClick={() => move(i, 1)} />
                <ListBtn icon="trash" title="Supprimer" onClick={() => remove(i)} danger />
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
        ))}
      </div>
      <button type="button" onClick={add}
        className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold transition-colors"
        style={{ border: '1px dashed var(--c-border-strong)', borderRadius: 'var(--r-md)', color: 'var(--c-primary)' }}>
        <Icon name="plus" size={14} /> {addLabel}
      </button>
    </div>
  )
}

function ListBtn({ icon, title, onClick, disabled, danger }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title} aria-label={title}
      className="w-7 h-7 flex items-center justify-center transition-colors disabled:opacity-25"
      style={{ borderRadius: 'var(--r-sm)' }}
      onMouseEnter={e => !disabled && (e.currentTarget.style.background = danger ? 'var(--c-danger-bg)' : '#eef1f5',
        e.currentTarget.style.color = danger ? 'var(--c-danger)' : 'var(--c-ink)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = 'inherit')}>
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
