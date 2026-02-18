# SEO Plumbing (P7-A)

## Objectif

Fournir des endpoints SEO stables en racine:
- `/robots.txt`
- `/sitemap.xml`

## Robots (root)

- Fichier statique: `public/robots.txt`
- Règles minimales:
  - `User-agent: *`
  - `Allow: /`
  - `Sitemap: https://www.accesdirectaide.fr/sitemap.xml`

Le root `/robots.txt` est servi par Vite/static hosting (pas par API).

## Sitemap (root dynamique)

Le sitemap est généré côté API par `api/_handlers/sitemap.js`.

### Routage

- Endpoint API: `/api/sitemap.xml`
- Exposition root via `vercel.json`:
  - `"/sitemap.xml" -> "/api/sitemap.xml"`

### Contenu

Le XML inclut:
- Pages publiques statiques: `/`, `/aides`, `/demarches`, `/annuaire`, `/actualites`
- Pages dynamiques d'aides: `/aides/:slug` (aides publiées)

### Statuts HTTP

- `200`: sitemap généré
- `503`: indisponibilité DB (réponse XML minimale, sans détail interne)
- `405`: méthode non supportée

### Headers

- `Content-Type: application/xml; charset=utf-8`
- `Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=60`
- `x-request-id` sur la réponse

## Notes sécurité

- Aucun secret n'est inclus dans le sitemap/robots.
- En cas d'erreur DB, aucune stacktrace n'est renvoyée au client.
