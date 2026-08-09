# Variables d'environnement à créer sur Vercel

Où les saisir : votre projet sur **vercel.com** → onglet **Settings** → rubrique
**Environment Variables** → bouton **Add New**.

Pour chaque variable, cochez les trois environnements proposés
(**Production**, **Preview**, **Development**) sauf indication contraire.

---

## 1. `ANTHROPIC_API_KEY` — active les suggestions et corrections

| | |
|---|---|
| **Nom exact** | `ANTHROPIC_API_KEY` |
| **Valeur** | Votre clé, qui commence par `sk-ant-api03-` et fait 108 caractères |
| **Où la trouver** | Dans votre fichier `.env.local`, ligne `ANTHROPIC_API_KEY=` — copiez tout ce qui suit le `=`, sans espace ni guillemets. Sinon : console.anthropic.com → API Keys |
| **Sans elle** | Le site fonctionne, mais les boutons « Proposer des reformulations », le générateur d'accroche, le brouillon de lettre et l'analyse détaillée des CV importés affichent un message d'indisponibilité |

C'est **la seule variable nécessaire** pour répondre à votre besoin : accéder aux
suggestions et corrections sur la version déployée.

> ⚠️ Le nom ne doit jamais commencer par `NEXT_PUBLIC_`. Ce préfixe rendrait la
> clé visible dans le navigateur de tous les visiteurs.

---

## 2. `ADMIN_CODE` — protège l'espace administrateur

| | |
|---|---|
| **Nom exact** | `ADMIN_CODE` |
| **Valeur** | Un mot de passe que vous choisissez, **12 caractères minimum** |
| **Sans elle** | Les pages `/dashboard` et `/offer-analyzer` restent inaccessibles à tout le monde, y compris vous |

**Ne réutilisez pas `yanis-admin-2026`** : cette valeur a servi aux tests et
figure dans notre échange. Prenez autre chose, par exemple une phrase :
`Tremplin-Cv-2026-Lyon!`

C'est ce code qui vous exempte aussi de la limitation horaire (voir plus bas).

---

## 3. `ADMIN_NAME` — facultatif

| | |
|---|---|
| **Nom exact** | `ADMIN_NAME` |
| **Valeur** | `Yanis` |
| **Rôle** | Nom affiché après connexion : « Connecté en tant que Yanis » |

---

## 4. `APIFY_API_TOKEN` — facultatif

| | |
|---|---|
| **Nom exact** | `APIFY_API_TOKEN` |
| **Valeur** | Votre jeton, qui commence par `apify_api_` (46 caractères), dans `.env.local` |
| **Rôle** | Recherche d'offres multi-sources, dans l'espace administrateur uniquement |
| **Sans elle** | La page `/offres` (publique, vers France Travail) fonctionne normalement ; seule la recherche interne de l'espace admin est indisponible |

---

## 5. `KV_REST_API_URL` et `KV_REST_API_TOKEN` — transfert entre appareils

Ces deux variables activent le **code de transfert à 6 chiffres** qui permet de
retrouver ses CV et lettres sur un autre ordinateur ou téléphone.

Vous n'avez pas à les saisir à la main : Vercel les crée automatiquement.

1. Dans votre projet Vercel, onglet **Storage** → **Create Database**
2. Choisissez **Upstash for Redis** (anciennement Vercel KV), formule gratuite
3. Nommez la base, par exemple `jobready-transfert`, puis **Create**
4. À l'écran suivant, **Connect to Project** → sélectionnez votre projet
5. Vercel ajoute alors `KV_REST_API_URL` et `KV_REST_API_TOKEN` (plus quelques
   variantes) aux variables du projet
6. Redéployez

**Sans ces variables**, la page `/transfert` reste accessible et propose la
**sauvegarde par fichier** : l'utilisateur télécharge un fichier et le restaure
sur l'autre appareil. Cette méthode ne fait transiter aucune donnée et n'expire
jamais — elle suffit parfaitement pour une version de test.

**Ce qui est réellement stocké.** Les documents sont chiffrés dans le navigateur
avant tout envoi, avec une clé dérivée du code de transfert. Ce code n'est jamais
transmis : le serveur ne reçoit qu'un identifiant opaque (empreinte à sens unique)
et un bloc chiffré qu'il ne peut pas lire. Ni vous en tant qu'administrateur, ni
l'hébergeur de la base ne pouvez déchiffrer les CV déposés.

Le dépôt est effacé automatiquement au bout de 24 heures. Les tentatives sont
limitées à 6 par identifiant et 30 par heure et par adresse IP, ce qui rend
impraticable la recherche de codes au hasard.

C'est un point intéressant à expliquer en entretien : le choix de ne pas pouvoir
lire les données de ses propres utilisateurs est une décision de conception, pas
une contrainte technique.

---

## 6. Variables à NE PAS créer

- `NEXT_PUBLIC_APP_URL` : inutile sur Vercel, qui fournit l'URL automatiquement
- `AI_MODEL_ADVANCED`, `AI_MODEL_FAST`, `AI_MODEL_FALLBACK` : des valeurs par
  défaut sont déjà définies dans le code

---

## Récapitulatif à copier

```
ANTHROPIC_API_KEY   = sk-ant-api03-…            (votre clé, 108 caractères)
ADMIN_CODE          = …                          (12 caractères minimum, nouveau)
ADMIN_NAME          = Yanis
APIFY_API_TOKEN     = apify_api_…                (facultatif)
```

---

## Étape indispensable après la saisie

Les variables ne s'appliquent **pas** au déploiement déjà en ligne. Il faut en
relancer un :

1. Onglet **Deployments**
2. Sur la ligne du déploiement le plus récent, menu `⋯` à droite
3. **Redeploy** → confirmer

Comptez une à deux minutes. Ensuite, ouvrez votre CV, cliquez sur
« Proposer des reformulations » : trois propositions doivent apparaître.

---

## Limitation d'usage mise en place

L'URL étant publique, chaque visiteur consomme vos crédits d'API. Des quotas
horaires par visiteur sont donc appliqués :

| Fonction | Limite par heure |
|---|---|
| Reformulations | 25 |
| Générations d'accroche | 15 |
| Brouillons de lettre | 10 |
| Analyses de CV importé | 6 |

Un utilisateur qui atteint une limite reçoit un message expliquant quand
réessayer ; toutes les autres fonctions (écriture, modèles, contrôle ATS,
export PDF) restent disponibles.

**Vous en êtes exempté** dès que vous êtes connecté sur `/admin` avec votre
`ADMIN_CODE` : vous pouvez faire une démonstration sans jamais être bloqué.

À savoir : le compteur est gardé en mémoire de l'instance serveur. Vercel
pouvant démarrer plusieurs instances, la limite est une protection efficace
contre un usage anormal, mais pas une garantie stricte au nombre près.

### Sécurité complémentaire recommandée

Définissez un **plafond de dépense** sur console.anthropic.com
(*Settings → Limits*). C'est la seule protection qui ne dépend d'aucun
comportement du site. Pour donner un ordre de grandeur : une reformulation
coûte environ 0,001 $, une analyse de CV environ 0,012 $. Un plafond de 5 $
par mois couvre largement une démonstration et une phase de test.
