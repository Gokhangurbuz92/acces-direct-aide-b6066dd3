# Action Plan - AccesDirectAide

| Lot | Tâche | Priorité | Risque | Effort | Statut |
| :-- | :--- | :------- | :----- | :----- | :----- |
| **P0** | **Stabilisation Production** | **Critique** | **Moyen** | **Court** | **En cours** |
| P0-1 | Fix Vercel Bundling (Imports Statiques) | P0 | Haut | Fait | ✅ Validé (Local) |
| P0-2 | Standardisation `/login/pro` (Redirect 308) | P0 | Bas | Fait | ✅ Validé (Local) |
| P0-3 | **CRITICAL FIX**: `api/_handlers/structures.js` (Logic Error) | P0 | Haut | Court | ⚠️ À faire |
| P0-4 | **CRITICAL FIX**: `api/_handlers/pro/messages.js` (Missing Export) | P0 | Haut | Court | ⚠️ À faire |
| P0-5 | Repo Hygiene (Nettoyage artefacts) | P2 | Bas | Fait | ✅ Validé |
| **P1** | **Qualité & Release Gate** | **Haute** | **Bas** | **Moyen** | **À faire** |
| P1-1 | CI GitHub Actions (`verify-handler-imports`, Build, E2E) | P1 | Moyen | Moyen | À faire |
| P1-2 | Documentation Release Process & Rollback | P1 | Bas | Court | À faire |
| **P2** | **Fonctionnalités Produit** | **Moyenne** | **Moyen** | **Long** | **Backlog** |
| P2-1 | Search Robuste & Pagination | P2 | Moyen | Moyen | Backlog |
| P2-2 | Espace Pro: Login/Dashboard/Availability (MVP) | P2 | Haut | Long | Backlog |
| P2-3 | RGPD: Export/Delete Endpoints | P2 | Moyen | Moyen | Backlog |

---

## Reste à faire (Immédiat)
1. Correction des régressions bloquantes dans `structures.js` et `messages.js`.
2. Mise en place du workflow CI pour empêcher ces régressions de revenir.
3. Merge de la branche de fix.
