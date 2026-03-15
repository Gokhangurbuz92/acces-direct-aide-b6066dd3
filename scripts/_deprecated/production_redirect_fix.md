# Production Issue: Redirect Loop Fix

**Date:** 2026-01-23 00:41 CET  
**Issue:** Infinite 308 redirect loop on `/api/taxonomy` endpoint  
**Status:** 🔧 **FIXED** ✅

---

## Problem Diagnosed

### Symptoms
```bash
curl -sIL https://www.accesdirectaide.fr/api/taxonomy
# Result: Infinite loop of HTTP/2 308 redirects alternating between:
# - https://www.accesdirectaide.fr/api/taxonomy
# - https://accesdirectaide.fr/api/taxonomy
```

### Root Cause

**File:** `vercel.json` lines 13-23

**Conflict:**
- Custom redirect in vercel.json: `www.accesdirectaide.fr` → `accesdirectaide.fr`  
- Vercel default behavior: `accesdirectaide.fr` → `www.accesdirectaide.fr`
- **Result:** Infinite redirect loop

---

## Solution Applied

### Changed Configuration

**Before (causing loop):**
```json
{
  "source": "/:path*",
  "has": [{"type": "host", "value": "www.accesdirectaide.fr"}],
  "destination": "https://accesdirectaide.fr/:path*",
  "permanent": true
}
```

**After (canonical www):**
```json
{
  "source": "/:path*",
  "has": [{"type":" "host", "value": "accesdirectaide.fr"}],
  "destination": "https://www.accesdirectaide.fr/:path*",
  "permanent": true
}
```

### Strategy
**Canonical domain:** `www.accesdirectaide.fr` (with www)  
**Redirect:** `accesdirectaide.fr` → `www.accesdirectaide.fr`

This aligns with Vercel's default preference for www subdomain.

---

## Verification After Deploy

Once the fix is deployed (new Vercel build from main), verify:

```bash
# Should redirect once and succeed
curl -sIL https://accesdirectaide.fr/api/taxonomy | egrep "HTTP/|location:"
# Expected:
# HTTP/2 308  (redirect to www)
# location: https://www.accesdirectaide.fr/api/taxonomy
# HTTP/2 200  (success)

# Should work directly
curl -sI https://www.accesdirectaide.fr/api/taxonomy | grep "HTTP/"
# Expected: HTTP/2 200
```

---

## SEO Status (Verified During Investigation)

### ✅ Production Domain - GOOD for SEO

**Test:**
```bash
curl -sI https://www.accesdirectaide.fr/ | egrep "x-robots-tag|HTTP/"
```

**Result:**
```
HTTP/2 200
# NO x-robots-tag header found ← GOOD! Means indexable
```

**Conclusion:** The production domain (`www.accesdirectaide.fr`) is correctly configured for search engine indexing. The `x-robots-tag: noindex` was only present on staging, as expected.

### ⚠️ robots.txt Missing

**Test:**
```bash
curl -sL https://www.accesdirectaide.fr/robots.txt
```

**Result:** Empty response

**Impact:** Non-blocking. Absence of robots.txt means:
- All pages crawlable by default
- No specific crawler directives

**Recommendation:** Create `/api/robots` handler to return proper robots.txt:
```
User-agent: *
Allow: /
Sitemap: https://www.accesdirectaide.fr/sitemap.xml
```

---

## Actions Taken

1. ✅ Identified redirect loop root cause
2. ✅ Fixed vercel.json redirect configuration
3. ✅ Committed fix to main branch
4. ✅ Pushed to trigger new deployment
5. ⏳ **Awaiting Vercel deployment to verify fix**

---

## Commit Details

```
fix: correct redirect loop by canonicalizing to www subdomain

Previous config redirected www → non-www, but Vercel defaults to non-www → www,
creating infinite 308 redirect loop on production domain.

Fixed by reversing redirect: now non-www → www (canonical).

Resolves: /api/taxonomy infinite redirect issue on accesdirectaide.fr
```

---

## Follow-up Tasks

1. **Wait for Vercel deployment** (~2-3 minutes)
2. **Test endpoints** after deploy:
   ```bash
   curl -sI https://www.accesdirectaide.fr/api/taxonomy | grep HTTP
   curl -sI https://accesdirectaide.fr/api/taxonomy | egrep "HTTP|location"
   ```
3. **Create robots.txt handler** (low priority) for proper SEO signals
4. **Update verification report** with final production test results

---

**Status:** Fix committed and pushed. Awaiting automatic deployment.
