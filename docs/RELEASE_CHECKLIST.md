# Release Checklist

Ce document définit les étapes obligatoires pour valider une mise en production (Go-Live).

## 1. Pré-Release (Local)
- [ ] **Tests E2E Core** : `npx playwright test e2e/booking.spec.js e2e/public-core.spec.js` passe sans erreur.
- [ ] **Lint** : `npm run lint` est propre (0 erreurs).
- [ ] **Build** : `npm run build` génère le bundle sans erreur.
- [ ] **Routes** : Vérifier que les nouvelles routes sont documentées dans `docs/ROUTES_FRONT.md` et `docs/ROUTES_API.md`.

## 2. CI (Automatique)
- [ ] **Workflow GitHub** : Le job `build-and-test` est vert.
- [ ] **Secrets scan** : Le workflow `secrets-scan` est vert.
- [ ] **Dépendances** : Pas de vulnérabilité critique (`npm audit`).

## 3. Déploiement (Vercel)
- [ ] **Preview** : Vérifier l'URL de preview avant merge.
- [ ] **Variables d'environnement** : Vérifier que les secrets (DATABASE_URL, ADA_ENCRYPTION_KEY, etc.) sont bien configurés sur l'environnement cible.
- [ ] **Migrations DB** : Si changements de schéma, exécuter `prisma migrate deploy` post-déploiement (ou via script dédié).

## 4. Post-Release (Production)
- [ ] **Smoke Test** : Vérifier manuellement les parcours critiques (Accueil -> Recherche -> Détail -> RDV).
- [ ] **Logs** : Vérifier les logs Vercel pour détecter des erreurs 500 immédiates.
- [ ] **Sentry** : Vérifier l'absence de nouveaux problèmes majeurs.
- [ ] **Rollback Plan** : Si échec critique, re-déployer la version précédente via Vercel Dashboard (Instant Rollback).
