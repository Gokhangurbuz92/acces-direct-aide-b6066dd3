# P5 Actualites

Objectif: fournir un feed public d'actualites + une page detail, alimentees par ingestion RSS/Atom, avec SEO + JSON-LD.

## Routes Front

- `/actualites`: listing (recherche + filtres + pagination)
- `/actualites/:slug`: detail
- `/actualites/view?id=...`: compat legacy (redirection canonique vers `/actualites/:slug` si possible)

## API

### `GET /api/actualites`

Query params (optionnels):
- `q`: recherche textuelle (titre/resume/contenu)
- `categorie`: categorie (ex: `famille`, `general`)
- `source`: filtre par source (match "contains" sur `source_name/source_nom`)
- `sort`: `recent` (defaut), `date_publication`, `-date_publication`, `updated_date`, `-updated_date`, `quality`, `-quality`, `relevance`
- `page`: defaut 1
- `limit`: defaut 10, max 50

Response:
```json
{
  "items": [],
  "pagination": { "page": 1, "limit": 10, "total": 0, "totalPages": 0, "hasNext": false }
}
```

Resilience: en cas d'erreur DB, l'endpoint renvoie `200` avec `items: []` + pagination vide (pour eviter un crash public).

### `GET /api/actualites/:slug`

- Retourne l'actualite complete (ou `404` si inconnue ou non publiee en public).

Compatibilite: `GET /api/actualites?slug=...` et `GET /api/actualites?id=...` restent supportes.

## Ingestion RSS/Atom

### Manifest sources

- `data/news-sources.json` (prefere)
- fallback legacy: `config/rss-sources.json`

Chaque source peut etre `enabled: true/false`. Les sources sont seedees/upsert dans `RssSource` (table admin).

### Script local

Commande:
- `node scripts/ingest-actualites.js --limit 10`

Le script ingere les items RSS/Atom des sources `enabled` vers la table `Actualite` avec deduplication par URL canonique.

### Cron

- Recommande: `GET /api/cron/actualites`
- Legacy/manual: `GET /api/cron/pipeline?source=actualites` (alias -> `rss`)
- La branche RSS utilise la meme logique d'ingestion que le script local.

## SEO + JSON-LD

- Listing `/actualites`: `BreadcrumbList` (Accueil > Actualites)
- Detail `/actualites/:slug`: `BreadcrumbList` + `NewsArticle`
  - `author` est une `Organization` si `source_name/source_nom` est present
  - pas d'invention d'auteur humain ou d'image

## Tests

- Unit: ingestion RSS (`api/_handlers/cron/ingest-actualites-rss.test.js`)
- Integration (mock): `tests/integration/actualites.test.js`
- Integration (DB-backed, seed): `tests/integration/p5-actualites-api.test.js`
- E2E: `e2e/public-core.spec.js` (flow listing -> detail)
