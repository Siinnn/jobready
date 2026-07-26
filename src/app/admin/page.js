'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import AppHeader from '@/components/ui/AppHeader'
import Icon from '@/components/ui/Icon'

function AdminContent() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('suivant') || '/dashboard'

  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [session, setSession] = useState(null)

  useEffect(() => {
    fetch('/api/admin/session')
      .then(r => r.json())
      .then(setSession)
      .catch(() => setSession({ authenticated: false, configured: false }))
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      router.push(next)
    } catch (e) {
      setError(e.message)
      setCode('')
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    await fetch('/api/admin/session', { method: 'DELETE' })
    setSession({ ...session, authenticated: false })
  }

  // Déjà connecté
  if (session?.authenticated) {
    return (
      <div className="card p-6 max-w-md mx-auto">
        <div className="flex items-start gap-3 mb-5">
          <Icon name="shield" size={22} style={{ color: 'var(--c-success)', marginTop: 2 }} />
          <div>
            <h1 className="text-lg font-semibold">Espace administrateur</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--c-muted)' }}>
              Connecté en tant que <strong>{session.name}</strong>.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={() => router.push('/dashboard')} className="btn-primary">
            <Icon name="search" size={15} /> Recherche d'offres
          </button>
          <button onClick={() => router.push('/offer-analyzer')} className="btn-secondary">
            <Icon name="target" size={15} /> Analyser une offre précise
          </button>
          <button onClick={logout} className="btn-ghost mt-2 text-xs">
            Se déconnecter
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6 max-w-md mx-auto">
      <div className="w-10 h-10 flex items-center justify-center mb-4"
        style={{ background: 'var(--c-primary-light)', color: 'var(--c-primary)', borderRadius: 'var(--r-md)' }}>
        <Icon name="shield" size={20} />
      </div>
      <h1 className="text-lg font-semibold mb-1.5">Espace administrateur</h1>
      <p className="text-sm mb-5 leading-relaxed" style={{ color: 'var(--c-muted)' }}>
        Cette partie regroupe les outils de recherche et d'analyse d'offres, réservés à
        l'administration du site. Les demandeurs d'emploi utilisent les modules CV et
        lettres de motivation, en accès libre.
      </p>

      {session && !session.configured && (
        <div className="note note-warn mb-4">
          <Icon name="alert" size={15} />
          <span>
            Aucun code administrateur n'est configuré. Renseignez <code>ADMIN_CODE</code> dans
            le fichier <code>.env.local</code> (6 caractères minimum), puis relancez le serveur.
          </span>
        </div>
      )}

      <form onSubmit={submit}>
        <label className="label" htmlFor="admin-code">Code d'accès</label>
        <input id="admin-code" type="password" className="input" value={code} autoComplete="current-password"
          onChange={e => setCode(e.target.value)} placeholder="••••••••••" />

        {error && (
          <div className="note note-warn mt-3">
            <Icon name="alert" size={15} />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" disabled={loading || !code.trim() || (session && !session.configured)}
          className="btn-primary w-full mt-4">
          {loading ? <><Icon name="clock" size={15} className="animate-spin" /> Vérification…</> : 'Se connecter'}
        </button>
      </form>

      <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--c-border)' }}>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--c-muted)' }}>
          Vous cherchez un emploi ?{' '}
          <button onClick={() => router.push('/offres')} className="underline font-semibold"
            style={{ color: 'var(--c-primary)' }}>
            Consultez les offres sur France Travail
          </button>, et préparez votre candidature avec les modules{' '}
          <button onClick={() => router.push('/mes-cv')} className="underline" style={{ color: 'var(--c-primary)' }}>CV</button>
          {' '}et{' '}
          <button onClick={() => router.push('/mes-lettres')} className="underline" style={{ color: 'var(--c-primary)' }}>lettres</button>.
        </p>
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-6 py-12">
        <Suspense fallback={null}>
          <AdminContent />
        </Suspense>
      </main>
    </div>
  )
}
