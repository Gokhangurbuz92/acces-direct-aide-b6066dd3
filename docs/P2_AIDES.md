# P2 Aides (Listing + Détail + SEO)

## Objectif

Livrer une expérience publique stable pour :

- `/aides` : listing avec recherche + filtres + pagination
- `/aides/:slug` : fiche détail

Sans casser les modules existants (search hybride, auth, admin, demarches, annuaire, actualites).

## Routes

- Front:
  - `/aides` (listing)
  - `/aides/:slug` (détail)
  - `/recherche` (recherche intelligente, héritage P1)
- API:
  - `GET /api/aides` (listing, filtres, pagination)
  - `GET /api/aides/:slug` (détail)

## SEO

- Listing `/aides`:
  - `<title>` + meta description + canonical (prod only via `SEO`)
  - JSON-LD BreadcrumbList: Accueil > Aides
- Détail `/aides/:slug`:
  - `<title>` + meta description + canonical (prod only via `SEO`)
  - JSON-LD BreadcrumbList: Accueil > Aides > {Titre}
  - JSON-LD WebPage avec `mainEntity` minimal (GovernmentService quand possible, sans inventer de provider)

## Tests (DoD)

- API:
  - `tests/integration/p2-aides-api.test.js` (skip si `DATABASE_URL` absent)
- E2E:
  - Listing `/aides` et navigation vers une fiche (mocks Playwright)
  - Recherche P1 déplacée sur `/recherche`

## Checklist PR (DoD)

- [ ] `/aides` listing fonctionnel (filtres + pagination + états UI)
- [ ] `/aides/:slug` fiche complète + 404 propre
- [ ] SEO title/meta/canonical + JSON-LD (breadcrumb + mainEntity)
- [ ] Tests `npm test` OK (avec env si DB tests activés)
- [ ] `npm run lint` OK
- [ ] `npm run typecheck` OK
- [ ] Docs routes à jour

