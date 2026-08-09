'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import AppHeader from '@/components/ui/AppHeader'
import Icon from '@/components/ui/Icon'
import { buildBackup, parseBackup, downloadBackup, mergeBackup, humanSize } from '@/lib/backup'
import {
  generateTransferCode, formatCode, normalizeCode, isCompleteCode,
  deriveStorageId, encryptPayload, decryptPayload,
} from '@/lib/transferCrypto'

export default function TransfertPage() {
  const router = useRouter()
  const { cvs, letters, setCvs, setLetters, isInitialized } = useApp()

  const [service, setService] = useState(null)
  const [code, setCode] = useState(null)
  const [expiresAt, setExpiresAt] = useState(null)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [inputCode, setInputCode] = useState('')
  const fileRef = useRef()

  useEffect(() => {
    fetch('/api/transfert').then(r => r.json()).then(setService).catch(() => setService({ available: false }))
  }, [])

  // Un lien de transfert place le code dans le fragment (#), qui n'est jamais
  // transmis au serveur par le navigateur.
  useEffect(() => {
    const fromHash = normalizeCode(window.location.hash.replace('#', ''))
    if (fromHash.length > 0) {
      setInputCode(fromHash)
      history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  if (!isInitialized) {
    return <div className="min-h-screen flex items-center justify-center">
      <Icon name="clock" size={28} className="animate-spin" style={{ color: 'var(--c-muted)' }} />
    </div>
  }

  const total = cvs.length + letters.length
  const payload = JSON.stringify(buildBackup({ cvs, letters }))

  // ── Déposer : on chiffre AVANT d'envoyer quoi que ce soit ──
  const generate = async () => {
    setBusy('generate'); setError(''); setNotice('')
    try {
      for (let attempt = 0; attempt < 3; attempt++) {
        const newCode = generateTransferCode()
        const id = await deriveStorageId(newCode)
        const encrypted = await encryptPayload(payload, newCode)

        const res = await fetch('/api/transfert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, payload: encrypted }),
        })
        const json = await res.json()

        if (res.status === 409) continue          // identifiant déjà pris : on retire
        if (!res.ok) throw new Error(json.error)

        setCode(newCode)
        setExpiresAt(json.expiresAt)
        return
      }
      throw new Error('Impossible de générer un code disponible. Réessayez.')
    } catch (e) { setError(e.message) } finally { setBusy('') }
  }

  // ── Récupérer : le serveur ne renvoie que du chiffré, on déchiffre ici ──
  const retrieve = async () => {
    setBusy('retrieve'); setError(''); setNotice('')
    try {
      const clean = normalizeCode(inputCode)
      const id = await deriveStorageId(clean)

      const res = await fetch('/api/transfert', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      const plain = await decryptPayload(json.payload, clean)
      applyBackup(parseBackup(plain))
      setInputCode('')
    } catch (e) { setError(e.message) } finally { setBusy('') }
  }

  const restoreFile = async (file) => {
    setError(''); setNotice('')
    if (!file) return
    try { applyBackup(parseBackup(await file.text())) } catch (e) { setError(e.message) }
  }

  const applyBackup = ({ cvs: inCvs, letters: inLetters }) => {
    setCvs(prev => mergeBackup(prev, inCvs))
    setLetters(prev => mergeBackup(prev, inLetters))
    setNotice(`${inCvs.length} CV et ${inLetters.length} lettre${inLetters.length > 1 ? 's' : ''} récupérés. Les documents déjà présents ont été conservés : les nouveaux s'ajoutent à côté.`)
  }

  const copy = (text, label) => {
    navigator.clipboard?.writeText(text).then(() => setNotice(`${label} copié.`), () => {})
  }

  const transferLink = code ? `${window.location.origin}/transfert#${code}` : ''

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="max-w-3xl mx-auto px-6 py-9">
        <h1 className="text-xl font-semibold mb-1.5">Retrouver mes documents sur un autre appareil</h1>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--c-body)' }}>
          Vos CV et vos lettres sont enregistrés dans le navigateur de cet appareil.
          Pour les ouvrir ailleurs, générez un code de transfert ici et saisissez-le là-bas.
          Aucun compte n'est nécessaire.
        </p>

        {/* Garantie de confidentialité, mise en avant */}
        <div className="note note-success mb-6">
          <Icon name="shield" size={16} />
          <span>
            <strong>Vos documents sont chiffrés sur cet appareil avant d'être envoyés.</strong>{' '}
            La clé de déchiffrement est votre code de transfert, qui n'est jamais transmis :
            le serveur ne stocke qu'un bloc illisible pour lui. Personne d'autre que vous,
            y compris l'administrateur du site, ne peut lire vos données.
          </span>
        </div>

        {notice && (
          <div className="note note-success mb-5">
            <Icon name="checkCircle" size={15} /><span>{notice}</span>
          </div>
        )}
        {error && (
          <div className="note note-warn mb-5">
            <Icon name="alert" size={15} /><span>{error}</span>
          </div>
        )}

        {/* ── Étape 1 ── */}
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
            <div>
              <div className="text-center p-5" style={{ background: 'var(--c-primary-light)', borderRadius: 'var(--r-md)' }}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--c-primary)' }}>
                  Votre code de transfert
                </p>
                <p className="font-bold" style={{ fontSize: 27, letterSpacing: 3, color: 'var(--c-primary)', fontFamily: 'ui-monospace, monospace' }}>
                  {formatCode(code)}
                </p>
                <p className="text-xs mt-2.5" style={{ color: 'var(--c-body)' }}>
                  Valable jusqu'au {new Date(expiresAt).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}
                </p>
                <div className="flex justify-center flex-wrap gap-2 mt-4">
                  <button onClick={() => copy(formatCode(code), 'Code')} className="btn-secondary !py-2">
                    <Icon name="copy" size={14} /> Copier le code
                  </button>
                  <button onClick={() => copy(transferLink, 'Lien')} className="btn-secondary !py-2">
                    <Icon name="link" size={14} /> Copier un lien direct
                  </button>
                  <button onClick={generate} disabled={busy === 'generate'} className="btn-secondary !py-2">
                    <Icon name="clock" size={14} /> Nouveau code
                  </button>
                </div>
              </div>
              <p className="hint mt-3">
                Notez ce code, puis ouvrez ce site sur l'autre appareil et saisissez-le à l'étape 2.
                Le lien direct contient le code après le signe <strong>#</strong> : cette partie
                de l'adresse n'est jamais envoyée aux serveurs. Ne le partagez qu'avec vous-même.
              </p>
            </div>
          ) : (
            <button onClick={generate} disabled={busy === 'generate' || total === 0} className="btn-primary w-full">
              {busy === 'generate'
                ? <><Icon name="clock" size={15} className="animate-spin" /> Chiffrement en cours…</>
                : <><Icon name="shield" size={15} /> Chiffrer et générer mon code</>}
            </button>
          )}
        </section>

        {/* ── Étape 2 ── */}
        <section className="card p-5 mb-4">
          <div className="flex items-start gap-3 mb-4">
            <Step n={2} />
            <div>
              <h2 className="text-sm font-semibold">Sur l'autre appareil : saisir le code</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--c-muted)' }}>
                Ouvrez cette même page depuis l'autre ordinateur ou téléphone, puis entrez les 12 caractères.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              aria-label="Code de transfert" autoComplete="off" spellCheck={false}
              className="input text-center font-bold"
              style={{ fontSize: 18, letterSpacing: 2, fontFamily: 'ui-monospace, monospace' }}
              placeholder="ABCD-EFGH-JKLM"
              value={formatCode(normalizeCode(inputCode))}
              onChange={e => setInputCode(normalizeCode(e.target.value))}
              onKeyDown={e => e.key === 'Enter' && isCompleteCode(inputCode) && retrieve()}
              disabled={service && !service.available}
            />
            <button onClick={retrieve}
              disabled={busy === 'retrieve' || !isCompleteCode(inputCode) || (service && !service.available)}
              className="btn-primary shrink-0">
              {busy === 'retrieve'
                ? <Icon name="clock" size={15} className="animate-spin" />
                : <><Icon name="download" size={15} /> Récupérer</>}
            </button>
          </div>
          <p className="hint mt-2">
            Les lettres ambiguës (I, O, L) ne sont pas utilisées : en cas de doute, il s'agit
            du chiffre 1 ou 0. Les documents récupérés s'ajoutent aux existants, rien n'est effacé.
          </p>
        </section>

        {/* ── Sauvegarde par fichier ── */}
        <section className="card p-5">
          <h2 className="text-sm font-semibold mb-1">Autre méthode : la sauvegarde par fichier</h2>
          <p className="text-xs mb-4 leading-relaxed" style={{ color: 'var(--c-muted)' }}>
            Téléchargez un fichier contenant tous vos documents, à conserver où vous voulez
            (clé USB, envoi à votre propre adresse email). Aucune donnée ne transite par
            un serveur, et le fichier n'expire jamais. En contrepartie, ce fichier n'est pas
            chiffré : gardez-le en lieu sûr.
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            <button onClick={() => downloadBackup(buildBackup({ cvs, letters }))} disabled={total === 0} className="btn-secondary">
              <Icon name="download" size={15} /> Télécharger ma sauvegarde
            </button>
            <button onClick={() => fileRef.current?.click()} className="btn-secondary">
              <Icon name="upload" size={15} /> Restaurer un fichier
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden"
              onChange={e => { restoreFile(e.target.files?.[0]); e.target.value = '' }} />
          </div>
        </section>

        {/* Détail technique */}
        <details className="mt-5">
          <summary className="text-xs font-semibold cursor-pointer" style={{ color: 'var(--c-primary)' }}>
            Comment fonctionne la protection de mes données ?
          </summary>
          <div className="note mt-2">
            <Icon name="shield" size={15} />
            <span>
              Votre code de transfert sert à deux choses, calculées dans votre navigateur.
              D'un côté, une empreinte à sens unique qui sert d'étiquette au dépôt : c'est
              la seule chose que le serveur reçoit, et elle ne permet pas de retrouver le code.
              De l'autre, une clé de chiffrement (AES-256) qui protège vos documents avant leur envoi.
              Le serveur ne conserve donc qu'un bloc chiffré, effacé automatiquement au bout de
              {' '}{service?.ttlHours ?? 24} heures. Le nombre de tentatives est limité par code
              et par appareil, pour empêcher qu'on essaie des codes au hasard. Sans votre code,
              les données sont inexploitables — y compris pour l'administrateur du site.
            </span>
          </div>
        </details>

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
