# Politique de Merge et CI

Ce projet utilise une pipeline CI stricte pour garantir la stabilité du produit.

## 1. Processus de Validation (CI)

Chaque Pull Request déclenche automatiquement le workflow GitHub Actions défini dans `.github/workflows/ci.yml`.

Les vérifications suivantes sont effectuées :
1.  **Lint**: `npm run lint` (ESLint) - Vérifie la qualité du code.
2.  **Typecheck**: `npm run typecheck` (TypeScript) - Vérifie les types (notamment les tests et nouvelles features).
3.  **Build**: `npm run build` - Vérifie que l'application compile (Vite + Scripts).
4.  **Smoke Tests E2E**: `npm run test:e2e` (Playwright) - Exécute 10 parcours utilisateurs vitaux sur la version buildée.

**Une PR ne peut être mergée que si tous ces indicateurs sont au vert.**

### Pré-requis CI (Secrets)
Pour que la CI fonctionne, les secrets suivants doivent être configurés dans le dépôt GitHub (Settings -> Secrets and variables -> Actions) :
- `DATABASE_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`
- `ENCRYPTION_KEY`

## 2. Release Gate (Local)

Avant de soumettre une PR, il est recommandé de lancer la "Release Gate" locale pour détecter les erreurs en amont.

```bash
npm run release:gate
```

Ce script exécute la même séquence que la CI : Lint -> Typecheck -> Build -> E2E Tests.
*Note : Pour que les tests E2E passent localement, vous devez avoir un fichier `.env` valide avec les accès base de données.*

## 3. Auto-merge

Pour faciliter le travail des mainteneurs, l'auto-merge est disponible.

### Comment l'utiliser ?
1.  Ouvrez votre PR.
2.  Si vous êtes confiant, ajoutez le label **`automerge`** à la PR.
3.  Une GitHub Action s'activera pour demander le merge automatique (`Enable Auto-merge`).
4.  Une fois que tous les checks (CI) sont verts, GitHub mergera automatiquement la PR en mode **Squash**.

### Configuration Requise (Admin)
Dans les paramètres du dépôt GitHub :
1.  General -> Allow auto-merge : **Enabled**.
2.  Branch Protection Rules (`main`) :
    - Require status checks to pass before merging : **Enabled**.
    - Sélectionner `validate` (le job CI) comme check requis.

## 4. Résolution de problèmes

- **Tests E2E échouent en CI ?**
    - Téléchargez l'artefact `playwright-report` depuis l'onglet Actions de GitHub pour voir les screenshots et traces des erreurs.
- **Auto-merge ne fonctionne pas ?**
    - Vérifiez que le label est bien `automerge`.
    - Vérifiez que vous avez les droits d'écriture sur le repo.
