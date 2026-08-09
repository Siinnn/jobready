'use client'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import AppHeader from '@/components/ui/AppHeader'
import Icon from '@/components/ui/Icon'
import { createDemoCv } from '@/lib/demoData'

export default function Home() {
  const router = useRouter()
  const { cvs, letters, createCv, isInitialized } = useApp()

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon name="clock" size={28} className="animate-spin" style={{ color: 'var(--c-muted)' }} />
      </div>
    )
  }

  const loadDemo = () => { createCv(createDemoCv()); router.push('/editeur') }

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main>
        {/* Introduction */}
        <section className="bg-white" style={{ borderBottom: '1px solid var(--c-border)' }}>
          <div className="max-w-5xl mx-auto px-6 py-12">
            <h1 className="text-3xl md:text-[34px] font-semibold leading-tight max-w-2xl">
              Préparez vos candidatures : le CV, la lettre, ou les deux
            </h1>
            <p className="mt-4 max-w-2xl leading-relaxed" style={{ color: 'var(--c-body)' }}>
              Deux outils indépendants. Vous pouvez créer seulement un CV, seulement une lettre
              de motivation, ou les deux selon ce que demande l'offre à laquelle vous répondez.
              Rien n'est obligatoire, et vous pouvez revenir modifier vos documents à tout moment.
            </p>
          </div>
        </section>

        {/* Les deux univers */}
        <section className="max-w-5xl mx-auto px-6 py-9">
          <div className="grid md:grid-cols-2 gap-5">

            {/* ── CV ── */}
            <Universe
              color="var(--c-cv)" light="var(--c-cv-light)" border="var(--c-cv-border)"
              icon="file" tag="Document 1"
              title="Mon CV"
              intro="La liste de votre parcours : expériences, formation, compétences. C'est le document demandé dans presque toutes les candidatures."
              count={cvs.length} countLabel="CV enregistré"
              steps={[
                'Vous remplissez vos informations, rubrique par rubrique',
                'Vous choisissez une présentation parmi six modèles',
                'Un contrôle vous signale ce qui manque avant l\'envoi',
                'Vous téléchargez le PDF prêt à joindre',
              ]}
              primary={{ label: cvs.length ? 'Voir mes CV' : 'Créer mon CV', href: cvs.length ? '/mes-cv' : '/creer', icon: cvs.length ? 'files' : 'plus' }}
              secondary={cvs.length
                ? { label: 'Créer un autre CV', href: '/creer', icon: 'plus' }
                : { label: "J'ai déjà un CV à importer", href: '/importer', icon: 'upload' }}
              extra={
                <button onClick={() => router.push('/guide-ats')}
                  className="text-xs underline" style={{ color: 'var(--c-cv)' }}>
                  Pourquoi certains CV ne sont jamais lus : le guide ATS
                </button>
              }
            />

            {/* ── Lettre ── */}
            <Universe
              color="var(--c-letter)" light="var(--c-letter-light)" border="var(--c-letter-border)"
              icon="mail" tag="Document 2"
              title="Ma lettre de motivation"
              intro="Le courrier qui accompagne le CV : pourquoi ce poste, pourquoi cette entreprise, et ce que vous apportez. Demandée dans une candidature sur deux environ."
              count={letters.length} countLabel="lettre enregistrée"
              steps={[
                'Vous indiquez à qui vous écrivez et pour quel poste',
                'Vous rédigez quatre paragraphes, chacun expliqué',
                'Vous pouvez ajouter votre signature',
                'Vous téléchargez le PDF prêt à envoyer',
              ]}
              primary={{ label: letters.length ? 'Voir mes lettres' : 'Créer ma lettre', href: letters.length ? '/mes-lettres' : '/lettres/creer', icon: letters.length ? 'mail' : 'plus' }}
              secondary={letters.length
                ? { label: 'Créer une autre lettre', href: '/lettres/creer', icon: 'plus' }
                : null}
              extra={
                <span className="text-xs" style={{ color: 'var(--c-muted)' }}>
                  Vos coordonnées peuvent être reprises d'un CV existant, en un clic.
                </span>
              }
            />
          </div>
        </section>

        {/* Rassurances */}
        <section className="max-w-5xl mx-auto px-6 pb-10">
          <div className="card p-5">
            <h2 className="text-sm font-semibold mb-4">Bon à savoir avant de commencer</h2>
            <div className="grid sm:grid-cols-3 gap-5">
              {[
                { icon: 'user', title: 'Aucun compte à créer', text: "Pas d'inscription, pas de mot de passe, pas d'email à donner. Vous commencez directement." },
                { icon: 'shield', title: 'Vos données restent chez vous', text: "Tout est enregistré dans votre navigateur, sur cet appareil. Rien n'est stocké sur un serveur." },
                { icon: 'copy', title: 'Changer d\'appareil', text: <>Un code de transfert permet de retrouver vos documents ailleurs. <button onClick={() => router.push('/transfert')} className="underline" style={{ color: 'var(--c-primary)' }}>Voir comment</button></> },
              ].map(p => (
                <div key={p.title} className="flex gap-3">
                  <div className="w-7 h-7 flex items-center justify-center shrink-0"
                    style={{ background: '#eef1f5', color: 'var(--c-primary)', borderRadius: 'var(--r-md)' }}>
                    <Icon name={p.icon} size={14} />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold mb-0.5">{p.title}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--c-muted)' }}>{p.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {cvs.length === 0 && letters.length === 0 && (
              <div className="mt-5 pt-4 flex flex-wrap items-center gap-3" style={{ borderTop: '1px solid var(--c-border)' }}>
                <span className="text-xs" style={{ color: 'var(--c-muted)' }}>
                  Vous préférez voir le résultat avant de vous lancer ?
                </span>
                <button onClick={loadDemo} className="btn-secondary !py-1.5 !text-xs">
                  <Icon name="eye" size={13} /> Ouvrir un CV d'exemple
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Trouver des offres */}
        <section className="max-w-5xl mx-auto px-6 pb-12">
          <button onClick={() => router.push('/offres')}
            className="w-full card p-5 flex items-center gap-4 text-left transition-shadow hover:shadow-md">
            <div className="w-9 h-9 flex items-center justify-center shrink-0"
              style={{ background: '#eef1f5', color: 'var(--c-primary)', borderRadius: 'var(--r-md)' }}>
              <Icon name="search" size={17} />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-semibold">Vous cherchez encore des offres ?</h2>
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--c-muted)' }}>
                La recherche se fait sur France Travail, où les annonces sont à jour.
                Vos critères sont pré-remplis à partir de votre CV.
              </p>
            </div>
            <Icon name="arrowRight" size={16} style={{ color: 'var(--c-faint)' }} />
          </button>
        </section>
      </main>
    </div>
  )
}

