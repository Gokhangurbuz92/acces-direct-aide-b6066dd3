# SEO Guide (P7-A + P7-B)

## P7-A — SEO plumbing (root)

### Robots
- Fichier statique: `public/robots.txt`
- Exposé en racine: `/robots.txt`
- Contient:
  - `User-agent: *`
  - `Allow: /`
  - `Sitemap: https://www.accesdirectaide.fr/sitemap.xml`

### Sitemap dynamique
- Handler: `api/_handlers/sitemap.js`
- Endpoint API: `/api/sitemap.xml`
- Exposition racine via `vercel.json`:
  - `"/sitemap.xml" -> "/api/sitemap.xml"`

### Sitemap HTTP contract
- `200` en nominal
- `503` si DB indisponible (réponse minimale, sans stacktrace)
- `405` méthode non supportée
- Headers:
  - `Content-Type: application/xml; charset=utf-8`
  - `Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=60`

## P7-B — SEO runtime (pages publiques)

### Métadonnées standardisées
Le composant `src/components/SEO.jsx` applique sur les pages publiques:
- `<title>` suffixé `| Accès Direct Aide`
- `<meta name="description">`
- `<link rel="canonical">` absolu
- OpenGraph: `og:title`, `og:description`, `og:type`, `og:url`, `og:image`
- Twitter: `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`

### Canonical strategy
- Le canonical est construit au runtime depuis l’origin courant (`window.location.origin`) + le path de page.
- Résultat:
  - Compatible Preview/Prod (pas de hardcode d’un seul domaine).
  - URLs absolues stables pour OG/Twitter (`og:url = canonical`).

### JSON-LD minimal
- Home `/`: `WebSite` + `Organization`.
- Listing `/aides`: `BreadcrumbList` + `ItemList`.
- Détail `/aides/:slug`: `BreadcrumbList` + `WebPage(mainEntity=GovernmentService)`.
- Les champs optionnels non disponibles sont omis (pas de données inventées).

### Navigation sémantique
- Les entrées de navigation publique et les cartes d’aides utilisent des liens `<a>` via `Link/NavLink`.
- Pas de navigation principale basée uniquement sur des `onClick`.

## Tests SEO

### Playwright dédié
- Fichier: `e2e/seo-aides.spec.js`
- Les appels réseau `/api/aides`, `/api/taxonomy`, `/api/structures` sont mockés pour éviter toute dépendance DB.
- Vérifie:
  - title/description/canonical/OG/Twitter
  - présence JSON-LD
  - lien sémantique vers la fiche aide
  - breadcrumb sur la fiche détail

### Commandes utiles
- `npx playwright test e2e/public-core.spec.js`
- `npx playwright test e2e/seo-aides.spec.js`

## Notes sécurité
- Aucun secret n’est loggé dans les réponses HTML/meta/JSON-LD.
- Aucun secret dans les docs SEO.
