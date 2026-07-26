'use client'
import { useRouter } from 'next/navigation'
import Icon from '@/components/ui/Icon'

export default function NotFound() {
  const router = useRouter()
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="card p-8 max-w-md text-center">
        <div className="w-11 h-11 mx-auto flex items-center justify-center mb-4"
          style={{ background: 'var(--c-primary-light)', color: 'var(--c-primary)', borderRadius: 'var(--r-md)' }}>
          <Icon name="search" size={20} />
        </div>
        <h1 className="text-lg font-semibold mb-2">Page introuvable</h1>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--c-muted)' }}>
          Cette adresse ne correspond à aucune page du site. Elle a peut-être changé,
          ou le lien que vous avez suivi est incomplet.
        </p>
        <div className="flex flex-col gap-2">
          <button onClick={() => router.push('/')} className="btn-primary">
            <Icon name="arrowLeft" size={15} /> Retour à l'accueil
          </button>
          <button onClick={() => router.push('/mes-cv')} className="btn-secondary">
            <Icon name="files" size={15} /> Voir mes CV
          </button>
        </div>
      </div>
    </div>
  )
}
