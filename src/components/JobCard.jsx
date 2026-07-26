import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { duplicateCv } from '@/lib/cvModel'

// ─── Cache module-level (survit aux re-renders, réinitialisé au reload) ───────
// Clé : offerId + action → { adaptedProfile, letter }
const adaptCache = new Map()

const SOURCE_BADGE = {
  'Indeed':    'bg-blue-100 text-blue-700',
  'LinkedIn':  'bg-indigo-100 text-indigo-700',
  'WTTJ':      'bg-pink-100 text-pink-700',
  'HelloWork': 'bg-orange-100 text-orange-700',
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

async function fetchPdf(type, profile, letterText, offer) {
  const res = await fetch('/api/generate-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, profile, letterText, offer }),
  })
  if (!res.ok) throw new Error('Erreur génération PDF')
  return res.blob()
}

export default function JobCard({ offer, profile }) {
  const router = useRouter()
  const { applications, addApplication, activeCv, createCv } = useApp()
  const [adapting, setAdapting] = useState(null)
  const [cached, setCached]     = useState(false)   // indique si déjà généré
  const [done, setDone]         = useState(null)
  const [adapted, setAdapted]   = useState(null)    // profil adapté (copie versionnée)

  // Enregistre le CV adapté comme NOUVEAU CV (le CV d'origine n'est pas touché)
  const saveAdaptedAsCv = () => {
    if (!adapted || !activeCv) return
    const companyName = typeof offer.company === 'object' ? offer.company?.name : offer.company
    const copy = duplicateCv(activeCv, `CV — ${companyName || offer.title}`)
    copy.data = { ...copy.data, ...adapted }
    createCv(copy)
    router.push('/editeur')
  }

  const isApplied = applications.some(a => a.offer.id === offer.id)

  const letterProfile = () => {
    try { return JSON.parse(localStorage.getItem('jr_letter') || 'null') } catch { return null }
  }

  const getOrFetchAdaptation = async (action) => {
    const key = `${offer.id}__${action}`

    // ── Déjà en cache : aucun nouvel appel au service de génération ──
    if (adaptCache.has(key)) {
      setCached(true)
      return adaptCache.get(key)
    }

    // ── Absent du cache : un seul appel au service de génération ────
    const res = await fetch('/api/adapt-cv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile,
        letterProfile: letterProfile(),
        offer,
        action,
      }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Erreur serveur')

    const result = { adaptedProfile: json.adaptedProfile || profile, letter: json.letter }
    adaptCache.set(key, result)

    // Stocker aussi 'both' en cache pour éviter la double génération
    if (action !== 'both') {
      const bothKey = `${offer.id}__both`
      const existing = adaptCache.get(bothKey) || {}
      adaptCache.set(bothKey, { ...existing, ...result })
    }

    return result
  }

  const handleAction = async (action) => {
    setAdapting(action)
    setCached(false)
    try {
      const { adaptedProfile, letter } = await getOrFetchAdaptation(action)

      if (action === 'cv') {
        const blob = await fetchPdf('cv', adaptedProfile, null, offer)
        downloadBlob(blob, `CV_${profile.firstName}_${offer.company}.pdf`)

      } else if (action === 'letter') {
        const blob = await fetchPdf('letter', adaptedProfile, letter, offer)
        downloadBlob(blob, `LM_${offer.company}.pdf`)

      } else { // 'both'
        // Générer les 2 PDF en parallèle (aucun appel supplémentaire)
        const [cvBlob, lmBlob] = await Promise.all([
          fetchPdf('cv', adaptedProfile, null, offer),
          fetchPdf('letter', adaptedProfile, letter, offer),
        ])
        downloadBlob(cvBlob, `CV_${profile.firstName}_${offer.company}.pdf`)
        await new Promise(r => setTimeout(r, 200))
        downloadBlob(lmBlob, `LM_${offer.company}.pdf`)
      }

      if (action !== 'letter' && adaptedProfile) setAdapted(adaptedProfile)
      setDone(action)
    } catch (e) {
      alert('Erreur : ' + e.message)
    } finally {
      setAdapting(null)
    }
  }

  const isLoading = adapting !== null
  const hasCacheForBoth = adaptCache.has(`${offer.id}__both`)
    || (adaptCache.has(`${offer.id}__cv`) && adaptCache.has(`${offer.id}__letter`))

  return (
    <div className={`card p-5 flex flex-col gap-4 hover:shadow-md transition-shadow relative ${isApplied ? 'opacity-80' : ''}`}>
      {isApplied && (
        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm z-10 animate-in fade-in zoom-in duration-300">
          POSTULÉ ✅
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">{offer.title}</h3>
          <p className="text-indigo-600 font-semibold text-sm mt-0.5">{String((typeof offer.company === 'object' ? offer.company.name : offer.company) || 'Entreprise inconnue')}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {offer.location && <span className="text-xs text-gray-400">📍 {offer.location}</span>}
            {offer.contractType && (
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium">{offer.contractType}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`badge text-xs ${SOURCE_BADGE[offer.source] || 'bg-gray-100 text-gray-600'}`}>
            {offer.source}
          </span>
          <button
            onClick={() => addApplication(offer)}
            disabled={isApplied}
            title={isApplied ? "Déjà dans l'historique" : "Marquer comme postulé"}
            className={`p-1.5 rounded-lg border transition-all ${
              isApplied 
                ? 'bg-green-50 border-green-200 text-green-600' 
                : 'bg-white border-gray-200 text-gray-400 hover:text-indigo-600 hover:border-indigo-200'
            }`}
          >
            {isApplied ? '✓' : '＋'}
          </button>
        </div>
      </div>

      {offer.salary && (
        <div className="px-3 py-1.5 bg-green-50 rounded-lg text-xs text-green-700 font-semibold w-fit">
          💰 {offer.salary}
        </div>
      )}

      {offer.description && (
        <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
          {String(offer.description).slice(0, 200)}…
        </p>
      )}

      {/* Statut */}
      {done && (
        <div className="flex items-center justify-between gap-1.5 text-xs font-semibold flex-wrap">
          {cached
            ? <span style={{ color: 'var(--c-primary)' }}>Déjà généré — réutilisé sans nouvelle analyse</span>
            : <span style={{ color: 'var(--c-success)' }}>PDF{done === 'both' ? ' téléchargés' : ' téléchargé'}</span>
          }
          {adapted && activeCv && (
            <button onClick={saveAdaptedAsCv}
              title="Enregistre le CV adapté comme nouveau CV modifiable — votre CV d'origine reste intact"
              className="text-indigo-600 hover:underline">
              ✏️ Enregistrer dans Mes CV et modifier
            </button>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-1 border-t border-gray-100">
        <button
          onClick={() => handleAction('cv')}
          disabled={isLoading}
          className="flex items-center gap-2 w-full px-3 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-semibold hover:bg-indigo-100 transition-colors disabled:opacity-50"
        >
          {adapting === 'cv' ? <span className="animate-spin">⟳</span> : '📄'}
          {adapting === 'cv' ? 'Génération du CV…' : 'CV adapté pour cette offre'}
          {adaptCache.has(`${offer.id}__cv`) && <span className="ml-auto text-indigo-400">♻️</span>}
        </button>

        <button
          onClick={() => handleAction('letter')}
          disabled={isLoading}
          className="flex items-center gap-2 w-full px-3 py-2 bg-violet-50 text-violet-700 rounded-xl text-xs font-semibold hover:bg-violet-100 transition-colors disabled:opacity-50"
        >
          {adapting === 'letter' ? <span className="animate-spin">⟳</span> : '✉️'}
          {adapting === 'letter' ? 'Rédaction en cours…' : 'Lettre de motivation personnalisée'}
          {adaptCache.has(`${offer.id}__letter`) && <span className="ml-auto text-violet-400">♻️</span>}
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => handleAction('both')}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50 shadow-sm"
          >
            {adapting === 'both'
              ? <><span className="animate-spin">⟳</span> Génération…</>
              : hasCacheForBoth
                ? '⚡ Retélécharger (cache)'
                : 'CV + lettre en une fois'
            }
          </button>
          {offer.urlIsSearch ? (
            /* Pas d'URL directe disponible → lien de recherche garanti valide */
            <a
              href={offer.url}
              target="_blank"
              rel="noopener noreferrer"
              title="L'URL directe de l'offre n'est pas disponible — ce lien recherche l'offre sur le site"
              className="flex items-center justify-center px-3 py-2 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold hover:bg-amber-100 transition-colors border border-amber-200"
            >
              🔍 Rechercher
            </a>
          ) : (
            /* URL directe disponible */
            <a
              href={offer.url}
              target="_blank"
              rel="noopener noreferrer"
              title="Accéder à l'offre (peut avoir expiré si l'annonce a été pourvue)"
              className="flex items-center justify-center px-3 py-2 bg-green-50 text-green-700 rounded-xl text-xs font-bold hover:bg-green-100 transition-colors border border-green-200"
            >
              🔗 Postuler
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
