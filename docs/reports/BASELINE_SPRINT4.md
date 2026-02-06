# SPRINT 4 - BASELINE REPORT

**Date**: 2026-02-04
**Commit**: `deb87bc` (chore(ci): add checklist for FalcSummary, deps & deployments)
**Branch**: `sprint4-ux-aides-demarches-annuaire-actualites`

## Git State
```
✅ Branch: sprint4-ux-aides-demarches-annuaire-actualites
✅ Commit: deb87bc
✅ Working tree: CLEAN
```

## Baseline Quality Checks

### 1. Dependencies
```
npm ci: ✅ SUCCESS
- 982 packages installed
- 4 vulnerabilities (2 low, 2 high) - NOT BLOCKING
```

### 2. Tests
```
npm test: ✅ SUCCESS
- Test Files: 24 passed (24)
- Tests: 92 passed (92)
- Duration: 2.91s
```

### 3. Build
```
npm run build: ✅ SUCCESS
- Build time: 7.35s
- ⚠️ WARNING: vendor chunk > 500 kB
```

## Bundle Sizes (BEFORE)

### Critical Issue
```
⚠️ vendor-N4WwJjNR.js: 893.55 kB (288.09 kB gzip)
```

### Other Significant Chunks
```
index-Bjer7Dm5.js:     49.62 kB (14.56 kB gzip)
fr-DjG-WH0P.js:        26.18 kB (7.28 kB gzip)
select-C3uZ1mwN.js:    25.43 kB (8.52 kB gzip)
index-4ivJuXgA.js:     19.03 kB (4.47 kB gzip)
Home-CeLVkf6J.js:      12.78 kB (3.70 kB gzip)
```

### CSS
```
index-M4e8TB82.css:    94.92 kB (15.27 kB gzip)
```

## Priority Issues

### P0 - CRITICAL
1. **Vendor bundle too large** (893.55 kB)
   - Target: Split into react-vendor, ui-vendor, utils-vendor
   - Goal: Each chunk < 500 kB

### P0 - UX
2. **List pages need improvements**
   - Loading states
   - Empty states
   - Pagination robustness
   - Filter URL sync

### P0 - SEO
3. **Meta tags + Breadcrumbs + JSON-LD**
   - Ensure all list pages have proper SEO
   - Add breadcrumbs
   - Add JSON-LD structured data

### P0 - Observability
4. **ErrorBoundary missing**
   - Add global ErrorBoundary
   - Sentry integration

### P1 - Data Quality
5. **FALC documentation**
   - Document field priority
   - Add non-regression tests

## Next Steps
1. Implement lazy-loading for routes
2. Configure manualChunks in vite.config
3. Add UX improvements to list pages
4. Add SEO enhancements
5. Add ErrorBoundary
6. Document FALC fields
