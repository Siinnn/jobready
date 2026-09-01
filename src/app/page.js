'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import AppHeader from '@/components/ui/AppHeader'
import Icon from '@/components/ui/Icon'
import { createDemoCv } from '@/lib/demoData'
import { createStarterCv } from '@/lib/starterCv'

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
        <section className="bg-white overflow-hidden" style={{ borderBottom: '1px solid var(--c-border)' }}>
          <div className="max-w-5xl mx-auto px-6 py-14 md:py-16 grid md:grid-cols-[1fr_auto] gap-10 items-center">
            <div className="hero-in">
              <h1 className="font-display font-semibold leading-[1.08] max-w-xl"
                style={{ fontSize: 'clamp(2.1rem, 4.5vw, 3.1rem)' }}>
                Préparez vos candidatures : le CV, la lettre, ou les deux
              </h1>
              <p className="mt-5 max-w-xl text-[15px] md:text-base leading-relaxed" style={{ color: 'var(--c-body)' }}>
                Deux outils indépendants. Vous pouvez créer seulement un CV, seulement une lettre
                de motivation, ou les deux selon ce que demande l'offre à laquelle vous répondez.
                Rien n'est obligatoire, et vous pouvez revenir modifier vos documents à tout moment.
              </p>
            </div>
            <div className="hidden md:block hero-in" style={{ animationDelay: '90ms' }}>
              <HeroDocuments />
            </div>
          </div>
        </section>

        {/* Les deux univers */}
        <section className="max-w-5xl mx-auto px-6 pt-10 pb-9">
          <div className="grid md:grid-cols-2 gap-5">

            {/* ── CV ── */}
            <Universe
              delay="0ms"
              color="var(--c-cv)" light="var(--c-cv-light)" border="var(--c-cv-border)"
              icon="file" tag="Document 1"
              title="Mon CV"
              intro="La liste de votre parcours : expériences, formation, compétences. C'est le document demandé dans presque toutes les candidatures."
              count={cvs.length} countLabel="CV enregistré"
              steps={[
                'Vous remplissez vos informations, rubrique par rubrique',
                'Vous choisissez une présentation parmi neuf modèles',
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
              delay="80ms"
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

        {/* Démarrage rapide par métier */}
        <section className="max-w-5xl mx-auto px-6 pb-9">
          <JobStarterCard />
        </section>

        {/* Rassurances */}
        <section className="max-w-5xl mx-auto px-6 pb-10">
          <div className="card p-5">
            <h2 className="text-sm font-semibold mb-4">Bon à savoir avant de commencer</h2>
            <div className="grid sm:grid-cols-3 gap-5">
              {[
                { icon: 'user', title: 'Aucun compte à créer', text: "Pas d'inscription, pas de mot de passe, pas d'email à donner. Vous commencez directement." },
                { icon: 'shield', title: 'Vos données restent chez vous', text: "Tout est enregistré dans votre navigateur, sur cet appareil. Rien n'est stocké sur un serveur." },
                { icon: 'copy', title: 'Changer d\'appareil', text: <>Un code de transfert chiffré permet de retrouver vos documents ailleurs. <button onClick={() => router.push('/transfert')} className="underline" style={{ color: 'var(--c-primary)' }}>Voir comment</button></> },
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

// Démarrage rapide : à partir du seul intitulé d'un métier, prépare un CV
// avec titre, accroche et compétences déjà remplis (grille de compétences
// existante, aucun appel réseau). Il ne reste plus qu'à compléter identité,
// expériences et formation dans l'éditeur.
function JobStarterCard() {
  const router = useRouter()
  const { createCv } = useApp()
  const [job, setJob] = useState('')

  const start = () => {
    const title = job.trim()
    if (!title) return
    createCv(createStarterCv(title))
    router.push('/editeur')
  }

  return (
    <div className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="w-9 h-9 flex items-center justify-center shrink-0"
        style={{ background: 'var(--c-primary-light)', color: 'var(--c-primary)', borderRadius: 'var(--r-md)' }}>
        <Icon name="rocket" size={17} />
      </div>
      <div className="flex-1">
        <h2 className="text-sm font-semibold">Vous savez déjà quel métier vous visez ?</h2>
        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--c-muted)' }}>
          Indiquez l'intitulé du poste : les compétences courantes du métier et une accroche de
          départ sont préremplies pour vous. Il ne vous reste plus qu'à ajouter vos expériences et
          votre formation.
        </p>
      </div>
      <form onSubmit={e => { e.preventDefault(); start() }}
        className="flex gap-2 shrink-0 w-full sm:w-auto">
        <input value={job} onChange={e => setJob(e.target.value)}
          className="input flex-1 sm:w-56" placeholder="Ex : vendeur en boutique"
          aria-label="Intitulé du métier visé" />
        <button type="submit" disabled={!job.trim()} className="btn-primary shrink-0">
          <Icon name="rocket" size={14} /> Démarrer
        </button>
      </form>
    </div>
  )
}

// Ancre visuelle du hero : deux documents miniatures superposés, aux couleurs
// des deux univers, pour montrer plutôt qu'expliquer ce que produit l'outil.
// Purement décoratif → masqué aux lecteurs d'écran.
function HeroDocuments() {
  return (
    <div className="relative w-[210px] h-[220px]" aria-hidden="true">
      {/* Lettre, en arrière-plan */}
      <div className="absolute left-2 top-7 w-[142px] h-[178px] bg-white"
        style={{ border: '1px solid var(--c-letter-border)', borderRadius: 'var(--r-md)', transform: 'rotate(7deg)', boxShadow: '0 10px 26px rgba(122,68,25,0.14)' }}>
        <div style={{ height: 20, background: 'var(--c-letter-light)', borderBottom: '1px solid var(--c-letter-border)', borderRadius: 'var(--r-md) var(--r-md) 0 0' }} />
        <div className="px-3 pt-3 flex flex-col gap-1.5">
          {[82, 68, 90, 55].map((w, i) => (
            <span key={i} className="block h-1.5 rounded-full" style={{ width: `${w}%`, background: '#f1e3d2' }} />
          ))}
        </div>
      </div>

      {/* CV, au premier plan */}
      <div className="absolute right-0 top-0 w-[142px] h-[190px] bg-white"
        style={{ border: '1px solid var(--c-cv-border)', borderRadius: 'var(--r-md)', transform: 'rotate(-5deg)', boxShadow: '0 14px 30px rgba(31,58,104,0.16)' }}>
        <div className="flex items-center px-3" style={{ height: 20, background: 'var(--c-cv-light)', borderBottom: '1px solid var(--c-cv-border)', borderRadius: 'var(--r-md) var(--r-md) 0 0' }}>
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--c-cv)' }} />
        </div>
        <div className="px-3 pt-3 flex flex-col gap-1.5">
          {[78, 95, 58, 84, 62].map((w, i) => (
            <span key={i} className="block h-1.5 rounded-full" style={{ width: `${w}%`, background: i === 0 ? 'var(--c-cv-border)' : '#e7ebf1' }} />
          ))}
        </div>
        {/* Badge « vérifié », rappel du contrôle ATS */}
        <span className="absolute -bottom-3 -right-3 w-7 h-7 flex items-center justify-center text-white"
          style={{ background: 'var(--c-success)', borderRadius: '999px', border: '2px solid #fff' }}>
          <Icon name="check" size={13} />
        </span>
      </div>
    </div>
  )
}

// Bloc d'un univers (CV ou lettre), identifiable par sa couleur
function Universe({ color, light, border, icon, tag, title, intro, count, countLabel, steps, primary, secondary, extra, delay = '0ms' }) {
  const router = useRouter()
  return (
    <section className="flex flex-col overflow-hidden hero-in"
      style={{ border: `1px solid ${border}`, borderRadius: 'var(--r-lg)', background: '#fff', animationDelay: delay }}>
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
