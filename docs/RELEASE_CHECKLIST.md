# Checklist de Mise en Production (Release Gate)

Ce document liste les étapes obligatoires avant tout merge vers `main` ou déploiement en production.

## 1. Validation Automatique (CI)
La CI GitHub Actions doit être au vert (✅).
- [ ] Job `quality` : Lint OK, Imports API OK.
- [ ] Job `build` : Build Vite/Vercel OK.
- [ ] Job `e2e` : Tests Playwright passants (notamment `booking.spec.js` et `public-core.spec.js`).

## 2. Vérifications Manuelles (Smoke Tests)
Sur l'environnement de Preview (Vercel) :
- [ ] **Parcours Public** :
    - [ ] Accéder à `/aides`, ouvrir une fiche, vérifier le contenu.
    - [ ] Accéder à `/annuaire`, ouvrir une structure.
    - [ ] Accéder à `/demarches`, ouvrir une fiche.
- [ ] **Parcours RDV** :
    - [ ] Simuler une prise de RDV (si possible en preview avec mocks).
    - [ ] Vérifier l'absence d'erreur 500 au chargement des créneaux.
- [ ] **Admin** :
    - [ ] Se connecter `/admin/login`.
    - [ ] Vérifier que `/admin/aides` charge la liste.

## 3. Sécurité & Données
- [ ] **Secrets** : Aucune nouvelle variable d'environnement manquante en Prod.
- [ ] **Migrations** : Si changement de schéma Prisma, vérifier que la migration est sûre (non destructive).

## 4. Documentation
- [ ] Si nouvelle feature : mise à jour de `docs/ROUTES_FRONT.md` ou `docs/ROUTES_API.md`.
- [ ] Si changement infra : mise à jour de `docs/INFRASTRUCTURE.md`.

## 5. Validation Finale
- [ ] Label `SAFE TO MERGE: YES` appliqué sur la PR.
- [ ] Description de la PR complète (What/Why/How).
