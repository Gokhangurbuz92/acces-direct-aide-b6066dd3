# Known Issues

## Tests exclus du CI

Les tests suivants sont exclus de la suite Vitest principale :

- `tests/components/**` — utilisent `@testing-library` avec environment jsdom per-file
- `e2e/**` — tests Playwright E2E
- `tests/a11y/**` — tests Playwright accessibilité

```bash
npx playwright test             # E2E (48 fichiers)
npx playwright test tests/a11y  # Accessibilité (3 fichiers)
```

## TODOs dans le code

| Fichier | Ligne | Description |
|---------|-------|-------------|
| `src/pages/CompteParametres.jsx` | 457 | `TODO: Implement account deletion API` |

## Limitations connues

- **Backup script** (`scripts/backup-db.js`) vérifie les counts mais ne fait pas de dump complet. Neon PITR est le vrai backup.
- **Métriques IA** en mémoire sont perdues au redéploiement (la table `AiMetric` en DB compense).
- **Agents IA** nécessitent `ENABLE_AI_AGENT=true` en variable d'environnement.
- **Rate limiting** utilise un backend mémoire en test, Upstash KV en production.

## Score du projet

- **Tests** : 737 passent, 0 exclusions unitaires
- **Build** : ✅ OK
- **Lint** : ✅ 0 erreurs
- **Prod** : ✅ healthy
- **Monitors** : 6/6 vert
- **Security headers** : 6/6 présents
- **Dernière vérification** : 2026-03-24
