# Déploiement de Mot mélangé (multijoueur)

L'application se compose de deux parties à déployer séparément :

1. **Le serveur PartyKit** — gère les salles multijoueur en temps réel
2. **Le frontend Vite/React** — l'interface web (GitHub Pages, Vercel, Netlify, etc.)

---

## 1. Déployer le serveur PartyKit

### Prérequis

- Un compte sur [partykit.dev](https://partykit.dev) (connexion via GitHub)

### Étapes

1. **Se connecter à PartyKit** :

   ```bash
   npx partykit login
   ```

   Cela ouvre un navigateur pour l'authentification GitHub.

2. **Déployer le serveur** :

   ```bash
   npm run deploy:partykit
   ```

   Ou directement :

   ```bash
   npx partykit deploy
   ```

3. **Noter l'URL de déploiement** affichée dans le terminal. Elle ressemble à :

   ```
   mot-aleatoire.VOTRE_USERNAME.partykit.dev
   ```

   C'est cette URL qu'il faudra fournir au frontend.

### Redéployer après des modifications

Après toute modification de `party/server.js`, relancer :

```bash
npm run deploy:partykit
```

### Administration sécurisée du leaderboard (backup / restore / clear)

Le leaderboard de compétition expose maintenant des endpoints admin protégés par token.

Configurer un secret côté PartyKit :

```bash
npx partykit env add LEADERBOARD_ADMIN_TOKEN
```

Puis entrer un token long et aléatoire.

Les endpoints admin utilisent `Authorization: Bearer <LEADERBOARD_ADMIN_TOKEN>`.
Le room id global est `global`, donc base URL :

```text
https://mot-aleatoire.VOTRE_USERNAME.partykit.dev/parties/leaderboard/global
```

Exporter le leaderboard :

```bash
curl -sS \
  -H "Authorization: Bearer $LEADERBOARD_ADMIN_TOKEN" \
  "https://mot-aleatoire.VOTRE_USERNAME.partykit.dev/parties/leaderboard/global/admin/export"
```

Restaurer un snapshot :

```bash
curl -sS -X POST \
  -H "Authorization: Bearer $LEADERBOARD_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  --data @snapshot.json \
  "https://mot-aleatoire.VOTRE_USERNAME.partykit.dev/parties/leaderboard/global/admin/restore"
```

Format attendu de `snapshot.json` :

```json
{
  "entries": [
    {
      "playerId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "playerName": "Nom",
      "score": 123,
      "wordsFound": 10,
      "tierReached": 2,
      "allWordsCompleted": false,
      "date": "2026-03-03T15:04:05.000Z"
    }
  ]
}
```

Vider le leaderboard :

```bash
curl -sS -X POST \
  -H "Authorization: Bearer $LEADERBOARD_ADMIN_TOKEN" \
  "https://mot-aleatoire.VOTRE_USERNAME.partykit.dev/parties/leaderboard/global/admin/clear"
```

---

## 2. Déployer le frontend

### Configuration de l'environnement

Avant de build le frontend, il faut configurer l'URL du serveur PartyKit.

Créer un fichier `.env.production.local` à la racine du projet :

```bash
VITE_PARTYKIT_HOST=mot-aleatoire.VOTRE_USERNAME.partykit.dev
```

Remplacer `VOTRE_USERNAME` par votre nom d'utilisateur GitHub (celui utilisé pour `partykit login`).

### Build

```bash
npm run build
```

Le site statique est généré dans le dossier `dist/`.

### Options de déploiement

#### GitHub Pages

Le projet est déjà configuré avec `base: "/mot_aleatoire/"` dans `vite.config.js`.

1. Pousser le contenu de `dist/` vers la branche `gh-pages`, ou configurer GitHub Actions pour le build automatique.

2. Dans les paramètres du dépôt GitHub → Pages → sélectionner la source.

3. **Important** : configurer la variable d'environnement `VITE_PARTYKIT_HOST` dans le workflow GitHub Actions avant l'étape de build :

   ```yaml
   - name: Build
     run: npm run build
     env:
       VITE_PARTYKIT_HOST: mot-aleatoire.VOTRE_USERNAME.partykit.dev
   ```

#### Vercel

1. Importer le dépôt sur [vercel.com](https://vercel.com).
2. Dans Settings → Environment Variables, ajouter :
   - `VITE_PARTYKIT_HOST` = `mot-aleatoire.VOTRE_USERNAME.partykit.dev`
3. Vercel détecte automatiquement Vite et lance `npm run build`.

#### Netlify

1. Importer le dépôt sur [netlify.com](https://netlify.com).
2. Dans Site Settings → Environment Variables, ajouter :
   - `VITE_PARTYKIT_HOST` = `mot-aleatoire.VOTRE_USERNAME.partykit.dev`
3. Build command : `npm run build`, publish directory : `dist`.

---

## 3. Développement local

Pour développer en local, lancer les deux serveurs dans deux terminaux :

```bash
# Terminal 1 : serveur PartyKit
npm run dev:partykit

# Terminal 2 : frontend Vite
npm run dev
```

Le frontend utilise `localhost:1999` par défaut pour le serveur PartyKit en développement.

---

## Résumé

| Étape | Commande |
|-------|----------|
| Login PartyKit | `npx partykit login` |
| Déployer le serveur | `npm run deploy:partykit` |
| Configurer l'URL | Créer `.env.production.local` avec `VITE_PARTYKIT_HOST=...` |
| Build le frontend | `npm run build` |
| Déployer le frontend | Pousser `dist/` vers votre hébergeur |
