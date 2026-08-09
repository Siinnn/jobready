'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import AppHeader from '@/components/ui/AppHeader'
import Icon from '@/components/ui/Icon'
import { buildBackup, parseBackup, downloadBackup, mergeBackup, humanSize } from '@/lib/backup'

export default function TransfertPage() {
  const router = useRouter()
  const { cvs, letters, setCvs, setLetters, isInitialized } = useApp()

  const [service, setService] = useState(null)     // { available, ttlHours }
  const [code, setCode] = useState(null)           // code généré sur cet appareil
  const [expiresAt, setExpiresAt] = useState(null)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [inputCode, setInputCode] = useState('')
  const fileRef = useRef()

  useEffect(() => {
    fetch('/api/transfert').then(r => r.json()).then(setService).catch(() => setService({ available: false }))
  }, [])

  if (!isInitialized) {
    return <div className="min-h-screen flex items-center justify-center">
      <Icon name="clock" size={28} className="animate-spin" style={{ color: 'var(--c-muted)' }} />
    </div>
  }

  const total = cvs.length + letters.length
  const backup = buildBackup({ cvs, letters })
  const payload = JSON.stringify(backup)

  // ── Générer un code ──
  const generate = async () => {
    setBusy('generate'); setError(''); setNotice('')
    try {
      const res = await fetch('/api/transfert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setCode(json.code)
      setExpiresAt(json.expiresAt)
    } catch (e) { setError(e.message) } finally { setBusy('') }
  }

  // ── Récupérer avec un code ──
  const retrieve = async () => {
    setBusy('retrieve'); setError(''); setNotice('')
    try {
      const res = await fetch('/api/transfert', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inputCode }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      applyBackup(parseBackup(json.payload))
      setInputCode('')
    } catch (e) { setError(e.message) } finally { setBusy('') }
  }

  // ── Restaurer un fichier ──
  const restoreFile = async (file) => {
    setError(''); setNotice('')
    if (!file) return
    try {
      applyBackup(parseBackup(await file.text()))
    } catch (e) { setError(e.message) }
  }

  const applyBackup = ({ cvs: inCvs, letters: inLetters }) => {
    setCvs(prev => mergeBackup(prev, inCvs))
    setLetters(prev => mergeBackup(prev, inLetters))
    setNotice(`${inCvs.length} CV et ${inLetters.length} lettre${inLetters.length > 1 ? 's' : ''} récupérés. Les documents déjà présents ont été conservés : les nouveaux sont ajoutés à côté.`)
  }

  const copyCode = () => {
    navigator.clipboard?.writeText(code).then(
      () => setNotice('Code copié.'),
      () => {}
    )
  }

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="max-w-3xl mx-auto px-6 py-9">
        <h1 className="text-xl font-semibold mb-1.5">Retrouver mes documents sur un autre appareil</h1>
        <p className="text-sm mb-7 leading-relaxed" style={{ color: 'var(--c-body)' }}>
          Vos CV et vos lettres sont enregistrés dans le navigateur de cet appareil.
          Pour les ouvrir sur un autre ordinateur ou sur votre téléphone, générez un code
          de transfert ici, puis saisissez-le là-bas. Aucun compte n'est nécessaire.
        </p>

        {notice && (
          <div className="note note-success mb-5">
            <Icon name="checkCircle" size={15} />
            <span>{notice}</span>
          </div>
        )}
        {error && (
          <div className="note note-warn mb-5">
            <Icon name="alert" size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* ── Étape 1 : sur cet appareil ── */}
        <section className="card p-5 mb-4">
          <div className="flex items-start gap-3 mb-4">
            <Step n={1} />
            <div>
              <h2 className="text-sm font-semibold">Sur cet appareil : obtenir un code</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--c-muted)' }}>
                {total === 0
                  ? "Vous n'avez encore aucun document à transférer."
                  : `${cvs.length} CV et ${letters.length} lettre${letters.length > 1 ? 's' : ''} seront transférés (${humanSize(payload)}).`}
              </p>
            </div>
          </div>

          {service && !service.available ? (
            <div className="note">
              <Icon name="info" size={15} />
              <span>
                Le transfert par code n'est pas activé sur cette instance.
                Utilisez la <strong>sauvegarde par fichier</strong> plus bas : elle fonctionne
                dans tous les cas et ne fait transiter aucune donnée.
              </span>
            </div>
          ) : code ? (
            <div className="text-center p-5" style={{ background: 'var(--c-primary-light)', borderRadius: 'var(--r-md)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--c-primary)' }}>
                Votre code de transfert
              </p>
              <p className="font-bold tabular-nums" style={{ fontSize: 38, letterSpacing: 6, color: 'var(--c-primary)' }}>
                {code.slice(0, 3)} {code.slice(3)}
              </p>
              <p className="text-xs mt-2" style={{ color: 'var(--c-body)' }}>
                Valable jusqu'au {new Date(expiresAt).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}
              </p>
              <div className="flex justify-center gap-2 mt-4">
                <button onClick={copyCode} className="btn-secondary !py-2">
                  <Icon name="copy" size={14} /> Copier
                </button>
                <button onClick={generate} disabled={busy === 'generate'} className="btn-secondary !py-2">
                  <Icon name="clock" size={14} /> Nouveau code
                </button>
              </div>
              <p className="text-xs mt-4 leading-relaxed" style={{ color: 'var(--c-muted)' }}>
                Notez ce code, puis ouvrez ce site sur l'autre appareil et saisissez-le à l'étape 2.
              </p>
            </div>
          ) : (
            <button onClick={generate} disabled={busy === 'generate' || total === 0} className="btn-primary w-full">
              {busy === 'generate'
                ? <><Icon name="clock" size={15} className="animate-spin" /> Préparation…</>
                : <><Icon name="upload" size={15} /> Générer mon code de transfert</>}
            </button>
          )}
        </section>

        {/* ── Étape 2 : sur l'autre appareil ── */}
        <section className="card p-5 mb-4">
          <div className="flex items-start gap-3 mb-4">
            <Step n={2} />
            <div>
              <h2 className="text-sm font-semibold">Sur l'autre appareil : saisir le code</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--c-muted)' }}>
                Ouvrez cette même page depuis l'autre ordinateur ou téléphone, puis entrez les 6 chiffres.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              inputMode="numeric" maxLength={7} aria-label="Code de transfert à 6 chiffres"
              className="input text-center font-bold tabular-nums"
              style={{ fontSize: 22, letterSpacing: 5 }}
              placeholder="000 000"
              value={inputCode}
              onChange={e => setInputCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={e => e.key === 'Enter' && inputCode.length === 6 && retrieve()}
              disabled={service && !service.available}
            />
            <button onClick={retrieve} disabled={busy === 'retrieve' || inputCode.length !== 6 || (service && !service.available)}
              className="btn-primary shrink-0">
              {busy === 'retrieve'
                ? <Icon name="clock" size={15} className="animate-spin" />
                : <><Icon name="download" size={15} /> Récupérer</>}
            </button>
          </div>
          <p className="hint mt-2">
            Les documents récupérés s'ajoutent à ceux déjà présents sur l'appareil : rien n'est effacé.
          </p>
        </section>

        {/* ── Sauvegarde par fichier ── */}
        <section className="card p-5">
          <h2 className="text-sm font-semibold mb-1">Autre méthode : la sauvegarde par fichier</h2>
          <p className="text-xs mb-4 leading-relaxed" style={{ color: 'var(--c-muted)' }}>
            Téléchargez un fichier contenant tous vos documents, à conserver où vous voulez
            (clé USB, envoi à votre propre adresse email). Aucune donnée ne transite par
            un serveur, et le fichier n'expire jamais.
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            <button onClick={() => downloadBackup(backup)} disabled={total === 0} className="btn-secondary">
              <Icon name="download" size={15} /> Télécharger ma sauvegarde
            </button>
            <button onClick={() => fileRef.current?.click()} className="btn-secondary">
              <Icon name="upload" size={15} /> Restaurer un fichier
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden"
              onChange={e => { restoreFile(e.target.files?.[0]); e.target.value = '' }} />
          </div>
        </section>

        {/* Confidentialité */}
        <div className="note mt-5">
          <Icon name="shield" size={15} />
          <span>
            <strong>Ce qui se passe avec vos données.</strong> En temps normal, elles ne quittent
            jamais votre navigateur. Si vous générez un code de transfert, une copie chiffrée en
            transit est déposée sur un serveur, associée à ce code seul, et
            <strong> supprimée automatiquement au bout de {service?.ttlHours ?? 24} heures</strong>.
            Le nombre d'essais par code est limité. La sauvegarde par fichier, elle, ne fait
            transiter aucune donnée.
          </span>
        </div>

        <div className="flex justify-center mt-6">
          <button onClick={() => router.push('/mes-cv')} className="btn-ghost text-xs">
            <Icon name="arrowLeft" size={14} /> Retour à mes documents
          </button>
        </div>
      </main>
    </div>
  )
}

function Step({ n }) {
  return (
    <span className="w-6 h-6 flex items-center justify-center shrink-0 text-xs font-bold"
      style={{ background: 'var(--c-primary)', color: '#fff', borderRadius: '50%' }}>
      {n}
    </span>
  )
}
