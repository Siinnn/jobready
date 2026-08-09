'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import LetterPreview from '@/components/letter/LetterPreview'
import { TextInput, TextArea } from '@/components/editor/fields'
import { AIRewriteButton } from '@/components/ai/AIHelpers'
import Icon from '@/components/ui/Icon'
import ExportPdfButton from '@/components/ui/ExportPdfButton'
import { FONTS } from '@/lib/cvModel'
import { PARAGRAPH_KINDS, LETTER_TONES, letterWordCount, defaultSubject, SIGNATURE_MODES, HANDWRITING_FONTS } from '@/lib/letterModel'

const ACCENTS = ['#1f3a68', '#2563eb', '#0f766e', '#1c6b4a', '#4338ca', '#475569', '#111827']

const TABS = [
  { id: 'body',      label: 'Texte',       icon: 'pencil' },
  { id: 'infos',     label: 'Coordonnées', icon: 'user' },
  { id: 'signature', label: 'Signature',   icon: 'award' },
  { id: 'style',     label: 'Mise en page', icon: 'sliders' },
]

export default function EditeurLettrePage() {
  const router = useRouter()
  const { activeLetter, updateLetter, isInitialized } = useApp()
  const [tab, setTab] = useState('body')
  const [zoom, setZoom] = useState(0.7)

  useEffect(() => {
    if (isInitialized && !activeLetter) router.push('/mes-lettres')
  }, [isInitialized, activeLetter, router])

  if (!isInitialized || !activeLetter) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon name="clock" size={28} className="animate-spin" style={{ color: 'var(--c-muted)' }} />
      </div>
    )
  }

  const L = activeLetter
  const words = letterWordCount(L)
  const up = (patch) => updateLetter(L.id, patch)
  const upSender = (patch) => updateLetter(L.id, l => ({ sender: { ...l.sender, ...patch } }))
  const upRecipient = (patch) => updateLetter(L.id, l => ({ recipient: { ...l.recipient, ...patch } }))
  const upJob = (patch) => updateLetter(L.id, l => ({ job: { ...l.job, ...patch } }))
  const upTheme = (patch) => updateLetter(L.id, l => ({ theme: { ...l.theme, ...patch } }))
  const upPara = (id, text) => updateLetter(L.id, l => ({
    body: l.body.map(p => p.id === id ? { ...p, text } : p),
  }))
  const movePara = (i, dir) => updateLetter(L.id, l => {
    const j = i + dir
    if (j < 0 || j >= l.body.length) return {}
    const arr = [...l.body]; [arr[i], arr[j]] = [arr[j], arr[i]]
    return { body: arr }
  })

  const lengthNote = words < 150
    ? { cls: 'note-warn', icon: 'alert', text: `${words} mots : votre lettre est un peu courte. Visez 200 à 320 mots pour convaincre sans lasser.` }
    : words > 380
    ? { cls: 'note-warn', icon: 'alert', text: `${words} mots : votre lettre est longue et risque de ne pas être lue en entier. Visez 200 à 320 mots.` }
    : { cls: 'note-success', icon: 'checkCircle', text: `${words} mots : bonne longueur pour une lettre de motivation.` }

  return (
    <div className="h-screen flex flex-col">
      {/* Barre du haut */}
      <div className="bg-white px-4 h-14 flex items-center justify-between gap-4 shrink-0 print:hidden z-20"
        style={{ borderBottom: '1px solid var(--c-border)' }}>
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => router.push('/mes-lettres')} className="btn-ghost !px-2" title="Retour à la liste">
            <Icon name="arrowLeft" size={16} />
            <span className="hidden sm:inline">Mes lettres</span>
          </button>
          <div className="w-px h-6" style={{ background: 'var(--c-border)' }} />
          <input aria-label="Nom de la lettre"
            className="font-semibold text-sm bg-transparent outline-none min-w-0 px-1.5 py-1"
            style={{ color: 'var(--c-ink)', border: '1px solid transparent', borderRadius: 'var(--r-sm)' }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--c-border-strong)'}
            onBlur={e => e.currentTarget.style.borderColor = 'transparent'}
            value={L.name} onChange={e => up({ name: e.target.value })} />
          <span className="hidden md:flex items-center gap-1 text-xs shrink-0" style={{ color: 'var(--c-success)' }}>
            <Icon name="check" size={12} /> Enregistré
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden lg:block text-xs px-2.5 py-1.5"
            style={{ background: '#eef1f5', borderRadius: 'var(--r-md)', color: 'var(--c-muted)' }}>
            <strong style={{ color: 'var(--c-ink)' }}>{words}</strong> mots
          </span>
          <div className="hidden sm:flex items-center gap-0.5 text-xs" style={{ color: 'var(--c-muted)' }}>
            <button onClick={() => setZoom(z => Math.max(0.4, +(z - 0.1).toFixed(2)))}
              className="w-7 h-7 flex items-center justify-center hover:bg-gray-100" style={{ borderRadius: 'var(--r-sm)' }}>−</button>
            <span className="w-9 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(1.2, +(z + 0.1).toFixed(2)))}
              className="w-7 h-7 flex items-center justify-center hover:bg-gray-100" style={{ borderRadius: 'var(--r-sm)' }}>+</button>
          </div>
          <ExportPdfButton label="Télécharger en PDF" documentLabel="votre lettre"
            fileName={`Lettre de motivation ${L.recipient?.company || L.job?.title || ''}`.trim()} />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Panneau gauche */}
        <aside className="w-[420px] shrink-0 bg-white flex flex-col print:hidden"
          style={{ borderRight: '1px solid var(--c-border)' }}>
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
            {/* ── Texte ── */}
            {tab === 'body' && (
              <div className="flex flex-col gap-4">
                <div className={`note ${lengthNote.cls}`}>
                  <Icon name={lengthNote.icon} size={15} />
                  <span>{lengthNote.text}</span>
                </div>

                {L.body.map((p, i) => {
                  const meta = PARAGRAPH_KINDS[p.id] || { label: `Paragraphe ${i + 1}`, help: '' }
                  return (
                    <div key={p.id} className="p-3"
                      style={{ border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)' }}>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--c-muted)' }}>
                          {i + 1}. {meta.label}
                        </span>
                        <div className="flex gap-0.5" style={{ color: 'var(--c-faint)' }}>
                          <button onClick={() => movePara(i, -1)} disabled={i === 0} title="Monter"
                            className="w-6 h-6 flex items-center justify-center disabled:opacity-25"
                            style={{ borderRadius: 'var(--r-sm)' }}><Icon name="arrowUp" size={12} /></button>
                          <button onClick={() => movePara(i, 1)} disabled={i === L.body.length - 1} title="Descendre"
                            className="w-6 h-6 flex items-center justify-center disabled:opacity-25"
                            style={{ borderRadius: 'var(--r-sm)' }}><Icon name="arrowDown" size={12} /></button>
                        </div>
                      </div>
                      <p className="text-xs mb-2 leading-relaxed" style={{ color: 'var(--c-faint)' }}>{meta.help}</p>
                      <TextArea value={p.text} onChange={v => upPara(p.id, v)} rows={5}
                        placeholder="Rédigez ce paragraphe…"
                        actions={p.text?.trim().length > 30 ? [
                          <AIRewriteButton key="rw" text={p.text} field={`paragraphe « ${meta.label} » d'une lettre de motivation`}
                            jobTitle={L.job?.title} onApply={v => upPara(p.id, v)} />,
                        ] : null} />
                    </div>
                  )
                })}

                <div>
                  <span className="label">Ton de la lettre</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {LETTER_TONES.map(t => (
                      <button key={t.id} onClick={() => up({ tone: t.id })} title={t.desc}
                        className="px-2.5 py-1.5 text-xs font-semibold"
                        style={{
                          borderRadius: 'var(--r-md)',
                          background: L.tone === t.id ? 'var(--c-primary)' : '#eef1f5',
                          color: L.tone === t.id ? '#fff' : 'var(--c-body)',
                        }}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <p className="hint mt-1.5">
                    Le ton s'applique aux reformulations proposées, pas au texte déjà écrit.
                  </p>
                </div>
              </div>
            )}

            {/* ── Coordonnées ── */}
            {tab === 'infos' && (
              <div className="flex flex-col gap-6">
                <section>
                  <h2 className="label flex items-center gap-1.5">
                    <Icon name="user" size={13} /> Vous (expéditeur)
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    <TextInput label="Prénom" value={L.sender.firstName} onChange={v => upSender({ firstName: v })} />
                    <TextInput label="Nom" value={L.sender.lastName} onChange={v => upSender({ lastName: v })} />
                    <div className="col-span-2">
                      <TextInput label="Titre professionnel" value={L.sender.title} onChange={v => upSender({ title: v })} />
                    </div>
                    <TextInput label="Email" value={L.sender.email} onChange={v => upSender({ email: v })} />
                    <TextInput label="Téléphone" value={L.sender.phone} onChange={v => upSender({ phone: v })} />
                    <TextInput label="Ville" value={L.sender.location} onChange={v => upSender({ location: v })} />
                    <TextInput label="Adresse" value={L.sender.address} onChange={v => upSender({ address: v })} />
                  </div>
                </section>

                <section>
                  <h2 className="label flex items-center gap-1.5">
                    <Icon name="briefcase" size={13} /> Destinataire
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <TextInput label="Entreprise" value={L.recipient.company} onChange={v => upRecipient({ company: v })} />
                    </div>
                    <div className="col-span-2">
                      <TextInput label="Personne destinataire" hint="— sert de formule d'appel"
                        value={L.recipient.contact} onChange={v => upRecipient({ contact: v })}
                        placeholder="Ex : Madame Dupont" />
                    </div>
                    <TextInput label="Adresse" value={L.recipient.address} onChange={v => upRecipient({ address: v })} />
                    <TextInput label="Code postal, ville" value={L.recipient.city} onChange={v => upRecipient({ city: v })} />
                  </div>
                </section>

                <section>
                  <h2 className="label flex items-center gap-1.5">
                    <Icon name="target" size={13} /> Poste et objet
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <TextInput label="Poste visé" value={L.job.title} onChange={v => upJob({ title: v })} />
                    </div>
                    <TextInput label="Référence de l'offre" value={L.job.reference} onChange={v => upJob({ reference: v })} />
                    <TextInput label="Source de l'offre" value={L.job.source} onChange={v => upJob({ source: v })} />
                    <div className="col-span-2">
                      <TextInput label="Objet de la lettre" hint="— laissez vide pour l'objet automatique"
                        value={L.subject} onChange={v => up({ subject: v })}
                        placeholder={defaultSubject(L)} />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-medium mt-3 cursor-pointer"
                    style={{ color: 'var(--c-body)' }}>
                    <input type="checkbox" checked={L.showDate !== false} className="w-3.5 h-3.5"
                      style={{ accentColor: 'var(--c-primary)' }}
                      onChange={e => up({ showDate: e.target.checked })} />
                    Afficher le lieu et la date
                  </label>
                </section>
              </div>
            )}

            {/* ── Signature ── */}
            {tab === 'signature' && <SignaturePanel letter={L} onChange={patch => updateLetter(L.id, l => ({ signature: { ...l.signature, ...patch } }))} />}

            {/* ── Mise en page ── */}
            {tab === 'style' && (
              <div className="flex flex-col gap-6">
                <div>
                  <span className="label">Couleur du nom</span>
                  <div className="flex flex-wrap gap-2">
                    {ACCENTS.map(a => {
                      const sel = (L.theme?.accent || '#1f3a68') === a
                      return (
                        <button key={a} onClick={() => upTheme({ accent: a })} aria-label={a}
                          className="w-7 h-7 transition-transform hover:scale-105"
                          style={{
                            background: a, borderRadius: 'var(--r-sm)',
                            boxShadow: sel ? `0 0 0 2px #fff, 0 0 0 4px ${a}` : 'none',
                          }} />
                      )
                    })}
                  </div>
                </div>

                <div>
                  <span className="label">Police</span>
                  <div className="grid grid-cols-2 gap-2">
                    {FONTS.map(f => {
                      const sel = (L.theme?.font || 'serif') === f.id
                      return (
                        <button key={f.id} onClick={() => upTheme({ font: f.id })}
                          style={{
                            fontFamily: f.stack, borderRadius: 'var(--r-md)',
                            border: `1px solid ${sel ? 'var(--c-primary)' : 'var(--c-border-strong)'}`,
                            background: sel ? 'var(--c-primary-light)' : '#fff',
                            color: sel ? 'var(--c-primary)' : 'var(--c-body)',
                            fontWeight: sel ? 600 : 400,
                          }}
                          className="px-3 py-2.5 text-sm text-left">
                          {f.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <Slider label="Taille du texte" value={L.theme?.fontSize ?? 1} min={0.85} max={1.2} step={0.05}
                  onChange={v => upTheme({ fontSize: v })} />
                <Slider label="Espacement" value={L.theme?.spacing ?? 1} min={0.8} max={1.25} step={0.05}
                  onChange={v => upTheme({ spacing: v })} />

                <p className="note">
                  <Icon name="info" size={14} />
                  <span>Une lettre de motivation tient toujours sur une seule page. Réduisez l'espacement si le texte débordait.</span>
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* Aperçu */}
        <div className="flex-1 overflow-auto flex justify-center py-8 px-4 print:p-0 print:overflow-visible">
          <div style={{ width: 794 * zoom, height: 'fit-content' }}>
            <LetterPreview letter={L} scale={zoom} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Panneau de signature ────────────────────────────────────────────────────
function SignaturePanel({ letter, onChange }) {
  const sig = letter.signature || { mode: 'none', font: 'cursive', size: 1 }
  const [error, setError] = useState('')
  const fullName = [letter.sender?.firstName, letter.sender?.lastName].filter(Boolean).join(' ')

  const handleFile = (file) => {
    setError('')
    if (!file) return
    if (!/^image\/(png|jpeg|jpg|webp)$/.test(file.type)) {
      setError('Formats acceptés : PNG, JPEG ou WebP.')
      return
    }
    // Le fichier est converti en données intégrées, stockées avec la lettre
    // dans le navigateur : rien n'est envoyé sur un serveur.
    if (file.size > 1.5 * 1024 * 1024) {
      setError('Image trop lourde (1,5 Mo maximum). Recadrez-la ou réduisez sa taille.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => onChange({ image: String(reader.result), mode: 'image' })
    reader.onerror = () => setError("La lecture du fichier a échoué.")
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <span className="label">Type de signature</span>
        <div className="flex flex-col gap-2">
          {SIGNATURE_MODES.map(m => (
            <button key={m.id} onClick={() => onChange({ mode: m.id })}
              className="text-left p-3 transition-colors"
              style={{
                border: `1px solid ${sig.mode === m.id ? 'var(--c-primary)' : 'var(--c-border-strong)'}`,
                background: sig.mode === m.id ? 'var(--c-primary-light)' : '#fff',
                borderRadius: 'var(--r-md)',
              }}>
              <span className="flex items-center gap-2 text-sm font-semibold"
                style={{ color: sig.mode === m.id ? 'var(--c-primary)' : 'var(--c-ink)' }}>
                {m.label}
                {sig.mode === m.id && <Icon name="check" size={14} />}
              </span>
              <span className="block text-xs mt-0.5" style={{ color: 'var(--c-muted)' }}>{m.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Nom manuscrit */}
      {sig.mode === 'handwritten' && (
        <div>
          <span className="label">Style d'écriture</span>
          {!fullName && (
            <div className="note note-warn mb-2">
              <Icon name="alert" size={14} />
              <span>Renseignez votre prénom et votre nom dans l'onglet Coordonnées pour voir la signature.</span>
            </div>
          )}
          <div className="flex flex-col gap-2">
            {HANDWRITING_FONTS.map(f => (
              <button key={f.id} onClick={() => onChange({ font: f.id })}
                className="flex items-center justify-between gap-3 px-3 py-2.5 transition-colors"
                style={{
                  border: `1px solid ${sig.font === f.id ? 'var(--c-primary)' : 'var(--c-border-strong)'}`,
                  background: sig.font === f.id ? 'var(--c-primary-light)' : '#fff',
                  borderRadius: 'var(--r-md)',
                }}>
                <span className="text-xs font-semibold" style={{ color: 'var(--c-muted)' }}>{f.label}</span>
                <span style={{ fontFamily: f.stack, fontSize: 19, color: '#1a2f52' }}>
                  {fullName || 'Votre nom'}
                </span>
              </button>
            ))}
          </div>
          <p className="hint mt-2">
            Une signature en police manuscrite n'a pas de valeur juridique, mais reste
            courante et bien acceptée sur une lettre de candidature.
          </p>
        </div>
      )}

      {/* Image importée */}
      {sig.mode === 'image' && (
        <div>
          <span className="label">Image de votre signature</span>
          {sig.image ? (
            <div className="p-3 text-center" style={{ border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', background: '#fbfcfd' }}>
              <img src={sig.image} alt="Aperçu de la signature"
                style={{ maxHeight: 70, maxWidth: '100%', objectFit: 'contain', margin: '0 auto' }} />
              <button onClick={() => onChange({ image: null })}
                className="text-xs underline mt-2" style={{ color: 'var(--c-danger)' }}>
                Retirer cette image
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center gap-2 p-6 cursor-pointer text-center transition-colors"
              style={{ border: '1px dashed var(--c-border-strong)', borderRadius: 'var(--r-md)', background: '#fbfcfd' }}>
              <Icon name="upload" size={20} style={{ color: 'var(--c-muted)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--c-ink)' }}>
                Choisir une image
              </span>
              <span className="text-xs" style={{ color: 'var(--c-muted)' }}>
                PNG, JPEG ou WebP · 1,5 Mo maximum
              </span>
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                onChange={e => handleFile(e.target.files?.[0])} />
            </label>
          )}

          {error && (
            <div className="note note-warn mt-2">
              <Icon name="alert" size={14} />
              <span>{error}</span>
            </div>
          )}

          <div className="note mt-3">
            <Icon name="info" size={14} />
            <span>
              Pour un rendu net : signez sur une feuille blanche au stylo noir, photographiez-la
              bien à plat en pleine lumière, puis recadrez au plus près du trait. Une image
              PNG à fond transparent donne le meilleur résultat.
            </span>
          </div>
        </div>
      )}

      {/* Taille */}
      {sig.mode !== 'none' && (
        <Slider label="Taille de la signature" value={sig.size ?? 1} min={0.6} max={1.6} step={0.1}
          onChange={v => onChange({ size: v })} />
      )}

      <div className="note">
        <Icon name="shield" size={14} />
        <span>
          Votre signature est enregistrée uniquement dans ce navigateur, avec la lettre.
          Elle n'est envoyée à aucun serveur.
        </span>
      </div>
    </div>
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
