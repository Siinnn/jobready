# JobReady — Guide de démarrage

Outil d'aide à la création de CV et de lettres de motivation, pensé pour des
demandeurs d'emploi, avec un accent particulier sur la **compatibilité ATS**
(lisibilité du CV par les logiciels de recrutement).

## Prérequis
- Node.js 18 ou plus
- Une clé d'API pour le service de génération de texte (aide à la rédaction)

## 1. Installer les dépendances

```bash
cd jobready
npm install
```

## 2. Configurer l'environnement

```bash
cp .env.local.example .env.local
```

Puis renseignez dans `.env.local` :

| Variable | Rôle | Obligatoire |
|---|---|---|
| `ANTHROPIC_API_KEY` | Aide à la rédaction et analyse de CV | Oui pour ces fonctions |
| `ADMIN_CODE` | Code d'accès à l'espace administrateur (6 caractères min.) | Oui pour l'espace admin |
| `ADMIN_NAME` | Nom affiché une fois connecté | Non |
| `APIFY_API_TOKEN` | Recherche d'offres (espace admin uniquement) | Non |

Sans clé d'API, l'application reste utilisable : création de CV et de lettres,
modèles, contrôle qualité et export PDF fonctionnent sans appel réseau.
Seules les fonctions d'aide à la rédaction et l'import automatique de CV
nécessitent la clé.

## 3. Lancer en développement

```bash
npm run dev
```

Puis ouvrir http://localhost:3000

---

## Les deux espaces

### Espace public — demandeurs d'emploi

Aucun compte, aucune inscription. Les données restent dans le navigateur
(localStorage), sur l'appareil de l'utilisateur.

| Page | Rôle |
|---|---|
| `/` | Accueil : créer un CV, importer un CV, rédiger une lettre |
| `/creer` | Création de CV guidée en 7 étapes |
| `/importer` | Import d'un CV PDF existant, avec bilan de ce qui a été récupéré |
| `/mes-cv` | Tous les CV : modifier, dupliquer, renommer, supprimer |
| `/editeur` | Éditeur de CV : contenu, modèle, style, contrôle qualité + ATS |
| `/lettres/creer` | Création de lettre guidée en 3 étapes |
| `/mes-lettres` | Toutes les lettres |
| `/lettres/editeur` | Éditeur de lettre : texte par paragraphe, coordonnées, mise en page |
| `/guide-ats` | Guide pédagogique : qu'est-ce qu'un CV compatible ATS |
| `/offres` | Recherche d'offres — **redirige vers France Travail** |

### Espace administrateur

Protégé par `ADMIN_CODE`, vérifié côté serveur (jeton signé HMAC dans un cookie
`httpOnly`, session de 12 h, limitation à 6 tentatives puis blocage 10 min).

| Page | Rôle |
|---|---|
| `/admin` | Connexion |
| `/dashboard` | Recherche d'offres multi-sources |
| `/offer-analyzer` | Analyse d'une offre précise et adaptation d'un CV |

La protection est appliquée par `src/middleware.js`, sur les pages **et** sur les
routes API correspondantes (`/api/search-jobs`, `/api/fetch-offer`,
`/api/analyze-offer`, `/api/adapt-cv`) : elles répondent 403 sans session valide.

---

## Fonctionnement de l'aide à la rédaction

Tout passe par des routes API internes ; la clé d'API n'est jamais exposée au
navigateur. La couche d'accès au fournisseur est isolée dans `src/lib/ai.js`.

| Route | Usage |
|---|---|
| `/api/analyze-cv` | Import d'un CV : extraction PDF, repérage, structuration |
| `/api/rewrite` | Trois reformulations d'un texte, selon un ton choisi |
| `/api/suggest` | Génération d'accroches de CV à partir de 3 questions |
| `/api/letter-draft` | Brouillon de lettre en 4 paragraphes |

Le **contrôle qualité du CV** (`src/lib/cvScore.js`) n'utilise aucun appel
réseau : ce sont des règles déterministes recalculées dans le navigateur à
chaque modification.

### Robustesse de l'import de CV

`src/lib/cvExtract.js` enchaîne plusieurs niveaux pour éviter les échecs :

1. Extraction du texte par `pdf-parse`, avec repli sur une lecture brute des
   flux PDF si le moteur principal échoue
2. Détection des PDF scannés (image) avec un message expliquant quoi faire
3. Nettoyage du texte : ligatures, césures en fin de ligne, puces, espaces
4. Repérage déterministe par expressions régulières (email, téléphone,
   LinkedIn, code postal) et découpage en rubriques
5. Structuration par le modèle, avec une seconde tentative sur un extrait plus
   court en cas d'échec
6. Normalisation : types garantis, dédoublonnage, complétion des trous par
   l'étape 4, estimation de l'ancienneté à partir des dates
7. Bilan affiché à l'utilisateur : ce qui a été récupéré, ce qu'il reste à
   compléter

Si tout échoue, les coordonnées repérées à l'étape 4 sont conservées et
l'utilisateur est invité à compléter manuellement.

---

## Déploiement

```bash
npm run build
npm start
```

Sur Vercel : `vercel --prod`, en ajoutant les variables d'environnement dans le
tableau de bord du projet (dont `ADMIN_CODE`).
