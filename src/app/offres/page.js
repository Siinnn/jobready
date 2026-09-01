'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import AppHeader from '@/components/ui/AppHeader'
import Icon from '@/components/ui/Icon'

const FT_SEARCH = 'https://candidat.francetravail.fr/offres/recherche'

// Redirige vers la recherche d'offres de France Travail, en pré-remplissant
// les critères depuis le CV actif quand c'est possible.
function franceTravailUrl({ keywords, location, contract }) {
  const p = new URLSearchParams()
  if (keywords?.trim()) p.set('motsCles', keywords.trim())
  if (location?.trim()) p.set('lieux', location.trim())
  if (contract) p.set('typeContrat', contract)
  p.set('offresPartenaires', 'true')
  p.set('range', '0-19')
  const qs = p.toString()
  return qs ? `${FT_SEARCH}?${qs}` : FT_SEARCH
}

const CONTRACTS = [
  { id: '',    label: 'Tous types de contrat' },
  { id: 'CDI', label: 'CDI' },
  { id: 'CDD', label: 'CDD' },
  { id: 'MIS', label: 'Intérim' },
  { id: 'SAI', label: 'Saisonnier' },
]

const OTHER_SITES = [
  { name: 'France Travail', url: FT_SEARCH, desc: "Le service public de l'emploi : le plus grand volume d'offres, dont celles de ses partenaires." },
  { name: 'APEC', url: 'https://www.apec.fr/candidat/recherche-emploi.html', desc: "Offres cadres et jeunes diplômés." },
  { name: 'Indeed', url: 'https://fr.indeed.com/', desc: "Moteur de recherche agrégeant de nombreux sites d'emploi." },
  { name: 'Mon Compte Formation', url: 'https://www.moncompteformation.gouv.fr/', desc: "Pour financer une formation et élargir vos candidatures." },
]

export default function OffresPage() {
  const router = useRouter()
  const { activeCv, cvs } = useApp()
  const d = activeCv?.data

  const [keywords, setKeywords] = useState(d?.title || '')
  const [location, setLocation] = useState(d?.location || '')
  const [contract, setContract] = useState('')

  const go = () => {
    window.open(franceTravailUrl({ keywords, location, contract }), '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="max-w-4xl mx-auto px-6 py-9">
        <h1 className="font-display font-semibold mb-1.5 hero-in" style={{ fontSize: 'clamp(1.4rem, 2.6vw, 1.75rem)' }}>
          Rechercher des offres d'emploi
        </h1>
        <p className="text-sm mb-7 leading-relaxed max-w-2xl" style={{ color: 'var(--c-body)' }}>
          Les offres ne sont pas hébergées ici : la recherche s'effectue directement sur
          <strong> France Travail</strong>, où les annonces sont à jour et où vous pouvez
          postuler avec votre espace personnel. Préparez votre CV et votre lettre ici,
          puis candidatez là-bas.
        </p>

        {/* Recherche */}
        <section className="card p-5 mb-6">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Icon name="search" size={15} style={{ color: 'var(--c-primary)' }} />
            Lancer une recherche sur France Travail
          </h2>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="kw">Métier ou mot-clé</label>
              <input id="kw" className="input" value={keywords} onChange={e => setKeywords(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && go()}
                placeholder="Ex : préparateur de commandes" />
            </div>
            <div>
              <label className="label" htmlFor="loc">Ville ou département</label>
              <input id="loc" className="input" value={location} onChange={e => setLocation(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && go()}
                placeholder="Ex : Lyon" />
            </div>
            <div>
              <label className="label" htmlFor="ct">Type de contrat</label>
              <select id="ct" className="input" value={contract} onChange={e => setContract(e.target.value)}>
                {CONTRACTS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={go} className="btn-primary w-full">
                <Icon name="search" size={15} /> Voir les offres
                <Icon name="arrowRight" size={13} />
              </button>
            </div>
          </div>

          {d?.title && (
            <p className="hint mt-3">
              Critères pré-remplis depuis votre CV « {activeCv.name} ». Modifiez-les librement.
            </p>
          )}

          {/* Suggestions issues du CV */}
          {(d?.searchKeywords?.length > 0 || d?.targetRoles?.length > 0) && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--c-border)' }}>
              <span className="label">Suggestions d'après votre CV</span>
              <div className="flex flex-wrap gap-1.5">
                {[...new Set([...(d.targetRoles || []), ...(d.searchKeywords || [])])].slice(0, 8).map(kw => (
                  <button key={kw} onClick={() => setKeywords(kw)}
                    className="badge badge-neutral hover:opacity-75">
                    {kw}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Préparer sa candidature */}
        <section className="card p-5 mb-6">
          <h2 className="text-sm font-semibold mb-1.5">Avant de postuler</h2>
          <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--c-muted)' }}>
            Une candidature retenue commence par un CV lisible et une lettre adaptée à l'offre.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <button onClick={() => router.push(cvs.length ? '/mes-cv' : '/creer')}
              className="flex items-start gap-3 p-3.5 text-left transition-colors"
              style={{ border: '1px solid var(--c-border-strong)', borderRadius: 'var(--r-md)' }}>
              <Icon name="file" size={17} style={{ color: 'var(--c-primary)', marginTop: 2 }} />
              <span>
                <span className="block text-sm font-semibold" style={{ color: 'var(--c-ink)' }}>
                  {cvs.length ? 'Vérifier mon CV' : 'Créer mon CV'}
                </span>
                <span className="block text-xs mt-0.5" style={{ color: 'var(--c-muted)' }}>
                  Contrôle de lisibilité ATS et export PDF
                </span>
              </span>
            </button>
            <button onClick={() => router.push('/mes-lettres')}
              className="flex items-start gap-3 p-3.5 text-left transition-colors"
              style={{ border: '1px solid var(--c-border-strong)', borderRadius: 'var(--r-md)' }}>
              <Icon name="mail" size={17} style={{ color: 'var(--c-primary)', marginTop: 2 }} />
              <span>
                <span className="block text-sm font-semibold" style={{ color: 'var(--c-ink)' }}>
                  Préparer une lettre
                </span>
                <span className="block text-xs mt-0.5" style={{ color: 'var(--c-muted)' }}>
                  Une lettre par offre, en quelques minutes
                </span>
              </span>
            </button>
          </div>
        </section>

        {/* Autres sites */}
        <section>
          <h2 className="text-sm font-semibold mb-3">Autres sites utiles</h2>
          <ul className="card divide-y" style={{ borderColor: 'var(--c-border)' }}>
            {OTHER_SITES.map(s => (
              <li key={s.name}>
                <a href={s.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 transition-colors hover:bg-gray-50">
                  <Icon name="link" size={15} style={{ color: 'var(--c-muted)' }} />
                  <span className="flex-1">
                    <span className="block text-sm font-semibold" style={{ color: 'var(--c-ink)' }}>{s.name}</span>
                    <span className="block text-xs mt-0.5" style={{ color: 'var(--c-muted)' }}>{s.desc}</span>
                  </span>
                  <Icon name="arrowRight" size={14} style={{ color: 'var(--c-faint)' }} />
                </a>
              </li>
            ))}
          </ul>
          <p className="text-xs mt-4 leading-relaxed" style={{ color: 'var(--c-faint)' }}>
            Ces liens ouvrent des sites externes. JobReady n'est affilié à aucun d'entre eux
            et ne collecte aucune donnée sur vos recherches.
          </p>
        </section>
      </main>
    </div>
  )
}
