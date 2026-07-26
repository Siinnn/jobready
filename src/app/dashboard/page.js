'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import JobCard from '@/components/JobCard'

const FRANCE_LOCATIONS = [
  "Auvergne-Rhône-Alpes", "Bourgogne-Franche-Comté", "Bretagne", "Centre-Val de Loire", 
  "Corse", "Grand Est", "Hauts-de-France", "Île-de-France", "Normandie", "Nouvelle-Aquitaine", 
  "Occitanie", "Pays de la Loire", "Provence-Alpes-Côte d'Azur",
  "Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Montpellier", "Strasbourg", 
  "Bordeaux", "Lille", "Rennes", "Reims", "Saint-Étienne", "Le Havre", "Toulon", 
  "Grenoble", "Dijon", "Angers", "Nîmes", "Villeurbanne", "Aix-en-Provence", "Le Mans", 
  "Clermont-Ferrand", "Brest", "Tours", "Amiens", "Limoges", "Annecy", "Perpignan", 
  "Boulogne-Billancourt", "Metz", "Besançon", "Orléans", "Rouen", "Mulhouse", "Caen"
]

export default function Dashboard() {
  const router = useRouter()
  const { profile, setProfile, resetProfile, isInitialized } = useApp()
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  // Filtres
  const [keywords, setKeywords] = useState('')
  const [location, setLocation] = useState('Paris')
  const [contractType, setContractType] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')

  // Pré-remplir les mots-clés quand le profil est chargé
  useEffect(() => {
    if (isInitialized && profile) {
      if (profile.searchKeywords?.length) {
        setKeywords(profile.searchKeywords.slice(0, 2).join(' '))
      } else if (profile.title) {
        setKeywords(profile.title)
      }
    } else if (isInitialized && !profile) {
      router.push('/')
    }
  }, [isInitialized, profile, router])

  const handleReset = () => {
    if (confirm("Voulez-vous vraiment supprimer votre profil et recommencer l'analyse de votre CV ?")) {
      resetProfile()
      router.push('/')
    }
  }

  const search = async () => {
    setLoading(true)
    setError('')
    setOffers([])
    try {
      const res = await fetch('/api/search-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords, location, contractType, limit: 20 }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur de recherche')
      setOffers(json.offers)
      setSearched(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const sources = ['all', ...new Set(offers.map(o => o.source))]
  const filtered = sourceFilter === 'all' ? offers : offers.filter(o => o.source === sourceFilter)

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin text-4xl">⟳</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/')} className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">JR</button>
            <span className="font-bold text-gray-900">JobReady</span>
          </div>
          
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-sm font-bold text-indigo-600"
              >
                🔍 Recherche
              </button>
              <button
                onClick={() => router.push('/offer-analyzer')}
                className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
              >
                🎯 Analyser une offre
              </button>
              <button
                onClick={() => router.push('/mes-cv')}
                className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                🗂️ Mes CV
              </button>
              <button
                onClick={() => router.push('/lettre-type')}
                className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                ✉️ Ma lettre type
              </button>
            </nav>

            <button
              onClick={() => router.push('/mes-cv')}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-full border border-indigo-100 hover:bg-indigo-100 transition-all"
            >
              <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {profile?.firstName?.[0]}{profile?.lastName?.[0]}
              </div>
              <span className="text-sm font-semibold text-indigo-800">{profile?.firstName}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search bar */}
        <div className="card p-5 mb-8">
          <h2 className="font-bold text-gray-800 mb-4">🔍 Rechercher des offres</h2>
          <div className="flex gap-3 flex-wrap">
            <input
              className="input flex-1 min-w-48"
              placeholder="Ex: développeur React, chef de projet…"
              value={keywords}
              onChange={e => setKeywords(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
            />
            <input
              className="input w-40 text-black placeholder-gray-400"
              placeholder="Ville"
              value={location}
              list="locations-list"
              onChange={e => setLocation(e.target.value)}
            />
            <select
              className="input w-40"
              value={contractType}
              onChange={e => setContractType(e.target.value)}
            >
              <option value="">Tout contrat</option>
              <option value="cdi">CDI</option>
              <option value="cdd">CDD</option>
              <option value="freelance">Freelance</option>
              <option value="internship">Stage</option>
            </select>
            <button onClick={search} disabled={loading || !keywords.trim()} className="btn-primary flex items-center gap-2">
              {loading ? <><span className="animate-spin text-lg">⟳</span> Recherche…</> : '🚀 Rechercher'}
            </button>
          </div>
          {/* Suggestions from profile */}
          {profile.searchKeywords?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs text-gray-400">Suggestions :</span>
              {profile.searchKeywords.map(kw => (
                <button key={kw} onClick={() => setKeywords(kw)}
                  className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 hover:bg-indigo-100 font-medium">
                  {kw}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            ⚠️ {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 animate-bounce">🔍</div>
            <p className="font-semibold text-gray-700">Recherche sur Indeed, LinkedIn, France Travail, WTTJ, HelloWork…</p>
            <p className="text-sm text-gray-400 mt-1">Ça peut prendre 20-30 secondes</p>
          </div>
        )}

        {/* Results */}
        {!loading && searched && (
          <>
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <h3 className="font-bold text-gray-900 text-lg">
                {filtered.length} offre{filtered.length > 1 ? 's' : ''} trouvée{filtered.length > 1 ? 's' : ''}
                {sourceFilter !== 'all' ? ` sur ${sourceFilter}` : ''}
              </h3>
              {/* Source filter */}
              <div className="flex gap-2 flex-wrap">
                {sources.map(s => (
                  <button key={s} onClick={() => setSourceFilter(s)}
                    className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all border ${
                      sourceFilter === s
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                    }`}>
                    {s === 'all' ? `Toutes (${offers.length})` : s}
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-5xl mb-3">😔</div>
                <p className="font-semibold">Aucun résultat pour ces critères.</p>
                <p className="text-sm mt-1">Essaie d'autres mots-clés ou une autre ville.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map(offer => (
                  <JobCard key={offer.id} offer={offer} profile={profile} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Empty state */}
        {!loading && !searched && (
          <div className="space-y-5">
            <div className="text-center py-10 text-gray-400">
              <div className="text-6xl mb-4">🚀</div>
              <p className="font-semibold text-gray-600 text-lg">Lance ta recherche !</p>
              <p className="text-sm mt-1">JobReady recherche simultanément sur tous les job boards</p>
            </div>

            {/* Bloc accès rapide "Éditeur CV" */}
            <div className="card p-6 border-2 border-dashed border-violet-200 bg-violet-50/50 hover:border-violet-400 transition-colors cursor-pointer"
              onClick={() => router.push('/editeur')}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center text-2xl shrink-0">🎨</div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">Personnalise ton CV</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Éditeur avec 6 modèles, aide IA à la reformulation (accroche, expériences), coach CV et export PDF.
                  </p>
                </div>
                <span className="text-violet-500 text-xl shrink-0">→</span>
              </div>
            </div>

            {/* Bloc accès rapide "Analyser une offre" */}
            <div className="card p-6 border-2 border-dashed border-indigo-200 bg-indigo-50/50 hover:border-indigo-400 transition-colors cursor-pointer"
              onClick={() => router.push('/offer-analyzer')}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-2xl shrink-0">🎯</div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">Tu as déjà une offre en tête ?</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Collez le lien ou le texte d'une offre : votre CV est adapte et une lettre personnalisee est redigee, meme pour un domaine different du votre.
                  </p>
                </div>
                <span className="text-indigo-500 text-xl shrink-0">→</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Liste des suggestions de lieux */}
      <datalist id="locations-list">
        {FRANCE_LOCATIONS.map(loc => (
          <option key={loc} value={loc} />
        ))}
      </datalist>
    </div>
  )
}
