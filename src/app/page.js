'use client'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import AppHeader from '@/components/ui/AppHeader'
import Icon from '@/components/ui/Icon'
import { createDemoCv } from '@/lib/demoData'

export default function Home() {
  const router = useRouter()
  const { cvs, letters, createCv, isInitialized } = useApp()

  const loadDemo = () => { createCv(createDemoCv()); router.push('/editeur') }

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon name="clock" size={28} className="animate-spin" style={{ color: 'var(--c-muted)' }} />
      </div>
    )
  }

  const actions = [
    {
      icon: 'plus', title: 'Créer un CV',
      desc: 'Un parcours guidé rubrique par rubrique, avec des modèles professionnels et une aide à la rédaction.',
      cta: 'Commencer', href: '/creer', primary: true,
    },
    {
      icon: 'upload', title: 'Importer un CV',
      desc: 'Déposez un CV au format PDF, ou collez son texte : les rubriques sont pré-remplies automatiquement.',
      cta: 'Importer un fichier', href: '/importer',
    },
    {
      icon: 'mail', title: 'Rédiger une lettre',
      desc: letters.length > 0
        ? `${letters.length} lettre${letters.length > 1 ? 's' : ''} enregistrée${letters.length > 1 ? 's' : ''}. Dupliquez-en une pour candidater ailleurs.`
        : 'Une lettre de motivation structurée en quatre paragraphes, adaptée au poste visé.',
      cta: letters.length > 0 ? 'Voir mes lettres' : 'Créer une lettre',
      href: letters.length > 0 ? '/mes-lettres' : '/lettres/creer',
    },
  ]

  const points = [
    { icon: 'shield', title: 'Compatible ATS', text: 'Les modèles évitent les pièges qui rendent un CV illisible par les logiciels de recrutement : colonnes exotiques, texte en image, polices fantaisie.' },
    { icon: 'target', title: 'Contrôle qualité', text: 'Un score et une liste de points à corriger : rubriques incomplètes, dates manquantes, absence de résultats chiffrés ou de verbes d\'action.' },
    { icon: 'pencil', title: 'Aide à la rédaction', text: "Bloqué sur l'accroche, la description d'un poste ou un paragraphe de lettre ? Trois reformulations sont proposées, vous choisissez et vous ajustez." },
  ]

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main>
        {/* Bandeau d'introduction */}
        <section className="bg-white" style={{ borderBottom: '1px solid var(--c-border)' }}>
          <div className="max-w-6xl mx-auto px-6 py-14">
            <span className="badge badge-primary mb-4">Création et mise à jour de CV</span>
            <h1 className="text-3xl md:text-[34px] font-semibold leading-tight max-w-2xl">
              Préparez un dossier de candidature clair et lisible par les recruteurs
            </h1>
            <p className="mt-4 max-w-2xl leading-relaxed" style={{ color: 'var(--c-body)' }}>
              Deux outils complémentaires : un créateur de CV guidé rubrique par rubrique,
              avec six modèles interchangeables et des vérifications de lisibilité ATS ; et
              un rédacteur de lettres de motivation, structuré paragraphe par paragraphe.
            </p>
            <div className="flex flex-wrap gap-2.5 mt-7">
              <button onClick={() => router.push('/creer')} className="btn-primary">
                <Icon name="plus" size={15} /> Créer mon CV
              </button>
              <button onClick={() => router.push('/lettres/creer')} className="btn-secondary">
                <Icon name="mail" size={15} /> Rédiger une lettre
              </button>
              <button onClick={() => router.push('/guide-ats')} className="btn-secondary">
                <Icon name="shield" size={15} /> Comprendre les CV ATS
              </button>
            </div>
            {cvs.length === 0 && (
              <p className="text-xs mt-4" style={{ color: 'var(--c-muted)' }}>
                Première visite ?{' '}
                <button onClick={loadDemo} className="underline font-semibold" style={{ color: 'var(--c-primary)' }}>
                  Ouvrir un CV d'exemple
                </button>{' '}
                pour voir l'éditeur, les modèles et le contrôle ATS en action.
              </p>
            )}
          </div>
        </section>

        {/* Points d'entrée */}
        <section className="max-w-6xl mx-auto px-6 py-10">
          <h2 className="text-base font-semibold mb-4">Par où commencer ?</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {actions.map(a => (
              <div key={a.title} className="card p-5 flex flex-col"
                style={a.primary ? { borderColor: 'var(--c-primary-border)', background: '#fcfdff' } : undefined}>
                <div className="w-9 h-9 flex items-center justify-center mb-3"
                  style={{ background: 'var(--c-primary-light)', color: 'var(--c-primary)', borderRadius: 'var(--r-md)' }}>
                  <Icon name={a.icon} size={18} />
                </div>
                <h3 className="text-sm font-semibold mb-1.5">{a.title}</h3>
                <p className="text-sm leading-relaxed flex-1" style={{ color: 'var(--c-muted)' }}>{a.desc}</p>
                <button onClick={() => router.push(a.href)} disabled={a.disabled}
                  className={`${a.primary ? 'btn-primary' : 'btn-secondary'} mt-4 w-full`}>
                  {a.cta}
                  {!a.disabled && <Icon name="arrowRight" size={14} />}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Ce que fait l'outil */}
        <section className="max-w-6xl mx-auto px-6 pb-10">
          <div className="card divide-y" style={{ borderColor: 'var(--c-border)' }}>
            {points.map(p => (
              <div key={p.title} className="flex gap-4 p-5" style={{ borderColor: 'var(--c-border)' }}>
                <div className="w-8 h-8 flex items-center justify-center shrink-0"
                  style={{ background: '#eef1f5', color: 'var(--c-primary)', borderRadius: 'var(--r-md)' }}>
                  <Icon name={p.icon} size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-1">{p.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--c-muted)' }}>{p.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pied de page */}
        <footer className="max-w-6xl mx-auto px-6 py-8 text-xs leading-relaxed"
          style={{ color: 'var(--c-faint)', borderTop: '1px solid var(--c-border)' }}>
          <p className="mb-1.5">
            Vos CV et vos lettres sont enregistrés dans votre navigateur, sur cet appareil
            uniquement. Aucun compte n'est nécessaire.
          </p>
          <p>
            Pour consulter des offres, la rubrique{' '}
            <button onClick={() => router.push('/offres')} className="underline"
              style={{ color: 'var(--c-primary)' }}>Offres</button>{' '}
            vous oriente vers la recherche de France Travail, où les annonces sont à jour.
          </p>
        </footer>
      </main>
    </div>
  )
}
