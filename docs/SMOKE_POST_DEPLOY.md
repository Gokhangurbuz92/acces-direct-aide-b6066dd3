# Post-Deployment Smoke Test Checklist

> Run these checks after merging `audit/remediation-all` → `main` and Vercel deploys.

## 1. Security Headers ✅

```bash
curl -sS -D- -o /dev/null https://www.accesdirectaide.fr/ | \
  egrep -i 'content-security-policy|strict-transport-security|x-frame-options|x-content-type-options|referrer-policy|permissions-policy'
```

**Expected**: All 6 headers present. CSP includes `fonts.googleapis.com` in `style-src` and `fonts.gstatic.com` in `font-src`.

## 2. Robots & Sitemap ✅

```bash
curl -sS https://www.accesdirectaide.fr/robots.txt | head -10
curl -sS https://www.accesdirectaide.fr/sitemap.xml | grep -c "<loc>"
```

**Expected**: `robots.txt` present with `Sitemap:` directive. Sitemap has >40 `<loc>` entries (static + aides + démarches + structures).

## 3. Aides API ✅

```bash
curl -sS "https://www.accesdirectaide.fr/api/aides?page=1&limit=5" | \
  node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); \
  console.log('items=',d.items?.length,'total=',d.pagination?.total,'page=',d.pagination?.page);"
```

**Expected**: `items=5`, `total >= 3000`, `page=1`

## 4. Démarches API ✅

```bash
curl -sS "https://www.accesdirectaide.fr/api/demarches?page=1&limit=5" | \
  node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); \
  console.log('items=',d.items?.length,'total=',d.pagination?.total,'page=',d.pagination?.page);"
```

**Expected**: `items=5`, `total >= 3000` (if Service-Public dataset available; otherwise >= 12 curated fallback)

## 5. Démarches Provenance ✅

```bash
curl -sS "https://www.accesdirectaide.fr/api/demarches?page=1&limit=50" | \
  node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); \
  const it=d.items||[]; const bad=it.filter(x=>!x.source_url&&!x.lien_officiel).length; \
  console.log('sample=',it.length,'missing_source=',bad);"
```

**Expected**: `missing_source=0` (all démarches have provenance)

## 6. Structures Descriptions ✅

```bash
curl -sS "https://www.accesdirectaide.fr/api/structures?page=1&limit=50" | \
  node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); \
  const it=d.items||[]; const weak=it.filter(x=>!x.description_courte||String(x.description_courte).trim().length<20).length; \
  console.log('sample=',it.length,'weak_desc=',weak,'coverage_pct=',Math.round((1-weak/Math.max(it.length,1))*100));"
```

**Expected**: `coverage_pct >= 95`

## 7. DREES No Duplicates ✅

```bash
curl -sS "https://www.accesdirectaide.fr/api/drees?page=1&limit=50" | \
  node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); \
  const slugs=d.items.map(i=>i.slug); const dupes=slugs.filter((s,i)=>slugs.indexOf(s)!==i); \
  console.log('total=',d.items.length,'dupes=',dupes.length);"
```

**Expected**: `dupes=0`

## 8. Diagnostic Endpoint ✅

```bash
curl -sS -X POST "https://www.accesdirectaide.fr/api/diagnostic" \
  -H "content-type: application/json" -d '{}' -o /dev/null -w "%{http_code}"
```

**Expected**: `400` (empty payload = validation error) or `503` (OpenFisca down) — **never `500`**

## 9. UI Visual Check ✅

1. Open https://www.accesdirectaide.fr/aides in Chrome desktop (≥1280px)
2. Verify: search bar sits below header, no overlap, badges stay within cards
3. Open Chrome DevTools → Console → verify **no CSP errors**
4. Set viewport to 375px mobile → verify no horizontal scroll, no overlap

## 10. CI ✅

1. Check GitHub Actions: all quality + e2e jobs passing
2. Verify Playwright container version matches `v1.58.0-jammy`
3. Verify `npm test` step runs and passes (unit tests)

---

## Non-Verifiable Items

| Item | Procedure |
|------|-----------|
| Sentry alerts | Check Sentry dashboard → Issues → last 24h |
| Vercel cron runs | Check Vercel → Functions → Cron → last executions |
| AidesTerritoires API uptime | Monitor `/api/aides` total count over 48h |
| Service-Public dataset | Monitor `/api/demarches` total count after first cron run |
