# SEO Guide (P7-A -> P7-E)

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
- Le canonical est construit au runtime depuis l’origin + path, avec règle durcie:
  - `VERCEL_ENV=production` => origin forcée à `https://www.accesdirectaide.fr`
  - preview/dev => origin dérivée du host runtime
- Résultat:
  - Preview garde ses URLs de déploiement.
  - Production reste strictement sur le domaine canonique `www`.
  - URLs absolues stables pour OG/Twitter (`og:url = canonical`).

### JSON-LD minimal
- Home `/`: `WebSite` + `Organization`.
- Listing `/aides`: `BreadcrumbList` + `ItemList`.
- Détail `/aides/:slug`: `BreadcrumbList` + `WebPage(mainEntity=GovernmentService)`.
- Les champs optionnels non disponibles sont omis (pas de données inventées).

### Navigation sémantique
- Les entrées de navigation publique et les cartes d’aides utilisent des liens `<a>` via `Link/NavLink`.
- Pas de navigation principale basée uniquement sur des `onClick`.

## P7-C — Canonicalization & Redirects

### Host canonical (prod uniquement)
- Configuration dans `vercel.json` via `redirects` + condition `has.host`.
- Règle:
  - `accesdirectaide.fr/:path*` -> `https://www.accesdirectaide.fr/:path*`
  - `permanent: true`
- Effet attendu:
  - Production: apex redirige vers `www`.
  - Preview/Dev: pas de redirection globale forcée (hosts Vercel preview inchangés).

### Politique trailing slash
- Normalisation globale:
  - `/(.+)/` -> `/$1` (`permanent: true`)
- But:
  - Éviter le duplicate content entre `/aides` et `/aides/`.
  - Préserver `/` (homepage).

### Redirects legacy conservés
- Exemples maintenus:
  - `/aide/:slug` -> `/aides/:slug`
  - `/structures` -> `/annuaire`
- Principe:
  - Ajouter uniquement les chemins legacy confirmés par le routeur/docs/tests.

### Vérification locale (config)
- Vérifier la présence des règles:
  - `cat vercel.json`
  - `npm test -- tests/integration/p7c-redirects-config.test.js`

### Vérification prod (post-deploy)
```bash
curl -I "https://accesdirectaide.fr/aides?x=1"
curl -I "https://www.accesdirectaide.fr/aides/"
```
Attendu:
- première commande: redirection permanente vers `https://www.accesdirectaide.fr/aides?x=1`
- seconde commande: redirection permanente vers `https://www.accesdirectaide.fr/aides`

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

## P7-D — Indexability policy (admin + endpoints techniques)

### Règle globale
- Les pages publiques restent indexables.
- Les surfaces techniques et d’administration sont explicitement noindex.

### Différence entre les mécanismes
- `robots.txt`:
  - Directive de crawl pour les bots.
  - N’est pas un mécanisme de sécurité.
- `X-Robots-Tag: noindex, nofollow`:
  - En-tête HTTP côté API pour empêcher l’indexation d’endpoints techniques.
  - S’applique même quand la réponse est en erreur (`401/403/500`).
- `<meta name="robots" content="noindex, nofollow">`:
  - Contrôle d’indexation côté pages HTML (SPA), utilisé pour `/admin` et sous-routes.

### Cibles indexables (inventaire actuel)
- `/`
- `/aides`
- `/aides/:slug`
- `/demarches`
- `/demarches/:slug`
- `/annuaire`
- `/structures/:slug`
- `/actualites`
- `/actualites/:slug`
- `/robots.txt`
- `/sitemap.xml`

### Cibles non-indexables (inventaire actuel)
- `/admin`
- `/admin/*`
- `/api/health`
- `/api/health/deep`
- `/api/healthz`
- `/api/monitor/*`
- `/api/cron/*`
- `/api/admin/*`

### robots.txt policy
- Fichier: `public/robots.txt`
- Directives:
  - `User-agent: *`
  - `Allow: /`
  - `Disallow: /admin`
  - `Disallow: /api/`
  - `Sitemap: https://www.accesdirectaide.fr/sitemap.xml`

### Vérification rapide
```bash
curl -s https://www.accesdirectaide.fr/robots.txt
curl -I https://www.accesdirectaide.fr/api/health | rg -i "x-robots-tag"
curl -I https://www.accesdirectaide.fr/api/monitor/cron/actualites | rg -i "x-robots-tag"
```

Playwright:
```bash
npx playwright test e2e/noindex-admin.spec.js
```

## P7-E — Search Console readiness

### Canonical origin backend (sitemap)
- Source of truth backend: `api/_utils/site-origin.js`
- Règle:
  - `VERCEL_ENV=production` => sitemap force `https://www.accesdirectaide.fr`
  - preview/dev => sitemap utilise `x-forwarded-proto` + `x-forwarded-host|host`

### Meta verification optionnelle (sans token en code)
Le composant `src/components/SEO.jsx` supporte optionnellement:
- `VITE_GOOGLE_SITE_VERIFICATION` -> `<meta name="google-site-verification" ...>`
- `VITE_BING_SITE_VERIFICATION` -> `<meta name="msvalidate.01" ...>`

Si ces variables ne sont pas définies, aucune meta de vérification n’est injectée.

### Search Console (checklist rapide)
1. Ajouter le domaine/propriété dans l’outil webmaster.
2. Définir le token côté env (variable `VITE_*` correspondante).
3. Déployer.
4. Vérifier la présence de la meta sur `/`.
5. Soumettre le sitemap: `https://www.accesdirectaide.fr/sitemap.xml`.

### Smoke SEO manuel
Commande runbook:
```bash
npm run smoke:seo:prod
```

Variables supportées (optionnelles):
- `PROD_URL` (default: `https://www.accesdirectaide.fr`)
- `APEX_URL` (default: `https://accesdirectaide.fr`)
