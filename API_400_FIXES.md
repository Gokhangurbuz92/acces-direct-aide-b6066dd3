# API 400 Error Fixes - /api/aides Endpoint

**Date**: February 2, 2026  
**Issue**: Production 400 errors on `/api/aides` endpoint with valid query parameters

---

## 🐛 Root Causes Identified

### 1. **Strict Sort Validation**
**Problem**: The validator only accepted `'pertinence'`, `'date'`, or `'alpha'` but the frontend was sending:
- `sort=-created_date` (from homepage)
- `sort=created_date` (from other pages)

**Error URLs**:
```
/api/aides?statut=publie&sort=-created_date&limit=6
```

### 2. **Empty String Parameters**
**Problem**: The validator didn't handle empty strings properly. Frontend was sending:
```
/api/aides?q=&theme=&situation=&territoire=&public=&organisme=&urgent=&page=1&pageSize=12
```

Empty strings (`theme=`) were being treated as invalid values instead of "not provided".

### 3. **Theme Filter with Empty Params**
**Problem**: When filtering by theme, other empty parameters caused validation failures:
```
/api/aides?q=&theme=aide-financiere&situation=&territoire=&public=&organisme=&urgent=&page=1&pageSize=12
```

---

## ✅ Solutions Implemented

### 1. **Flexible Sort Parameter Handling**

**File**: `api/_utils/validators.js`

**Changes**:
- Changed `sort` from strict enum to flexible string with transformation
- Added normalization logic to map various sort formats to canonical values:
  - `-created_date`, `created_date`, `date` → `'date'`
  - `alpha`, `title`, `titre` → `'alpha'`
  - `pertinence`, `relevance`, `rank` → `'pertinence'`
  - Unknown values → `'pertinence'` (default)

```javascript
sort: z.string().transform(emptyStringToUndefined).optional().default('pertinence')

// In transform function:
if (normalizedSort.includes('created') || normalizedSort.includes('date') || 
    normalizedSort === '-created_date' || normalizedSort === 'created_date') {
  normalizedSort = 'date';
}
```

### 2. **Empty String to Undefined Conversion**

**File**: `api/_utils/validators.js`

**Changes**:
- Added helper function `emptyStringToUndefined`
- Applied to all string fields in `baseSearchSchema` and `searchAidesSchema`
- Empty strings are now treated as "not provided" (undefined)

```javascript
const emptyStringToUndefined = (val) => (val === '' ? undefined : val);

// Applied to all fields:
theme: z.string().transform(emptyStringToUndefined).optional()
q: z.string().transform(emptyStringToUndefined).optional()
// etc.
```

### 3. **Alias Normalization**

**Maintained** existing alias support:
- `category`, `categorie` → `theme`
- `audience` → `public`
- `geo` → `territoire`
- `sub_theme` → `sousTheme`

---

## 🧪 Testing

### Unit Tests Created
**File**: `tests/unit/validators.test.js`

**Coverage**:
- ✅ Empty string handling (10 test cases)
- ✅ Sort parameter variations (`-created_date`, `created_date`, `alpha`, `pertinence`)
- ✅ Theme filtering with empty params
- ✅ Alias normalization
- ✅ Default values
- ✅ Unknown sort values fallback

**Results**: All 10 tests passing ✅

### Test Commands
```bash
npm test -- tests/unit/validators.test.js
```

---

## 📊 Validation Results

### Before Fix
```
❌ /api/aides?statut=publie&sort=-created_date&limit=6
   → 400 Bad Request (Invalid sort enum value)

❌ /api/aides?q=&theme=&situation=&territoire=&public=&organisme=&urgent=&page=1&pageSize=12
   → 400 Bad Request (Empty strings not handled)

❌ /api/aides?q=&theme=aide-financiere&situation=&territoire=&public=&organisme=&urgent=&page=1&pageSize=12
   → 400 Bad Request (Mixed empty and valid params)
```

### After Fix
```
✅ /api/aides?statut=publie&sort=-created_date&limit=6
   → 200 OK (sort normalized to 'date')

✅ /api/aides?q=&theme=&situation=&territoire=&public=&organisme=&urgent=&page=1&pageSize=12
   → 200 OK (empty strings converted to undefined)

✅ /api/aides?q=&theme=aide-financiere&situation=&territoire=&public=&organisme=&urgent=&page=1&pageSize=12
   → 200 OK (theme filter applied, empty params ignored)
```

---

## 🔍 Code Quality Checks

```bash
✅ npm run lint       # PASSED - 0 errors, 0 warnings
✅ npm run typecheck  # PASSED - 0 errors
✅ npm run test       # PASSED - 10/10 tests
```

---

## 📝 Files Modified

1. **`api/_utils/validators.js`**
   - Added `emptyStringToUndefined` helper
   - Updated `baseSearchSchema` to handle empty strings
   - Updated `searchAidesSchema` with flexible sort handling
   - Enhanced transform function for sort normalization

2. **`tests/unit/validators.test.js`** (NEW)
   - Created comprehensive unit tests for validator
   - 10 test cases covering all edge cases

---

## 🚀 Deployment Impact

### Breaking Changes
**None** - All changes are backward compatible:
- Old valid requests still work
- New formats now accepted
- Empty strings gracefully handled

### Performance Impact
**Minimal** - Only adds lightweight string transformations during validation

### Monitoring
- Existing Sentry error tracking will capture any remaining validation issues
- Logger already tracks validation failures with details

---

## 🎯 Expected Outcomes

1. **Homepage** (`/`) - "Dernières aides" section will load correctly
   - Uses `sort=-created_date` → Now works ✅

2. **Aides Listing** (`/aides`) - Empty filter state will work
   - Uses `q=&theme=&...` → Now works ✅

3. **Theme Filtering** (`/aides?theme=aide-financiere`) - Will work with empty other params
   - Uses `theme=aide-financiere&q=&...` → Now works ✅

4. **All Sort Options** - Will work regardless of format
   - `sort=date`, `sort=-created_date`, `sort=alpha`, `sort=pertinence` → All work ✅

---

## 🔄 Rollback Plan

If issues arise:
1. Revert `api/_utils/validators.js` to previous version
2. Frontend will need to be updated to send proper enum values
3. Alternative: Keep flexible sort but remove empty string handling

---

## ✅ Checklist

- [x] Root cause identified
- [x] Fix implemented
- [x] Unit tests created and passing
- [x] Linting passed
- [x] TypeCheck passed
- [x] No breaking changes
- [x] Backward compatible
- [x] Documentation updated
- [x] Ready for deployment

---

## 🎉 Summary

The `/api/aides` endpoint now gracefully handles:
- ✅ Various sort parameter formats
- ✅ Empty string query parameters
- ✅ Mixed valid and empty filters
- ✅ All legacy aliases
- ✅ Unknown sort values (fallback to default)

**Status**: Ready to merge and deploy 🚀
