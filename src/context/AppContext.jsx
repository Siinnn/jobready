'use client'
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { createEmptyCv, profileToCv, duplicateCv as dupCv } from '@/lib/cvModel'
import { createEmptyLetter, duplicateLetter as dupLetter } from '@/lib/letterModel'

const AppContext = createContext(null)

const LS_KEYS = {
  // Store multi-CV
  CVS: 'jr_cvs',
  ACTIVE_CV: 'jr_activeCvId',
  // Store multi-lettres
  LETTERS: 'jr_letters',
  ACTIVE_LETTER: 'jr_activeLetterId',
  // Anciens (migration + modules offres)
  PROFILE: 'jr_profile',
  CV_TEXT: 'jr_cvText',
  LETTER_TEXT: 'jr_letterText',
  APPLICATIONS: 'jr_applications',
}

export function AppProvider({ children }) {
  const [cvs, setCvs] = useState([])                 // CVDocument[]
  const [activeCvId, setActiveCvId] = useState(null)
  const [letters, setLetters] = useState([])          // LetterDocument[]
  const [activeLetterId, setActiveLetterId] = useState(null)
  const [cvText, setCvText] = useState('')            // texte brut du CV importé
  const [letterText, setLetterText] = useState('')    // texte brut de la lettre type
  const [applications, setApplications] = useState([])
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [isInitialized, setIsInitialized] = useState(false)

  // ─── Chargement + migration depuis l'ancien format ─────────────────────────
  useEffect(() => {
    try {
      const savedCvs = localStorage.getItem(LS_KEYS.CVS)
      const savedActive = localStorage.getItem(LS_KEYS.ACTIVE_CV)
      const savedCv = localStorage.getItem(LS_KEYS.CV_TEXT)
      const savedLetter = localStorage.getItem(LS_KEYS.LETTER_TEXT)
      const savedApps = localStorage.getItem(LS_KEYS.APPLICATIONS)

      let list = savedCvs ? JSON.parse(savedCvs) : []

      // Migration : ancien profil unique → premier CVDocument
      if (list.length === 0) {
        const legacyProfile = localStorage.getItem(LS_KEYS.PROFILE)
        if (legacyProfile) {
          const cv = profileToCv(JSON.parse(legacyProfile), 'Mon CV')
          list = [cv]
          localStorage.removeItem(LS_KEYS.PROFILE)
        }
      }

      setCvs(list)
      setActiveCvId(savedActive && list.some(c => c.id === savedActive) ? savedActive : (list[0]?.id ?? null))

      // Lettres
      const savedLetters = localStorage.getItem(LS_KEYS.LETTERS)
      const savedActiveLetter = localStorage.getItem(LS_KEYS.ACTIVE_LETTER)
      const lettersList = savedLetters ? JSON.parse(savedLetters) : []
      setLetters(lettersList)
      setActiveLetterId(savedActiveLetter && lettersList.some(l => l.id === savedActiveLetter)
        ? savedActiveLetter : (lettersList[0]?.id ?? null))

      if (savedCv) setCvText(savedCv)
      if (savedLetter) setLetterText(savedLetter)
      if (savedApps) setApplications(JSON.parse(savedApps))
    } catch (e) {
      console.error('Erreur de chargement du store :', e)
    }
    setIsInitialized(true)
  }, [])

  // ─── Persistance ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isInitialized) return
    localStorage.setItem(LS_KEYS.CVS, JSON.stringify(cvs))
  }, [cvs, isInitialized])

  useEffect(() => {
    if (!isInitialized) return
    if (activeCvId) localStorage.setItem(LS_KEYS.ACTIVE_CV, activeCvId)
    else localStorage.removeItem(LS_KEYS.ACTIVE_CV)
  }, [activeCvId, isInitialized])

  useEffect(() => {
    if (!isInitialized) return
    localStorage.setItem(LS_KEYS.LETTERS, JSON.stringify(letters))
  }, [letters, isInitialized])

  useEffect(() => {
    if (!isInitialized) return
    if (activeLetterId) localStorage.setItem(LS_KEYS.ACTIVE_LETTER, activeLetterId)
    else localStorage.removeItem(LS_KEYS.ACTIVE_LETTER)
  }, [activeLetterId, isInitialized])

  useEffect(() => {
    if (!isInitialized) return
    if (cvText) localStorage.setItem(LS_KEYS.CV_TEXT, cvText)
    else localStorage.removeItem(LS_KEYS.CV_TEXT)
  }, [cvText, isInitialized])

  useEffect(() => {
    if (!isInitialized) return
    if (letterText) localStorage.setItem(LS_KEYS.LETTER_TEXT, letterText)
    else localStorage.removeItem(LS_KEYS.LETTER_TEXT)
  }, [letterText, isInitialized])

  useEffect(() => {
    if (!isInitialized) return
    localStorage.setItem(LS_KEYS.APPLICATIONS, JSON.stringify(applications))
  }, [applications, isInitialized])

  // ─── CRUD multi-CV ──────────────────────────────────────────────────────────
  const activeCv = useMemo(() => cvs.find(c => c.id === activeCvId) ?? null, [cvs, activeCvId])

  const createCv = useCallback((cvOrName, templateId) => {
    const cv = typeof cvOrName === 'object' ? cvOrName : createEmptyCv(cvOrName || 'Mon CV', templateId)
    setCvs(prev => [cv, ...prev])
    setActiveCvId(cv.id)
    return cv
  }, [])

  const updateCv = useCallback((id, patch) => {
    setCvs(prev => prev.map(c => c.id === id
      ? { ...c, ...(typeof patch === 'function' ? patch(c) : patch), updatedAt: new Date().toISOString() }
      : c))
  }, [])

  const removeCv = useCallback((id) => {
    setCvs(prev => {
      const next = prev.filter(c => c.id !== id)
      setActiveCvId(a => (a === id ? (next[0]?.id ?? null) : a))
      return next
    })
  }, [])

  const duplicateCvById = useCallback((id, name) => {
    const src = cvs.find(c => c.id === id)
    if (!src) return null
    const copy = dupCv(src, name)
    setCvs(prev => [copy, ...prev])
    return copy
  }, [cvs])

  // ─── CRUD multi-lettres ─────────────────────────────────────────────────────
  const activeLetter = useMemo(() => letters.find(l => l.id === activeLetterId) ?? null, [letters, activeLetterId])

  const createLetter = useCallback((letterOrName) => {
    const letter = typeof letterOrName === 'object' ? letterOrName : createEmptyLetter(letterOrName || 'Ma lettre')
    setLetters(prev => [letter, ...prev])
    setActiveLetterId(letter.id)
    return letter
  }, [])

  const updateLetter = useCallback((id, patch) => {
    setLetters(prev => prev.map(l => l.id === id
      ? { ...l, ...(typeof patch === 'function' ? patch(l) : patch), updatedAt: new Date().toISOString() }
      : l))
  }, [])

  const removeLetter = useCallback((id) => {
    setLetters(prev => {
      const next = prev.filter(l => l.id !== id)
      setActiveLetterId(a => (a === id ? (next[0]?.id ?? null) : a))
      return next
    })
  }, [])

  const duplicateLetterById = useCallback((id, name) => {
    const src = letters.find(l => l.id === id)
    if (!src) return null
    const copy = dupLetter(src, name)
    setLetters(prev => [copy, ...prev])
    return copy
  }, [letters])

  // ─── Couche de compatibilité "profile" (modules offres / lettres) ──────────
  // profile == data du CV actif. setProfile écrit dans le CV actif (ou en crée un).
  const profile = activeCv ? activeCv.data : null

  const setProfile = useCallback((p) => {
    if (p === null) return
    setCvs(prev => {
      const targetId = activeCvId ?? prev[0]?.id
      if (!targetId) {
        const cv = profileToCv(p, 'Mon CV')
        setActiveCvId(cv.id)
        return [cv]
      }
      return prev.map(c => c.id === targetId
        ? { ...c, data: { ...c.data, ...p }, updatedAt: new Date().toISOString() }
        : c)
    })
  }, [activeCvId])

  const updateProfile = setProfile

  const addApplication = (offer) => {
    if (applications.some(a => a.offer.id === offer.id)) return
    setApplications(prev => [{ offer, date: new Date().toISOString(), status: 'applied' }, ...prev])
  }

  const resetProfile = () => {
    setCvs([])
    setActiveCvId(null)
    setLetters([])
    setActiveLetterId(null)
    setCvText('')
    setLetterText('')
    setApplications([])
    Object.values(LS_KEYS).forEach(k => localStorage.removeItem(k))
    setStep(1)
  }

  return (
    <AppContext.Provider value={{
      // Multi-CV
      cvs, setCvs, activeCv, activeCvId, setActiveCvId,
      createCv, updateCv, removeCv, duplicateCvById,
      // Multi-lettres
      letters, setLetters, activeLetter, activeLetterId, setActiveLetterId,
      createLetter, updateLetter, removeLetter, duplicateLetterById,
      // Compatibilité modules existants
      profile, setProfile, updateProfile,
      cvText, setCvText,
      letterText, setLetterText,
      applications, setApplications, addApplication,
      offers, setOffers,
      loading, setLoading,
      step, setStep,
      isInitialized,
      resetProfile,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
