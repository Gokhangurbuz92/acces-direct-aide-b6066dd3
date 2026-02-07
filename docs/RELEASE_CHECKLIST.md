# Release Checklist

Ce document définit les étapes obligatoires avant toute mise en production (Release Gate).

## 1. Validation Automatique (CI)
Le workflow GitHub Actions doit être au vert (✅).
- `lint`: Pas d'erreurs de syntaxe ou style.
- `typecheck`: Pas d'erreurs TypeScript (si applicable).
- `build`: Le build Vite et l'API se compilent.
- `test`: Tests unitaires passants.
- `e2e`: Tests Playwright critiques (`booking.spec.js`, `public-core.spec.js`) passants.

## 2. Validation Manuelle (Review)
- [ ] La PR a un titre clair ("feat:", "fix:", "chore:").
- [ ] La description explique le "Pourquoi".
- [ ] Les dépendances (`package.json`) sont minimales et justifiées.
- [ ] Pas de secrets hardcodés (vérifier `.env.example`).
- [ ] Pas de fichiers de debug oubliés (`console.log` abusifs, fichiers temporaires).

## 3. Smoke Test (Pre-Prod / Preview)
Sur l'environnement de Preview Vercel :
- [ ] Page d'accueil charge sans erreur console.
- [ ] Navigation vers `/aides`, `/demarches`, `/structures` fonctionne.
- [ ] Une page de détail (ex: aide) s'affiche.
- [ ] Le formulaire de contact ou RDV s'affiche.

## 4. Rollback Plan
En cas de pépin critique :
1. Identifier la version précédente (commit SHA).
2. Via Vercel Dashboard : "Promote" l'ancien déploiement.
3. Revert la PR sur GitHub (`git revert`).
