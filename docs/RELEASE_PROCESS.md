# Processus de Release

Ce document décrit la procédure pour effectuer une mise en production (Release).

## 1. Pré-requis (Release Gate)

Avant de commencer, valider la checklist : [RELEASE_GATE.md](./RELEASE_GATE.md).

## 2. Validation Technique (Healthcheck)

Lancer le job de healthcheck sur la production (ou staging) :

- **Via GitHub Actions** : Aller dans l'onglet "Actions" > "Production Healthcheck" > "Run workflow".
- **En local** :
  ```bash
  node scripts/ci-healthcheck.js https://www.accesdirectaide.fr
  ```

Si le healthcheck échoue, la release est **interdite**.

## 3. Création du Tag (Git)

Nous utilisons [SemVer](https://semver.org/) (vX.Y.Z).

```bash
# Vérifier que vous êtes sur main et à jour
git checkout main
git pull

# Créer le tag
git tag -a v1.0.0 -m "Release v1.0.0: Description courte"

# Pousser le tag
git push origin v1.0.0
```

## 4. Sentry Release

Associer la release Sentry au commit pour le suivi des erreurs.

### Configuration Build
Assurez-vous que la variable d'environnement `VITE_SENTRY_RELEASE` est définie lors du build de production (ex: dans Vercel).
Recommandation : utiliser le hash du commit ou le tag.

### Commande CLI
Utiliser `sentry-cli` pour déclarer la release :

```bash
# Définir la version (ex: v1.0.0)
export SENTRY_RELEASE=v1.0.0

# Créer la release
npx sentry-cli releases new -p acces-direct-aide $SENTRY_RELEASE

# Associer les commits (automatique si dans le repo git)
npx sentry-cli releases set-commits $SENTRY_RELEASE --auto

# Finaliser la release
npx sentry-cli releases finalize $SENTRY_RELEASE
```

## 2026-01-25 - Build Info Modification
- **Change**: `api/_utils/build-info.js` is now untracked and in `.gitignore`.
- **Reason**: To prevent dirty working tree after every build (timestamp update).
- **Mechanism**: The file is generated automatically via `scripts/inject-headers.js` during `postinstall` (for Vercel/CI) and `npm run build`.
