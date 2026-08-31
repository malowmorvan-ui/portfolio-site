# Portfolio — Malow Morvan

Site portfolio minimaliste (inspiré de [axelpelletanche.com](https://axelpelletanche.com)) : une page d'accueil qui scroll avec une grille de projets menée par l'image, une page "Info & Contact", et un espace d'administration (`/admin`) protégé par mot de passe pour ajouter/modifier/supprimer des projets sans toucher au code.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS
- **Cloudflare R2** comme unique source de données : les fichiers (images/vidéos) **et** les métadonnées de chaque projet (titre, date, tags, ordre…) sont stockés dans le bucket R2, dans un fichier `projects.json`. Pas de base de données séparée à gérer.
- **Railway** pour l'hébergement (déploiement automatique depuis GitHub)
- Authentification admin par mot de passe unique + cookie de session signé (pas de base d'utilisateurs, pas de dépendance externe)

```
src/
  app/
    page.tsx              → page d'accueil (grille de projets)
    info/page.tsx          → page Info & Contact
    admin/                 → interface d'administration (protégée)
    api/admin/             → routes API utilisées par l'admin
  components/               → composants (header, footer, grille, formulaire admin)
  content/site-config.ts    → contenu texte de la page Info & Contact (à éditer directement)
  lib/
    r2.ts                  → client Cloudflare R2 (lecture/écriture du manifest, upload)
    auth.ts                → session admin (cookie signé)
    projects.ts             → logique métier (créer/modifier/supprimer/réordonner un projet)
  proxy.ts                  → protège /admin et /api/admin (redirige vers /admin/login)
```

## 1. Développement local

```bash
npm install
cp .env.example .env.local
# remplis .env.local (voir étapes 2 et 3 ci-dessous pour obtenir les valeurs R2)
npm run dev
```

Le site est sur http://localhost:3000, l'admin sur http://localhost:3000/admin (mot de passe = `ADMIN_PASSWORD` défini dans `.env.local`).

Tant que les variables R2 ne sont pas renseignées, la page d'accueil et l'admin afficheront une erreur — c'est normal, ils ont besoin du bucket pour lire/écrire les projets. La page `/info` fonctionne sans configuration (son contenu vient de `src/content/site-config.ts`).

## 2. Créer le bucket Cloudflare R2

1. Crée un compte sur [cloudflare.com](https://cloudflare.com) si besoin.
2. Dans le dashboard Cloudflare → **R2 Object Storage** → **Create bucket**. Donne-lui un nom, ex. `portfolio-media`.
3. Ouvre le bucket → **Settings** → **Public Access** → active l'accès public. Cloudflare te donne une URL du type `https://pub-xxxxxxxx.r2.dev` : c'est ta variable `R2_PUBLIC_URL` (tu peux aussi connecter un domaine personnalisé ici si tu en as un, ex. `media.tonsite.com`).
4. Toujours dans R2 → **Manage R2 API Tokens** → **Create API Token**. Donne les permissions **Object Read & Write**, restreins-le à ce bucket si l'option est proposée. Cloudflare affiche une seule fois :
   - `Access Key ID` → `R2_ACCESS_KEY_ID`
   - `Secret Access Key` → `R2_SECRET_ACCESS_KEY`
   - L'**Account ID** (visible aussi dans l'aperçu R2, en haut à droite) → `R2_ACCOUNT_ID`
5. Note le nom du bucket → `R2_BUCKET_NAME`.
6. **CORS** : l'admin uploade les fichiers directement depuis ton navigateur vers R2, il faut donc autoriser ton domaine. Dans le bucket → **Settings** → **CORS Policy**, ajoute :

   ```json
   [
     {
       "AllowedOrigins": ["http://localhost:3000", "https://TON-DOMAINE-RAILWAY.up.railway.app"],
       "AllowedMethods": ["PUT", "GET"],
       "AllowedHeaders": ["*"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

   Remplace le domaine Railway par le tien une fois l'étape 5 faite (tu peux revenir modifier cette règle à tout moment).

## 3. Variables d'environnement

Remplis `.env.local` en local, et les mêmes variables dans Railway (étape 5) :

| Variable | D'où vient-elle |
|---|---|
| `R2_ACCOUNT_ID` | Dashboard Cloudflare, aperçu R2 |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | Token API R2 créé à l'étape 2.4 |
| `R2_BUCKET_NAME` | Nom du bucket créé à l'étape 2.2 |
| `R2_PUBLIC_URL` | URL publique du bucket (étape 2.3), sans `/` final |
| `ADMIN_PASSWORD` | Choisis un mot de passe fort — c'est la seule protection de `/admin` |
| `SESSION_SECRET` | Chaîne aléatoire longue, génère-la avec `openssl rand -hex 32` |

## 4. Mettre le code sur GitHub

Crée d'abord un repo **vide** sur github.com (sans README ni .gitignore, pour éviter un conflit avec ce dépôt local), puis :

```bash
git remote add origin https://github.com/TON-COMPTE/TON-REPO.git
git branch -M main
git add -A
git commit -m "Initial commit"
git push -u origin main
```

## 5. Déployer sur Railway

1. Crée un compte sur [railway.app](https://railway.app) et connecte-le à ton compte GitHub.
2. **New Project** → **Deploy from GitHub repo** → sélectionne ton repo.
3. Railway détecte automatiquement Next.js (Nixpacks) et exécute `npm install`, `npm run build`, puis `npm run start`. Rien à configurer côté build.
4. Va dans **Variables** et ajoute toutes les variables du tableau ci-dessus.
5. Va dans **Settings → Networking** → **Generate Domain** pour obtenir une URL publique (`....up.railway.app`), ou connecte ton propre nom de domaine.
6. Chaque `git push` sur `main` redéploie automatiquement le site.

N'oublie pas de revenir mettre à jour la règle CORS du bucket (étape 2.6) avec ce domaine Railway définitif (et ton domaine personnalisé si tu en connectes un).

## 6. Utiliser l'administration (`/admin`)

- Va sur `https://ton-site/admin`, connecte-toi avec `ADMIN_PASSWORD`.
- **Nouveau projet** : titre, date, tags/outils (séparés par des virgules, ex. `3D, Cinema 4D, Octane`), description optionnelle, puis ajoute une ou plusieurs images/vidéos (elles s'uploadent directement vers R2). Coche **Publié** pour qu'il apparaisse sur le site (laisse décoché pour le garder en brouillon).
- Sur le tableau de bord, les flèches ↑/↓ réordonnent les projets sur la page d'accueil, **Modifier** ouvre le formulaire d'édition, **Supprimer** retire le projet et ses fichiers du bucket.
- Le texte de la page **Info & Contact** (bio, outils, clients, contact) n'est pas géré depuis l'admin : édite directement `src/content/site-config.ts`, puis `git push` pour redéployer.

## Sécurité

- Ne commite jamais `.env.local` (déjà ignoré par `.gitignore`).
- Choisis un `ADMIN_PASSWORD` réellement fort : c'est la seule barrière devant `/admin`.
- `SESSION_SECRET` doit être long et aléatoire, et différent en local et en production.
