# Release Checklist

Ce document définit les étapes obligatoires avant tout merge ou déploiement en production.

## 1. Pré-Merge (CI/CD Automatique)

Ces vérifications sont effectuées par le workflow GitHub Actions (`.github/workflows/ci.yml`).
Si une étape échoue, le merge est interdit.

- [ ] **Linting** : `npm run lint` doit passer sans erreur.
- [ ] **Build** : `npm run build` doit réussir.
- [ ] **Tests Unitaires** : `npm run test` doit passer.
- [ ] **Tests E2E** : Les tests critiques (`booking.spec.js`, `public-core.spec.js`) doivent passer.

## 2. Vérifications Manuelles (Code Review)

- [ ] **Routes & Navigation** :
    - Vérifier qu'aucune nouvelle route n'est "orpheline".
    - Vérifier la cohérence des URLs (kebab-case).
- **API & Sécurité** :
    - Vérifier que les nouveaux endpoints sont documentés dans `docs/ROUTES_API.md`.
    - Vérifier les permissions (Admin/Pro Guards).
- **Hygiène** :
    - Pas de `console.log` de debug oubliés.
    - Pas de fichiers temporaires committés.

## 3. Post-Déploiement (Production)

- [ ] **Smoke Test** : Naviguer sur les pages principales (Accueil, Aides, Annuaire).
- [ ] **Parcours Critique** : Tenter une recherche et vérifier l'affichage d'une fiche.
- [ ] **Monitoring** : Vérifier l'absence de pics d'erreurs sur Sentry/Vercel.
