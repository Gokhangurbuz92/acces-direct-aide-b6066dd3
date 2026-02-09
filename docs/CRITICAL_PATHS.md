# Critical User Paths - Verification

## Overview

This document lists all critical user paths that must work correctly in production. These paths are covered by smoke tests and e2e tests.

## Public Paths

### 1. Home Page
- **Path:** `/`
- **Expected:** Page loads without errors, main content visible
- **Test:** `e2e/smoke-home.spec.js`, `e2e/smoke-critical.spec.js`
- **Status:** ✅ Covered

### 2. Aides Flow
- **Path:** `/aides` → `/aides/:slug`
- **Flow:**
  1. Navigate to `/aides`
  2. Click on an aide card
  3. View aide detail page
  4. Refresh page (direct access test)
  5. Navigate back to list
- **Test:** `e2e/smoke-public.spec.js`
- **Status:** ✅ Covered

### 3. Démarches Flow
- **Path:** `/demarches` → `/demarches/:slug`
- **Flow:**
  1. Navigate to `/demarches`
  2. Click on a démarche card
  3. View démarche detail page
  4. Refresh page (direct access test)
  5. Navigate back to list
- **Test:** `e2e/smoke-public.spec.js`
- **Status:** ✅ Covered

### 4. Structures Flow
- **Path:** `/structures` → `/structures/:slug`
- **Flow:**
  1. Navigate to `/structures`
  2. Click on a structure card
  3. View structure detail page
  4. Refresh page (direct access test)
  5. Navigate back to list
- **Test:** `e2e/smoke-public.spec.js`
- **Status:** ✅ Covered

### 5. 404 Handling
- **Path:** `/invalid-route-12345`
- **Expected:** 404 page shown, no runtime errors
- **Test:** `e2e/smoke-critical.spec.js`
- **Status:** ✅ Covered

### 6. SPA Routing (Direct Access)
- **Paths:** All public routes
- **Expected:** Direct URL access works (not 404)
- **Mechanism:** Vercel rewrites in `vercel.ts`
- **Test:** `e2e/smoke-critical.spec.js`, `e2e/smoke-spa-routing.spec.js`
- **Status:** ✅ Covered

## Pro Paths

### 7. Pro Login
- **Path:** `/pro/login`
- **Expected:** Login form, authentication works
- **Test:** `e2e/booking.spec.js` (partial)
- **Status:** ⚠️ Partial coverage

### 8. Pro Dashboard
- **Path:** `/pro/dashboard`
- **Expected:** Dashboard loads, shows structure info
- **Test:** Manual testing required
- **Status:** ⚠️ Manual only

## Admin Paths

### 9. Admin Login
- **Path:** `/admin/login`
- **Expected:** Login form, authentication works
- **Test:** `e2e/admin-smoke.spec.js`
- **Status:** ✅ Covered

### 10. Admin Dashboard
- **Path:** `/admin`
- **Expected:** Dashboard loads, shows stats
- **Test:** `e2e/admin-smoke.spec.js`
- **Status:** ✅ Covered

## API Paths

### 11. Health Check
- **Path:** `/api/health`
- **Expected:** Returns 200 with status, db, kv checks
- **Test:** Integration tests
- **Status:** ✅ Covered

### 12. Sitemap
- **Path:** `/sitemap.xml`
- **Expected:** Valid XML, includes all published content
- **Test:** `tests/sitemap.test.js`
- **Status:** ✅ Covered

### 13. Robots
- **Path:** `/robots.txt`
- **Expected:** Correct rules based on environment
- **Test:** `scripts/verify-robots.js`
- **Status:** ✅ Covered

## Booking Flow (Critical)

### 14. Appointment Booking
- **Flow:**
  1. View structure detail
  2. Select service
  3. Choose time slot
  4. Fill beneficiary info
  5. Confirm booking
  6. Receive confirmation
- **Test:** `e2e/booking.spec.js`
- **Status:** ✅ Covered

## Verification Commands

### Run All Smoke Tests
```bash
npx playwright test e2e/smoke-critical.spec.js e2e/smoke-home.spec.js e2e/smoke-public.spec.js e2e/smoke-spa-routing.spec.js
```

### Run Critical Path Tests
```bash
npm test
npm run build
npx playwright test
```

### Verify Routing
```bash
node scripts/verify-lot9a-routes.js
```

### Verify SEO
```bash
node scripts/verify-sitemap.js
node scripts/verify-robots.js
```

## Common Issues

### Issue: 404 on Direct Access
- **Cause:** Missing rewrite rule in `vercel.ts`
- **Fix:** Add route to rewrites: `{ source: "/your-route", destination: "/index.html" }`

### Issue: Blank Page on Refresh
- **Cause:** React Router not handling route
- **Fix:** Add route to React Router configuration

### Issue: Broken Links
- **Cause:** Incorrect slug or missing content
- **Fix:** Verify slug exists in database, check link construction

## Monitoring

### Production Checks
- Monitor 404 rate (should be < 5%)
- Monitor page load time (should be < 3s)
- Monitor error rate (should be < 0.1%)
- Check Sentry for runtime errors

### Weekly Verification
- Run smoke tests against production
- Verify sitemap is up-to-date
- Check robots.txt is correct
- Test critical flows manually

## Rollback Criteria

Rollback immediately if:
- Home page returns 500 or blank screen
- Any critical path (aides, démarches, structures) is broken
- 404 rate > 20%
- Error rate > 5%
- Database connectivity lost

## Next Steps

- [ ] Add e2e tests for Pro dashboard
- [ ] Add e2e tests for search functionality
- [ ] Add performance monitoring
- [ ] Add uptime monitoring
- [ ] Set up alerting for critical paths
