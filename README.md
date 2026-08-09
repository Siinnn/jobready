# JobReady

Application web d'aide à la création de **CV** et de **lettres de motivation**,
conçue pour des demandeurs d'emploi, avec un accent particulier sur la
**compatibilité ATS** — la lisibilité du CV par les logiciels de recrutement.

Projet personnel développé pour répondre à un constat simple : beaucoup de
candidatures sont écartées non pas pour le fond, mais parce que le CV est mal
structuré, incomplet, ou illisible par les outils utilisés par les recruteurs.

---

## Ce que fait l'application

### Création de CV
- Parcours guidé en 7 étapes (identité, accroche, expériences, formation, compétences, langues, modèle)
- 6 modèles interchangeables **sans perte de données**, dont un modèle « Simple ATS » très sobre
- Éditeur à double panneau : formulaires à gauche, aperçu A4 temps réel à droite
- Rubriques ajoutables, masquables et réordonnables ; personnalisation couleur, police, taille, espacement
- Sélecteurs de période Mois/Année avec case « poste actuel »
- Export PDF fidèle à l'aperçu
- Gestion de plusieurs CV : duplication, renommage, suppression

### Contrôle qualité et ATS
- Deux scores recalculés en direct : **qualité générale** et **lisibilité ATS**
- 19 vérifications déterministes (aucun appel réseau), chacune accompagnée d'un conseil actionnable :
  rubriques incomplètes, dates manquantes, absence de verbes d'action ou de résultats chiffrés,
  intitulé de poste trop long, mise en page à risque, compétences insuffisantes en mots-clés…
- Page pédagogique `/guide-ats` expliquant ce qu'est un ATS et les six règles à respecter

### Lettres de motivation
- Création guidée en 3 étapes, coordonnées reprises d'un CV existant en un clic
- Corps structuré en 4 paragraphes (accroche, profil, motivation, conclusion), réordonnables
- Aperçu au format courrier français : expéditeur, destinataire, lieu et date, objet, formule d'appel, signature
- Compteur de mots avec alerte hors de la fourchette 150–380 mots
- Export PDF, duplication d'une lettre pour candidater ailleurs

### Aide à la rédaction
- Trois reformulations proposées pour chaque texte, avec choix du ton (percutant, sobre, dynamique)
- Générateur d'accroche guidé par trois questions
- Brouillon de lettre en quatre paragraphes à partir du CV et du poste visé
- Consigne stricte de ne rien inventer : aucun fait, chiffre ou diplôme absent des données saisies

### Recherche d'offres
- Espace public : redirection vers la recherche **France Travail** avec les critères pré-remplis depuis le CV
- Espace administrateur (protégé) : recherche multi-sources et adaptation de CV à une offre précise

---

## Architecture technique

| Élément | Choix |
|---|---|
| Framework | Next.js 14 (App Router) |
| Rendu | React 18, Tailwind CSS + variables CSS pour les tokens de design |
| Stockage | `localStorage` — aucune base de données, aucun compte, aucune donnée personnelle sur le serveur |
| Export PDF | Impression du rendu HTML (`@media print`) : un seul moteur de rendu pour l'écran et le PDF |
| Authentification admin | Jeton signé HMAC-SHA256 dans un cookie `httpOnly`, vérifié par un middleware Edge |
| Icônes | Jeu de 40 icônes SVG au trait, sans dépendance externe |

### Points de conception notables

**Un seul moteur de rendu.** Les modèles de CV sont de simples fichiers de
configuration (`src/templates/index.js`) consommés par un unique composant de
rendu. Ajouter un modèle ne demande donc pas de réécrire l'export PDF.

**Extraction de CV en cascade.** `src/lib/cvExtract.js` enchaîne plusieurs
niveaux pour éviter les échecs silencieux : extraction PDF avec moteur de repli,
détection des PDF scannés, nettoyage du texte (ligatures, césures), repérage
déterministe par expressions régulières (email, téléphone, LinkedIn, code
postal) et découpage en rubriques, puis structuration par modèle de langue avec
seconde tentative, normalisation typée et bilan affiché à l'utilisateur.
Le repérage déterministe sert de filet : même si l'étape suivante échoue, les
coordonnées sont conservées.

**Fonctionne sans clé d'API.** Création, modèles, contrôle qualité et export PDF
ne font aucun appel réseau. Sans clé, seule l'aide à la rédaction est
indisponible, et l'interface l'explique au lieu de renvoyer une erreur.

### Structure

```
src/
├── app/                  Pages et routes API (App Router)
│   ├── creer/            Parcours de création de CV
│   ├── editeur/          Éditeur de CV
│   ├── mes-cv/           Liste des CV
│   ├── lettres/          Création et édition de lettres
│   ├── mes-lettres/      Liste des lettres
│   ├── guide-ats/        Guide pédagogique ATS
│   ├── offres/           Redirection France Travail
│   ├── admin/            Connexion administrateur
│   └── api/              Routes serveur
├── components/
│   ├── cv/               Rendu du CV (écran + PDF)
│   ├── letter/           Rendu de la lettre
│   ├── editor/           Champs de formulaire, galerie de modèles
│   ├── ai/               Aide à la rédaction, contrôle qualité
│   └── ui/               En-tête, icônes
├── lib/
│   ├── cvModel.js        Modèle de données du CV
│   ├── letterModel.js    Modèle de données de la lettre
│   ├── cvExtract.js      Extraction et fiabilisation d'un CV importé
│   ├── cvScore.js        Contrôles qualité et ATS
│   ├── ai.js             Couche d'accès au service de génération de texte
│   └── adminAuth.js      Jetons de session administrateur
├── templates/            Configuration des 6 modèles de CV
└── middleware.js         Protection des routes administrateur
```

