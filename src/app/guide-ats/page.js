'use client'
import { useRouter } from 'next/navigation'
import AppHeader from '@/components/ui/AppHeader'
import Icon from '@/components/ui/Icon'

const RULES = [
  {
    title: 'Une seule colonne, pas de cadres',
    do: "Un CV qui se lit de haut en bas, rubrique après rubrique.",
    dont: "Les mises en page en deux colonnes, les zones de texte et les tableaux : le logiciel peut lire les colonnes l'une dans l'autre et mélanger vos informations.",
  },
  {
    title: 'Du texte, jamais des images',
    do: "Écrire les informations en texte, y compris le téléphone et l'email.",
    dont: "Mettre son nom, ses coordonnées ou ses compétences dans un logo ou une image : le logiciel n'y lit rien, votre candidature paraît vide.",
  },
  {
    title: 'Des titres de rubriques classiques',
    do: "« Expériences professionnelles », « Formation », « Compétences », « Langues ».",
    dont: "Les intitulés créatifs (« Mon parcours », « Ce qui me fait vibrer ») : le logiciel ne sait pas dans quelle catégorie ranger le contenu.",
  },
  {
    title: "Reprendre les mots de l'offre",
    do: "Utiliser les termes exacts de l'annonce pour le titre du poste et les compétences (si l'offre dit « préparateur de commandes », écrivez-le ainsi).",
    dont: "N'employer que des synonymes ou du jargon interne à votre ancienne entreprise : le tri se fait sur des mots-clés.",
  },
  {
    title: 'Des dates complètes et cohérentes',
    do: "Indiquer mois et année pour chaque expérience (ex. « Mars 2022 — Aujourd'hui »).",
    dont: "Laisser des périodes vides ou n'écrire que « 3 ans » : le logiciel calcule votre ancienneté à partir des dates.",
  },
  {
    title: 'Un fichier PDF texte',
    do: "Exporter en PDF depuis l'outil, ce qui conserve le texte sélectionnable.",
    dont: "Envoyer une photo ou un scan de CV, ni un PDF issu d'une capture d'écran : le contenu devient invisible pour le logiciel.",
  },
]

export default function GuideAtsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main>
        <section className="bg-white" style={{ borderBottom: '1px solid var(--c-border)' }}>
          <div className="max-w-3xl mx-auto px-6 py-11">
            <span className="badge badge-primary mb-3">Guide pratique</span>
            <h1 className="text-2xl md:text-[30px] font-semibold leading-tight">
              Qu'est-ce qu'un CV « compatible ATS » ?
            </h1>
            <p className="mt-4 leading-relaxed" style={{ color: 'var(--c-body)' }}>
              La plupart des grandes entreprises et des sites d'offres utilisent un logiciel de
              suivi des candidatures — un <strong>ATS</strong>, pour <em>Applicant Tracking System</em>.
              Ce logiciel lit automatiquement votre CV, en extrait les informations
              (nom, poste, expériences, compétences) puis les classe. Un recruteur ne voit
              souvent votre candidature qu'après cette lecture automatique.
            </p>
            <div className="note note-info mt-5">
              <Icon name="info" size={15} />
              <span>
                Un CV très graphique peut être parfaitement lisible pour un humain et
                pourtant mal interprété par un logiciel. L'enjeu n'est pas d'avoir un CV
                fade, mais un CV <strong>structuré</strong>.
              </span>
            </div>
          </div>
        </section>

        {/* Règles */}
        <section className="max-w-3xl mx-auto px-6 py-10">
          <h2 className="text-base font-semibold mb-4">Les six règles essentielles</h2>
          <div className="flex flex-col gap-3">
            {RULES.map((r, i) => (
              <article key={r.title} className="card p-5">
                <h3 className="text-sm font-semibold mb-3 flex items-start gap-2.5">
                  <span className="w-5 h-5 flex items-center justify-center text-[11px] font-bold shrink-0 mt-px"
                    style={{ background: 'var(--c-primary-light)', color: 'var(--c-primary)', borderRadius: 'var(--r-sm)' }}>
                    {i + 1}
                  </span>
                  {r.title}
                </h3>
                <div className="flex flex-col gap-2 pl-7">
                  <p className="flex gap-2 text-sm leading-relaxed">
                    <Icon name="check" size={15} style={{ color: 'var(--c-success)', marginTop: 3 }} />
                    <span><strong style={{ color: 'var(--c-success)' }}>À faire — </strong>{r.do}</span>
                  </p>
                  <p className="flex gap-2 text-sm leading-relaxed" style={{ color: 'var(--c-muted)' }}>
                    <Icon name="close" size={15} style={{ color: 'var(--c-danger)', marginTop: 3 }} />
                    <span><strong style={{ color: 'var(--c-danger)' }}>À éviter — </strong>{r.dont}</span>
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Application dans l'outil */}
        <section className="max-w-3xl mx-auto px-6 pb-10">
          <div className="card p-6">
            <h2 className="text-base font-semibold mb-3">Comment l'outil vous aide</h2>
            <ul className="flex flex-col gap-3">
              {[
                { icon: 'layout', text: <>Quatre des six modèles proposés sont sur une seule colonne. Le modèle <strong>Simple ATS</strong> est le plus sûr pour un dépôt sur un site d'offres ; les modèles à colonne latérale conviennent mieux à une candidature remise en main propre ou par email.</> },
                { icon: 'shield', text: <>L'onglet <strong>Contrôle</strong> de l'éditeur affiche un score de lisibilité ATS et signale précisément ce qui bloque : titre trop long, compétences absentes, dates manquantes, mise en page à risque.</> },
                { icon: 'download', text: <>L'export produit un <strong>PDF texte</strong>, dont le contenu reste sélectionnable et donc lisible par les logiciels.</> },
                { icon: 'pencil', text: <>L'aide à la rédaction vous propose des formulations plus précises, sans jargon, avec des verbes d'action et des résultats concrets.</> },
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <div className="w-7 h-7 flex items-center justify-center shrink-0"
                    style={{ background: '#eef1f5', color: 'var(--c-primary)', borderRadius: 'var(--r-md)' }}>
                    <Icon name={item.icon} size={14} />
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--c-body)' }}>{item.text}</p>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2.5 mt-6">
              <button onClick={() => router.push('/creer')} className="btn-primary">
                <Icon name="plus" size={15} /> Créer un CV compatible ATS
              </button>
              <button onClick={() => router.push('/mes-cv')} className="btn-secondary">
                <Icon name="files" size={15} /> Vérifier un CV existant
              </button>
            </div>
          </div>

          <p className="text-xs mt-5 leading-relaxed" style={{ color: 'var(--c-faint)' }}>
            À retenir : aucun outil ne garantit de passer le filtre d'un logiciel donné,
            chaque employeur configurant le sien. Ces règles réduisent nettement le risque
            que votre CV soit mal lu, mais c'est la pertinence de votre candidature au
            regard de l'offre qui reste déterminante.
          </p>
        </section>
      </main>
    </div>
  )
}
