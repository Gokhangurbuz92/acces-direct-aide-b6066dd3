# LOT 9 SIGNOFF - Go-Live Checklist

This document tracks the progress and successful completion of Lot 9 sub-lots.

## SOUS-LOT 9A — ZÉRO BASE44 (CLEANUP TOTAL + RÉGRESSION ROUTES)
**Status: DONE**

### Verification results:
- [x] Zéro dependency check `@base44/sdk`: `grep` count = 0 ✅
- [x] Zéro `base44.app` references: `grep` count = 0 ✅
- [x] build status: `npm run build` ✅
- [x] Regression routes: `node scripts/verify-lot9a-routes.js` ✅
- [x] Empty states: FALC "Aucun résultat" confirmed in Aides/Demarches/Annuaire ✅

### Logs:
```bash
# Grep check result for @base44/sdk
(0 results)

# Grep check result for base44.app
(0 results)

# Vite Build
vite v6.4.1 building for production...
✓ built in 3.85s

# verify-lot9a-routes.js
✅ /: 200 OK
✅ /aides: 200 OK
✅ /demarches: 200 OK
✅ /annuaire: 200 OK
...
Verification finished with 0 critical failures.
```

---

## SOUS-LOT 9B — SEO “PROPRE” (.FR) (ROBOTS + SITEMAP + CANONICAL + NOINDEX)
**Status: DONE**

### Verification results:
- [x] robots.txt dynamic API ✅
- [x] sitemap.xml dynamic API (Aides, Démarches, Structures, Guides, Tools, Actualités) ✅
- [x] Canonical link in all public pages (dynamic SITE_URL) ✅
- [x] NoIndex guard in `/admin` and `/pro` (Helmet + robots.txt) ✅
- [x] build status: `npm run build` ✅
- [x] sitemap verification: `node scripts/verify-sitemap.js` (logic tested) ✅
- [x] noindex verification: `node scripts/verify-admin-noindex.js` ✅

### Extracts:

**robots.txt**
```text
User-agent: *
Disallow: /admin
Disallow: /pro
Disallow: /__dev
Disallow: /api/admin

Sitemap: https://accesdirectaide.fr/sitemap.xml
```

**sitemap.xml (extract)**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://accesdirectaide.fr/</loc><priority>1.0</priority></url>
  <url><loc>https://accesdirectaide.fr/aides</loc><priority>0.9</priority></url>
  <url><loc>https://accesdirectaide.fr/demarches</loc><priority>0.9</priority></url>
  <url><loc>https://accesdirectaide.fr/annuaire</loc><priority>0.9</priority></url>
  <url><loc>https://accesdirectaide.fr/bonnes-pratiques</loc><priority>0.8</priority></url>
  ...
</urlset>
```

### Script Output:
```text
Starting Lot 9B Verification...
Checking Admin/Pro NoIndex guards...
✅ ADMIN/PRO NOINDEX CHECK PASSED
Testing Sitemap logic (req DB)...
Sitemap status: 200
✅ Sitemap Logic OK
```

---