---

## Installation en local

```bash
npm install
cp .env.local.example .env.local   # puis renseigner les variables
npm run dev
```

L'application est disponible sur http://localhost:3000

### Variables d'environnement

| Variable | Rôle | Obligatoire |
|---|---|---|
| `ANTHROPIC_API_KEY` | Aide à la rédaction et analyse détaillée des CV importés | Non |
| `ADMIN_CODE` | Code d'accès à l'espace administrateur (6 caractères minimum) | Non |
| `ADMIN_NAME` | Nom affiché après connexion admin | Non |
| `APIFY_API_TOKEN` | Recherche d'offres multi-sources (espace admin) | Non |

Aucune n'est indispensable au démarrage : sans clé, l'application reste
utilisable pour créer, modifier et exporter des CV et des lettres.

Pour le déploiement, la fiche [VARIABLES-VERCEL.md](./VARIABLES-VERCEL.md)
détaille chaque variable et la procédure exacte.

### Transfert entre appareils : modèle de sécurité

Les documents étant stockés dans le navigateur, un transfert par code permet de
les retrouver ailleurs sans créer de compte. Comme il s'agit de données
personnelles (identité, coordonnées, parcours professionnel), le transfert est
**chiffré de bout en bout** :

```
code (12 caractères, 60 bits d'entropie, généré localement)
 ├── SHA-256 ─────────────► identifiant de dépôt   → envoyé au serveur
 └── PBKDF2 (250 000 tours) ─► clé AES-GCM 256 bits → jamais envoyée
```

Le serveur ne reçoit qu'un identifiant opaque et un bloc chiffré. Il ne dispose
d'aucun moyen de déchiffrer : ni l'hébergeur, ni l'administrateur du site ne
peuvent lire les CV déposés. Le dépôt est effacé automatiquement au bout de
24 heures.

Contre la recherche de codes au hasard, deux limites cumulées : 6 tentatives par
identifiant, et **30 tentatives par heure et par adresse IP** toutes clés
confondues — c'est cette seconde limite qui rend l'énumération impraticable.

La sauvegarde par fichier, elle, ne fait transiter aucune donnée mais produit un
fichier **non chiffré** : l'interface le signale explicitement.

Limites assumées : un attaquant ayant accès à la base obtient des blocs chiffrés
inexploitables sans les codes ; en revanche il connaît le nombre de dépôts et
leurs dates. Le code transitant par l'utilisateur (note, message), sa sécurité
finale dépend de la façon dont celui-ci le transmet — d'où l'avertissement
« ne le partagez qu'avec vous-même » dans l'interface.

### Limitation d'usage

Les routes consommant des crédits d'API sont soumises à un quota horaire par
visiteur (25 reformulations, 15 accroches, 10 brouillons de lettre, 6 analyses
de CV). L'administrateur connecté en est exempté. Le compteur étant tenu en
mémoire de l'instance, il s'agit d'une protection contre un usage anormal, à
compléter par un plafond de dépense côté fournisseur d'API.

---

## Déploiement sur Vercel

### Par l'interface web (recommandé)

1. Créer un dépôt Git et y pousser le projet :
   ```bash
   git init
   git add .
   git commit -m "Version initiale"
   git branch -M main
   git remote add origin https://github.com/<votre-compte>/jobready.git
   git push -u origin main
   ```
2. Sur [vercel.com](https://vercel.com), se connecter avec GitHub puis **Add New → Project**
3. Sélectionner le dépôt. Vercel détecte Next.js automatiquement : aucun réglage à modifier
4. Dans **Environment Variables**, ajouter les variables souhaitées (au minimum
   `ANTHROPIC_API_KEY` et `ADMIN_CODE` si vous voulez ces fonctions)
5. **Deploy**. L'URL de production est disponible en une à deux minutes

### Par la ligne de commande

```bash
npm install -g vercel
vercel login
vercel            # déploiement de prévisualisation
vercel --prod     # déploiement en production
```

Les variables d'environnement s'ajoutent ensuite dans
*Project Settings → Environment Variables*, puis il faut redéployer.

### Notes de déploiement

- La région est fixée à `cdg1` (Paris) dans `vercel.json`, pour réduire la latence en France
- Les durées maximales des fonctions sont relevées pour l'analyse de CV (60 s), compatibles
  avec l'offre gratuite Vercel
- `.env.local` est exclu par `.gitignore` : les clés ne partent jamais dans le dépôt
- L'espace administrateur et les routes API sont exclus de l'indexation (`src/app/robots.js`)

### Autres hébergeurs

Le projet est un Next.js standard sans dépendance propriétaire : il fonctionne
aussi sur Netlify (avec l'adaptateur Next), Railway, Render ou tout hébergeur
Node.js via `npm run build && npm start`. Vercel reste le plus simple, Next.js
étant développé par la même équipe.

---

## Limites connues

- Les CV et lettres sont stockés dans le navigateur : ils ne sont pas synchronisés
  entre appareils et disparaissent si l'utilisateur vide ses données de navigation
- Les PDF scannés (images) ne peuvent pas être importés faute de reconnaissance
  optique de caractères ; l'application le détecte et propose de coller le texte
- Aucun outil ne peut garantir de passer le filtre d'un ATS donné, chaque
  employeur configurant le sien : les vérifications réduisent le risque d'un CV
  mal lu, sans le supprimer

## Licence

Projet personnel à usage de démonstration.
