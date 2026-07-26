'use client'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { profileToCv } from '@/lib/cvModel'
import StepCV from '@/components/StepCV'
import AppHeader from '@/components/ui/AppHeader'
import Icon from '@/components/ui/Icon'

export default function ImporterPage() {
  const router = useRouter()
  const { createCv, setCvText } = useApp()

  const handleDone = (profile, rawText) => {
    const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ')
    const cv = profileToCv(profile, name ? `CV ${name}` : 'CV importé')
    createCv(cv)
    setCvText(rawText || '')
    router.push('/editeur')
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-6 py-9">
        <h1 className="text-xl font-semibold mb-1">Importer un CV existant</h1>
        <p className="text-sm mb-6 leading-relaxed max-w-2xl" style={{ color: 'var(--c-muted)' }}>
          Récupérez le contenu d'un CV que vous avez déjà, pour le corriger, le remettre en
          forme avec un modèle plus lisible et l'exporter à nouveau.
        </p>

        <StepCV onDone={handleDone} />

        <div className="note mt-5 max-w-2xl mx-auto">
          <Icon name="info" size={15} />
          <span>
            L'extraction automatique n'est jamais parfaite : relisez systématiquement chaque
            rubrique dans l'éditeur, en particulier les dates et les intitulés de poste.
            Vous n'avez pas de CV sous la main ?{' '}
            <button onClick={() => router.push('/creer')} className="underline font-semibold"
              style={{ color: 'var(--c-primary)' }}>
              Créez-en un de zéro
            </button>, c'est guidé étape par étape.
          </span>
        </div>
      </main>
    </div>
  )
}
