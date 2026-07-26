'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'

const STEPS = {
  INPUT:    'input',    // saisie URL ou texte
  FETCHING: 'fetching', // récupération contenu URL
  ANALYZE:  'analyze',  // analyse automatique de l'offre
  ADAPT:    'adapt',    // adaptation CV + lettre
  DONE:     'done',     // résultat + téléchargement
}

function StepIndicator({ current }) {
  const steps = [
    { id: STEPS.INPUT,    label: 'Offre' },
    { id: STEPS.ANALYZE,  label: 'Analyse' },
    { id: STEPS.ADAPT,    label: 'Adaptation' },
    { id: STEPS.DONE,     label: 'PDFs prêts' },
  ]
  const order = [STEPS.INPUT, STEPS.ANALYZE, STEPS.ADAPT, STEPS.DONE]
  const currentIdx = order.indexOf(current)

  return (
    <div className="flex items-center gap-1 mb-8">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center gap-1">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            i < currentIdx  ? 'bg-green-100 text-green-700' :
            i === currentIdx ? 'bg-indigo-600 text-white shadow' :
            'bg-gray-100 text-gray-400'
          }`}>
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold bg-white/30">
              {i < currentIdx ? '✓' : i + 1}
            </span>
            {s.label}
          </div>
          {i < steps.length - 1 && <div className={`h-0.5 w-6 rounded ${i < currentIdx ? 'bg-green-300' : 'bg-gray-200'}`} />}
        </div>
      ))}
    </div>
  )
}

export default function OfferAnalyzer() {
  const router = useRouter()
  const { profile, letterText, isInitialized } = useApp()

  const [step,       setStep]       = useState(STEPS.INPUT)
  const [mode,       setMode]       = useState('url')   // 'url' | 'paste'
  const [url,        setUrl]        = useState('')
  const [pasteText,  setPasteText]  = useState('')
  const [offer,      setOffer]      = useState(null)    // offre structurée extraite
  const [adapted,    setAdapted]    = useState(null)    // { adaptedProfile, letter, isCareerChange }
  const [error,      setError]      = useState('')
  const [action,     setAction]     = useState('both')  // 'cv' | 'letter' | 'both'

  useEffect(() => {
    if (isInitialized && !profile) router.push('/')
  }, [isInitialized, profile])

  // ── Étape 1 : Récupérer + analyser l'offre ──────────────────────────────────
  const handleFetchAndAnalyze = async () => {
    setError('')

    // 1a. Récupérer le contenu
    setStep(STEPS.FETCHING)
    try {
      const fetchRes = await fetch('/api/fetch-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'url' ? { url } : { text: pasteText }),
      })
      const fetchJson = await fetchRes.json()
      if (!fetchRes.ok) throw new Error(fetchJson.error)

      // 1b. Analyse automatique de l'offre
      setStep(STEPS.ANALYZE)
      const analyzeRes = await fetch('/api/analyze-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: fetchJson.text, sourceUrl: url }),
      })
      const analyzeJson = await analyzeRes.json()
      if (!analyzeRes.ok) throw new Error(analyzeJson.error)

      setOffer({ ...analyzeJson.offer, url: url || analyzeJson.offer?.url || '#' })
      setStep(STEPS.ADAPT)
    } catch (e) {
      setError(e.message)
      setStep(STEPS.INPUT)
    }
  }

  // ── Étape 2 : Adapter CV + Lettre ───────────────────────────────────────────
  const handleAdapt = async () => {
    setError('')
    try {
      const letterProfile = (() => {
        try { return JSON.parse(localStorage.getItem('jr_letter') || 'null') } catch { return null }
      })()

      const res = await fetch('/api/adapt-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, letterProfile, offer, action }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      setAdapted({ adaptedProfile: json.adaptedProfile || profile, letter: json.letter, isCareerChange: json.isCareerChange })
      setStep(STEPS.DONE)
    } catch (e) {
      setError(e.message)
    }
  }

  // ── Étape 3 : Télécharger PDF ────────────────────────────────────────────────
  const downloadPdf = async (type) => {
    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          profile: adapted.adaptedProfile,
          letterText: adapted.letter,
          offer,
        }),
      })
      if (!res.ok) throw new Error('Erreur PDF')
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = type === 'cv'
        ? `CV_${profile.firstName}_${offer.company || 'Offre'}.pdf`
        : `LM_${offer.company || 'Offre'}.pdf`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (e) {
      setError(e.message)
    }
  }

  const downloadBoth = async () => {
    await downloadPdf('cv')
    await new Promise(r => setTimeout(r, 300))
    await downloadPdf('letter')
  }

  if (!isInitialized || !profile) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">JR</button>
            <div>
              <span className="font-bold text-gray-900">Analyser une offre</span>
              <p className="text-xs text-gray-400">CV + lettre sur-mesure pour une offre précise</p>
            </div>
          </div>
          <button onClick={() => router.push('/dashboard')} className="text-sm text-gray-400 hover:text-gray-600">
            ← Retour
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <StepIndicator current={step} />

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            ⚠️ {error}
          </div>
        )}

        {/* ── STEP INPUT ─────────────────────────────────────────────── */}
        {(step === STEPS.INPUT || step === STEPS.FETCHING) && (
          <div className="card p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Quelle offre veux-tu cibler ? 🎯
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Collez le lien de l'offre ou son texte complet. L'offre est analysee, puis votre CV est adapte, meme si le domaine est different du votre.
            </p>

            {/* Mode toggle */}
            <div className="flex gap-2 mb-5 p-1 bg-gray-100 rounded-xl w-fit">
              {[['url', '🔗 Lien de l\'offre'], ['paste', '📋 Coller le texte']].map(([m, label]) => (
                <button key={m} onClick={() => setMode(m)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${mode === m ? 'bg-white shadow text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>
                  {label}
                </button>
              ))}
            </div>

            {mode === 'url' && (
              <div>
                <label className="label">URL de l'offre</label>
                <input
                  className="input text-sm"
                  type="url"
                  placeholder="https://www.welcometothejungle.com/fr/jobs/..."
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-2">
                  Compatible avec Indeed, LinkedIn, WTTJ, HelloWork, Cadremploi, France Travail…
                </p>
              </div>
            )}

            {mode === 'paste' && (
              <div>
                <label className="label">Texte de l'offre</label>
                <textarea
                  className="input h-48 resize-none text-sm"
                  placeholder="Colle ici le texte complet de l'offre (titre, description, missions, profil recherché, compétences…)"
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                />
              </div>
            )}

            {/* Profil candidat */}
            <div className="mt-5 p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0">
                {profile.firstName?.[0]}{profile.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900">{profile.firstName} {profile.lastName}</p>
                <p className="text-xs text-indigo-600 truncate">{profile.title} · {profile.techSkills?.slice(0, 3).join(', ')}</p>
              </div>
              <span className="text-xs text-indigo-400 bg-indigo-100 px-2 py-1 rounded-full shrink-0">Profil chargé ✓</span>
            </div>

            <button
              onClick={handleFetchAndAnalyze}
              disabled={step === STEPS.FETCHING || (mode === 'url' ? !url.startsWith('http') : pasteText.length < 100)}
              className="btn-primary mt-6 w-full flex items-center justify-center gap-2"
            >
              {step === STEPS.FETCHING
                ? <><span className="animate-spin text-lg">⟳</span> Récupération de l'offre…</>
                : '🔍 Analyser l\'offre'}
            </button>
          </div>
        )}

        {/* ── STEP ANALYZE (loading) ──────────────────────────────────── */}
        {step === STEPS.ANALYZE && (
          <div className="card p-12 text-center">
            <div className="text-5xl mb-4 animate-bounce">🧠</div>
            <p className="font-bold text-gray-800 text-lg">Analyse de l'offre en cours...</p>
            <p className="text-sm text-gray-400 mt-1">Extraction du poste, des compétences requises, des missions…</p>
          </div>
        )}

        {/* ── STEP ADAPT ─────────────────────────────────────────────── */}
        {step === STEPS.ADAPT && offer && (
          <div className="space-y-5">
            {/* Résumé de l'offre extraite */}
            <div className="card p-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{offer.title}</h3>
                  <p className="text-indigo-600 font-semibold">{offer.company}</p>
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    {offer.location && <span className="text-xs text-gray-500">📍 {offer.location}</span>}
                    {offer.contractType && <span className="badge bg-gray-100 text-gray-700 text-xs">{offer.contractType}</span>}
                    {offer.salary && <span className="badge bg-green-100 text-green-700 text-xs">💰 {offer.salary}</span>}
                  </div>
                </div>
                <span className="text-2xl">✅</span>
              </div>

              {offer.requiredSkills?.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Compétences demandées</p>
                  <div className="flex flex-wrap gap-1.5">
                    {offer.requiredSkills.map(s => (
                      <span key={s} className="badge bg-indigo-50 text-indigo-700 text-xs">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {offer.missions?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Missions principales</p>
                  <ul className="space-y-1">
                    {offer.missions.slice(0, 4).map((m, i) => (
                      <li key={i} className="text-xs text-gray-600 flex gap-2">
                        <span className="text-indigo-400 shrink-0">▸</span> {m}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Alerte reconversion */}
            {(() => {
              const offerSkills = offer.requiredSkills || []
              const hasOverlap = offerSkills.some(s =>
                (profile.techSkills || []).some(ps => ps.toLowerCase().includes(s.toLowerCase()))
              )
              return !hasOverlap && offerSkills.length > 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-sm font-semibold text-amber-800">🔄 Reconversion / changement de domaine détecté</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Votre profil <strong>{profile.title}</strong> est eloigne de ce poste. Vos competences transferables seront mises en avant pour une candidature de reconversion convaincante.
                  </p>
                </div>
              ) : null
            })()}

            {/* Choix action */}
            <div className="card p-6">
              <h3 className="font-bold text-gray-800 mb-4">Que veux-tu générer ? ✨</h3>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { id: 'both',   label: 'CV + lettre', desc: 'Les deux en une fois' },
                  { id: 'cv',     label: '📄 CV seulement', desc: 'Adapté à l\'offre' },
                  { id: 'letter', label: '✉️ Lettre seule', desc: 'Dans ton style' },
                ].map(opt => (
                  <button key={opt.id} onClick={() => setAction(opt.id)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      action === opt.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 bg-white hover:border-indigo-200'
                    }`}>
                    <p className={`font-bold text-sm ${action === opt.id ? 'text-indigo-700' : 'text-gray-700'}`}>{opt.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>

              <button onClick={handleAdapt} className="btn-primary w-full flex items-center justify-center gap-2">
                🚀 Générer {action === 'both' ? 'le CV + la lettre' : action === 'cv' ? 'le CV adapté' : 'la lettre'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP DONE ─────────────────────────────────────────────── */}
        {step === STEPS.DONE && adapted && offer && (
          <div className="space-y-5">
            {adapted.isCareerChange && (
              <div className="p-4 bg-violet-50 border border-violet-200 rounded-xl">
                <p className="text-sm font-semibold text-violet-800">✨ Candidature de reconversion générée</p>
                <p className="text-xs text-violet-600 mt-1">
                  Vos competences transferables ont ete valorisees et la candidature est adaptee au nouveau domaine.
                </p>
              </div>
            )}

            <div className="card p-6">
              <div className="flex items-center gap-2 mb-5">
                <span className="text-2xl">🎉</span>
                <div>
                  <h3 className="font-bold text-gray-900">Documents prêts !</h3>
                  <p className="text-xs text-gray-500">{offer.title} · {offer.company}</p>
                </div>
              </div>

              <div className="space-y-3">
                {(action === 'cv' || action === 'both') && (
                  <button onClick={() => downloadPdf('cv')}
                    className="flex items-center gap-3 w-full p-4 bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-colors">
                    <span className="text-2xl">📄</span>
                    <div className="text-left flex-1">
                      <p className="font-semibold text-indigo-900 text-sm">Télécharger le CV adapté</p>
                      <p className="text-xs text-indigo-500">CV_{profile.firstName}_{offer.company}.pdf</p>
                    </div>
                    <span className="text-indigo-400 text-lg">↓</span>
                  </button>
                )}

                {(action === 'letter' || action === 'both') && adapted.letter && (
                  <button onClick={() => downloadPdf('letter')}
                    className="flex items-center gap-3 w-full p-4 bg-violet-50 border border-violet-100 rounded-xl hover:bg-violet-100 transition-colors">
                    <span className="text-2xl">✉️</span>
                    <div className="text-left flex-1">
                      <p className="font-semibold text-violet-900 text-sm">Télécharger la lettre de motivation</p>
                      <p className="text-xs text-violet-500">LM_{offer.company}.pdf</p>
                    </div>
                    <span className="text-violet-400 text-lg">↓</span>
                  </button>
                )}

                {action === 'both' && (
                  <button onClick={downloadBoth}
                    className="flex items-center justify-center gap-2 w-full p-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all">
                    ⬇️ Tout télécharger (CV + Lettre)
                  </button>
                )}

                {offer.url && offer.url !== '#' && (
                  <a href={offer.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl font-bold text-sm hover:bg-green-100 transition-colors">
                    🔗 Postuler sur le site de l'offre
                  </a>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setStep(STEPS.INPUT); setOffer(null); setAdapted(null); setUrl(''); setPasteText('') }}
                className="btn-secondary flex-1">
                ← Analyser une autre offre
              </button>
              <button onClick={() => router.push('/dashboard')} className="btn-primary flex-1">
                Retour au dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
