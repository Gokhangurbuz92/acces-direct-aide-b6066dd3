# P3 — Démarches (Listing + Détail + SEO)

Objectif: livrer une expérience publique équivalente à P2 “Aides”, mais pour les démarches.

## Routes Front

- `GET /demarches`
  - Listing avec recherche + filtres + tri + pagination (query params).
- `GET /demarches/:slug`
  - Fiche détail.
- `GET /demarches/view?id=...`
  - Alias legacy (redirection canonique vers `/demarches/:slug` si le slug existe).

## API

### `GET /api/demarches`

Query params (optionnels sauf `page/limit`):
- `q`: recherche texte (full-text)
- `category`: filtre catégorie (slug ou code, ex: `logement` / `LOGEMENT`)
- `theme`: alias de `category`
- `situation`: slug de situation (`lifeSituation.slug`)
- `geo`: département (ex: `67`)
- `territoire`, `territory`: alias de `geo`
- `audience`: filtre sur `audiences[]` si renseigné
- `online`: `1|0|true|false` (filtre `lien_officiel` non vide)
- `sort`: `quality|recent|relevance` (+ aliases legacy)
- `page`: page (default `1`)
- `limit`: items par page (default `20`, max `50`)  
  (alias legacy: `pageSize`)

Réponse:
```json
{
  "items": [{ "id": "...", "slug": "...", "titre": "...", "description_courte": "...", "summary_falc": "...", "category": { "slug": "...", "label": "..." } }],
  "pagination": { "total": 0, "page": 1, "limit": 20, "pageSize": 20, "totalPages": 1, "hasNext": false }
}
```

Notes:
- Par défaut, seuls les contenus publiés sont retournés (`statut=publie`), sauf accès admin.
- Payload listing volontairement “light”: la fiche détail récupère les champs longs.

### `GET /api/demarches/:slug`

Retourne la démarche complète (incluant `category` + `situations`).
Répond `404` si le slug est inconnu ou si la démarche n’est pas publiée (hors admin).

## SEO / JSON-LD

- Listing `/demarches`:
  - `<title>` + meta description + OpenGraph via `src/components/SEO.jsx`
  - JSON-LD `BreadcrumbList`: Accueil > Démarches
- Détail `/demarches/:slug`:
  - `<title>` = `{Titre} – Démarches`
  - JSON-LD:
    - `BreadcrumbList`: Accueil > Démarches > {Titre}
    - `WebPage` (minimal et vrai)
    - `HowTo` **uniquement** si `etapes[]` est un tableau exploitable (sinon pas de HowTo)

## Tests

- Vitest (intégration API DB-backed):
  - `tests/integration/p3-demarches-api.test.js`
- Playwright (UI flow):
  - `e2e/public-core.spec.js` (flow Démarches: listing -> detail -> refresh)

## DoD (P3)

- [ ] Listing `/demarches` fonctionnel (recherche, filtres, tri, pagination, états loading/empty/error)
- [ ] Détail `/demarches/:slug` fonctionnel + 404 propre
- [ ] API dédiée `GET /api/demarches` + `GET /api/demarches/:slug` (validation + perf)
- [ ] SEO + JSON-LD BreadcrumbList (listing + détail)
- [ ] HowTo JSON-LD seulement si steps réelles
- [ ] Tests API + e2e passent
- [ ] `npm run lint`, `npm run typecheck`, strict baselines: aucune régression

