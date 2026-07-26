'use client'
import { useEffect } from 'react'
import Icon from '@/components/ui/Icon'

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('[erreur applicative]', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="card p-8 max-w-md text-center">
        <div className="w-11 h-11 mx-auto flex items-center justify-center mb-4"
          style={{ background: 'var(--c-warn-bg)', color: 'var(--c-warn)', borderRadius: 'var(--r-md)' }}>
          <Icon name="alert" size={20} />
        </div>
        <h1 className="text-lg font-semibold mb-2">Une erreur s'est produite</h1>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--c-muted)' }}>
          L'affichage de cette page a échoué. Vos CV et vos lettres sont enregistrés dans
          votre navigateur : ils n'ont pas été perdus.
        </p>
        <div className="flex flex-col gap-2">
          <button onClick={() => reset()} className="btn-primary">
            <Icon name="clock" size={15} /> Réessayer
          </button>
          <a href="/" className="btn-secondary">
            <Icon name="arrowLeft" size={15} /> Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  )
}
