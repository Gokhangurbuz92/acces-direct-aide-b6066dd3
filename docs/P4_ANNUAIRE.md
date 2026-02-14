# P4 — Annuaire / Structures (Listing + Détail + SEO)

Objectif: livrer une expérience publique équivalente à P2 “Aides” / P3 “Démarches”, mais pour l'annuaire des structures.

## Routes Front

- `GET /annuaire`
  - Listing avec recherche + filtres + tri + pagination (query params).
- `GET /structures/:slug`
  - Fiche détail.
- `GET /structures/view?id=...`
  - Alias legacy (redirection canonique vers `/structures/:slug` si le slug existe).

## API

### `GET /api/structures`

Query params (optionnels sauf `page/limit`):
- `q`: recherche texte (full-text)
- `type`: filtre type (si renseigné)
- `city`: filtre ville (ILIKE)
- `zip`: filtre code postal (exact)
- `departement`: filtre département (exact)
  - alias: `territory`, `geo`
- `pmr`: `1|0|true|false` (filtre accessibilité PMR)
- `sort`: `quality|recent|alpha|relevance` (+ aliases legacy admin: `-updated_date`, etc.)
- `page`: page (default `1`)
- `limit`: items par page (default `12`, max `50`)
  - alias legacy: `pageSize`

Réponse:
```json
{
  "items": [{ "id": "...", "slug": "...", "nom": "...", "type_structure": "...", "ville": "...", "departement": "...", "description_courte": "...", "updatedAt": "...", "quality_score": 0 }],
  "pagination": { "total": 0, "page": 1, "limit": 12, "pageSize": 12, "totalPages": 1, "hasNext": false }
}
```

Notes:
- Payload listing volontairement “light”: la fiche détail récupère les champs longs / relations.

### `GET /api/structures/:slug`

Retourne la structure complète (incluant les champs utiles à la fiche, et `proServices` si présent).
Répond `404` si le slug est inconnu ou si la structure n'est pas `statut=actif`.

## SEO / JSON-LD

- Listing `/annuaire`:
  - `<title>` + meta description + OpenGraph via `src/components/SEO.jsx`
  - JSON-LD `BreadcrumbList`: Accueil > Annuaire
- Détail `/structures/:slug`:
  - `<title>` = `{Nom} – Annuaire`
  - JSON-LD:
    - `BreadcrumbList`: Accueil > Annuaire > {Nom}
    - `Organization` via `generateStructureSchema` (sans inventer `LocalBusiness` / `geo` si absent)

## Tests

- Vitest (intégration API DB-backed):
  - `tests/integration/p4-structures-api.test.js`
- Playwright (UI flow):
  - `e2e/public-core.spec.js` (flow Structures: listing -> detail -> refresh)

## DoD (P4)

- [ ] Listing `/annuaire` fonctionnel (recherche, filtres, tri, pagination, états loading/empty/error)
- [ ] Détail `/structures/:slug` fonctionnel + 404 propre
- [ ] API dédiée `GET /api/structures` + `GET /api/structures/:slug` (validation + perf)
- [ ] SEO + JSON-LD BreadcrumbList (listing + détail)
- [ ] mainEntity cohérent (Organization), sans invention
- [ ] Tests API + e2e passent
- [ ] `npm run lint`, `npm run typecheck`, strict baselines: aucune régression

