# fix: production white screen (chunk cycle) + smoke test

## 🚨 Root Cause

**Production white screen caused by circular chunk dependencies in Vite build.**

### Technical Analysis

The custom `manualChunks` configuration in `vite.config.js` created circular dependencies:

```
Circular chunk: vendor -> vendor-react -> vendor
Circular chunk: vendor -> vendor-react -> vendor-sentry -> vendor
```

**Impact:**
1. Circular dependencies disrupted module loading order in production
2. When `useMergeRef.js` (from `@radix-ui`) tried to access React's `useLayoutEffect`, React was `undefined`
3. Uncaught runtime error: `Cannot read properties of undefined (reading 'useLayoutEffect')` at `useMergeRef.js:4:65`
4. Error crashed the React application before any UI could render → **white screen**

**Evidence:**
- Console error in production: `Uncaught TypeError: Cannot read properties of undefined (reading 'useLayoutEffect')`
- Build warnings: Multiple "Circular chunk" warnings
- No React version conflicts: `react@18.3.1` and `react-dom@18.3.1` (single version)

---

## ✅ Fix

**Replaced complex manual chunking with Vite's safe `splitVendorChunkPlugin()`**

### Changes

**File: `vite.config.js`**

**Before:**
```javascript
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), /* ... */],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Complex logic creating circular dependencies
          if (id.includes("/react/")) return "vendor-react";
          if (id.includes("/@sentry/")) return "vendor-sentry";
          return "vendor"; // ← Created circular dependency
        }
      }
    }
  }
});
```

**After:**
```javascript
import { defineConfig, splitVendorChunkPlugin } from "vite";

export default defineConfig({
  plugins: [
    react(),
    splitVendorChunkPlugin(), // ← Safe automatic vendor chunking
    /* ... */
  ],
  build: {
    sourcemap: process.env.SENTRY_AUTH_TOKEN ? "hidden" : true,
    // splitVendorChunkPlugin() handles chunking automatically without circular dependencies
  }
});
```

**Result:**
- ✅ Removed 68 lines of complex manual chunking logic
- ✅ No circular dependencies
- ✅ Clean build output
- ✅ Reliable module loading order

---

## 🧪 Anti-Regression

**Added: `e2e/smoke-home.spec.js`**

Minimal smoke test that prevents white screen regressions:

```javascript
test('Home page loads without white screen or runtime errors', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto('/');
  
  // Verify visible content (not white screen)
  await expect(page.locator('header, nav, h1, [role="banner"]').first()).toBeVisible();
  
  // Verify no runtime errors
  expect(pageErrors).toHaveLength(0);
  
  // Verify no critical React/undefined errors
  const criticalErrors = consoleErrors.filter(err => 
    err.includes('undefined') || 
    err.includes('useLayoutEffect') ||
    err.includes('useMergeRef')
  );
  expect(criticalErrors).toHaveLength(0);
});
```

**Coverage:**
- ✅ Detects uncaught page errors
- ✅ Detects critical console errors (React/undefined)
- ✅ Verifies home page renders visible content
- ✅ Fast execution (~4.6s for 2 tests)

---

## 📊 How to Verify

### Build Verification

**Before fix:**
```bash
npm run build
# Output:
# Circular chunk: vendor -> vendor-react -> vendor ❌
# Circular chunk: vendor -> vendor-react -> vendor-sentry -> vendor ❌
```

**After fix:**
```bash
npm run build
# Output:
# ✓ built in 6.58s ✅
# No circular chunk warnings ✅
```

### Test Verification

```bash
# Lint
npm run lint
# ✅ PASS (1 pre-existing warning, unrelated)

# Unit tests
npm test
# ✅ PASS (55/55 tests)

# Smoke test
npx playwright test e2e/smoke-home.spec.js
# ✅ PASS (2/2 tests in 4.6s)
```

### Local Preview

```bash
npm ci
npm run build
npm run preview
# Open http://localhost:4173
# ✅ Home page renders (not white screen)
# ✅ No console errors
```

### Production Verification (After Deployment)

1. **Open production URL** → Should display home page (not white screen)
2. **Check browser console** → No `useLayoutEffect` or `undefined` errors
3. **Navigate routes** → All pages should work
4. **Check Vercel build logs** → No "Circular chunk" warnings

---

## 📝 Files Modified

### Core Fix
- **`vite.config.js`** - Replaced manual chunking with `splitVendorChunkPlugin()`
  - Added `splitVendorChunkPlugin` import and plugin
  - Removed entire `rollupOptions.output.manualChunks` configuration

### Anti-Regression
- **`e2e/smoke-home.spec.js`** - New smoke test to catch white screen issues
  - Detects runtime errors
  - Detects critical console errors
  - Verifies content renders

---

## 🎯 Validation Results

| Check | Status | Details |
|-------|--------|---------|
| **Build** | ✅ PASS | No circular chunk warnings |
| **Lint** | ✅ PASS | No new errors |
| **Unit Tests** | ✅ PASS | 55/55 tests passed |
| **Smoke Test** | ✅ PASS | 2/2 tests passed (4.6s) |
| **Preview** | ✅ PASS | Home page renders correctly |

---

## 🔍 Technical Context

### Why `splitVendorChunkPlugin()` is Safe

Vite's `splitVendorChunkPlugin()` uses a proven strategy:
- Splits `node_modules` into a single `vendor` chunk
- Splits app code into separate chunks
- **Never creates circular dependencies**
- Recommended by Vite team for most use cases

### Bundle Size Impact

**Before:** Multiple vendor chunks (total ~870 kB)
- `vendor-DtNtaDht.js` (527 kB)
- `vendor-react-9Ky7egSp.js` (149 kB)
- `vendor-sentry-DOaSoAFE.js` (108 kB)
- `vendor-ui-uIbO4iFh.js` (122 kB)
- Others...

**After:** Single vendor chunk (~893 kB)
- `vendor-WLxldAYq.js` (893 kB)

**Trade-off:**
- Slightly larger single chunk
- Better caching (vendor changes less frequently)
- **More reliable** loading order (no circular dependencies)
- **No white screen** in production

---

## ✅ Checklist

- [x] Root cause identified and documented
- [x] Minimal, atomic fix applied
- [x] Build produces no circular chunk warnings
- [x] Smoke test added to prevent regression
- [x] All tests pass (lint, unit, smoke)
- [x] Preview verified locally
- [x] No secrets in repo
- [x] PR description complete

---

## 🚀 Ready for Deployment

**Expected outcome after deployment:**
- ✅ Production site displays home page (no white screen)
- ✅ No `useLayoutEffect` runtime errors
- ✅ Clean Vercel build logs (no circular chunk warnings)
- ✅ All CI tests pass

**Commands to deploy:**
```bash
git add vite.config.js e2e/smoke-home.spec.js
git commit -m "fix: production white screen (chunk cycle) + smoke test"
git push origin main
```
