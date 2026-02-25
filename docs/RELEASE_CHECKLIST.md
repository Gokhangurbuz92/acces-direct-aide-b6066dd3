# Release Checklist

Ce document définit les étapes obligatoires avant tout merge ou déploiement en production.

## 1. Pré-Requis Automatiques (CI)

Ces étapes doivent être validées par le workflow GitHub Actions :

- [ ] **Lint & Typecheck** : `npm run lint` et `npm run typecheck` doivent passer sans erreur.
- [ ] **Build** : `npm run build` doit réussir.
- [ ] **Tests E2E** : Les parcours critiques (`public-core.spec.js`) doivent être verts.

## 2. Vérifications Manuelles (Code Review)

- [ ] **Sécurité** : Pas de secrets committés ? (Vérifier `.env.example` vs code).
- [ ] **Routes** : Si une nouvelle page est ajoutée, est-elle référencée dans `docs/ROUTES_FRONT.md` ?
- [ ] **API** : Si un endpoint est modifié, le contrat dans `docs/ROUTES_API.md` est-il à jour ?
- [ ] **Hygiène** : Pas de `console.log` de debug, pas de code mort commenté.

## 3. Validation Fonctionnelle (Staging/Preview)

Avant de merger sur `main` :

- [ ] **Navigation** : Cliquer sur les liens principaux (Aides, Démarches, Annuaire).
- [ ] **Détail** : Ouvrir une fiche aide/démarche au hasard, vérifier l'affichage.
- [ ] **Erreurs** : Vérifier la console du navigateur (F12) pour s'assurer qu'il n'y a pas d'erreurs rouges (React key warnings, 404 assets).
- [ ] **Mobile** : Vérifier rapidement l'affichage responsive (mode mobile du navigateur).

## 4. Déploiement & Post-Release

Après le merge :

- [ ] **Vercel** : Vérifier que le déploiement est "Ready".
- [ ] **Smoke Test Prod** : Lancer `scripts/smoke-prod.sh` (si disponible) ou vérifier manuellement la page d'accueil et une page de détail.
- [ ] **Sentry** : Surveiller l'apparition de nouvelles erreurs dans les 30 minutes suivant le déploiement.