// Bloc d'un univers (CV ou lettre), identifiable par sa couleur
function Universe({ color, light, border, icon, tag, title, intro, count, countLabel, steps, primary, secondary, extra }) {
  const router = useRouter()
  return (
    <section className="flex flex-col overflow-hidden"
      style={{ border: `1px solid ${border}`, borderRadius: 'var(--r-lg)', background: '#fff' }}>
      {/* Bandeau coloré */}
      <div className="px-5 py-4 flex items-center gap-3" style={{ background: light, borderBottom: `1px solid ${border}` }}>
        <div className="w-9 h-9 flex items-center justify-center shrink-0 text-white"
          style={{ background: color, borderRadius: 'var(--r-md)' }}>
          <Icon name={icon} size={18} />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>{tag}</span>
          <h2 className="text-base font-semibold leading-tight" style={{ color: 'var(--c-ink)' }}>{title}</h2>
        </div>
        {count > 0 && (
          <span className="ml-auto badge shrink-0" style={{ background: '#fff', color, border: `1px solid ${border}` }}>
            {count} {countLabel}{count > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--c-body)' }}>{intro}</p>

        <ol className="flex flex-col gap-2 mb-5">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-2.5 text-xs leading-relaxed" style={{ color: 'var(--c-muted)' }}>
              <span className="w-4 h-4 flex items-center justify-center shrink-0 mt-px text-[10px] font-bold"
                style={{ background: light, color, borderRadius: '50%' }}>{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>

        <div className="mt-auto flex flex-col gap-2">
          <button onClick={() => router.push(primary.href)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: color, borderRadius: 'var(--r-md)' }}>
            <Icon name={primary.icon} size={15} /> {primary.label}
          </button>
          {secondary && (
            <button onClick={() => router.push(secondary.href)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors"
              style={{ background: '#fff', color, border: `1px solid ${border}`, borderRadius: 'var(--r-md)' }}>
              <Icon name={secondary.icon} size={15} /> {secondary.label}
            </button>
          )}
          {extra && <div className="pt-1">{extra}</div>}
        </div>
      </div>
    </section>
  )
}
