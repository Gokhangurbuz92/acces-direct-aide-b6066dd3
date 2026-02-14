# P1 Search UI + Aides MVP

## Utilisation

- Ouvrir `/recherche`.
- Saisir une requête (minimum 2 caractères), choisir une catégorie optionnelle, puis cliquer sur `Rechercher`.
- Les paramètres sont persistés dans l'URL: `?q=...&cat=...&limit=...`.
- États gérés:
  - `idle`: exemples de requêtes.
  - `loading`: skeleton.
  - `success`: liste de résultats.
  - `empty`: aucun résultat.
  - `error`: message lisible + bouton retry.

## Test local rapide

1. Charger l'environnement:
   - `set -a; source .env.local; set +a`
2. Vérifier l'env:
   - `npm run doctor`
3. Démarrer le serveur:
   - Recommandé (stable, inclut `/api/*` via middleware Vite): `npm run dev -- --port 3000 --host 127.0.0.1`
   - Optionnel (Vercel CLI, nécessite un `vercel link` préalable): `vercel dev --listen 3000`
4. Vérifier l'API:
   - `curl -X POST http://localhost:3000/api/search -H "Content-Type: application/json" --data '{"query":"loyer étudiant Strasbourg","category":"LOGEMENT","limit":5}'`
5. Lancer les tests:
   - `npm run test -- tests/unit/searchClient.test.js`
   - `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npx playwright test e2e/aides-search-mvp.spec.js`
