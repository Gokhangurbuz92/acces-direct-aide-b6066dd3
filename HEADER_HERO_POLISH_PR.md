# UI Polish: Header + Hero Branding

## Summary
Removed visual noise from hero section to create a cleaner, more focused user experience. The header logo and navigation were already optimized in a previous commit.

## Changes Made

### 1. Hero Section (Home.jsx)
**Problem:** White pill badge with logo created visual duplication and noise on the blue gradient background.

**Solution:** Removed the badge entirely. Hero now starts directly with the headline.

**Before:**
```jsx
<div className="mb-8 flex justify-center">
  <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
    <Logo variant="icon" tone="white" size={32} />
    <span className="text-white font-semibold text-sm">AccesDirectAide</span>
  </div>
</div>
<h1>Trouvez les aides...</h1>
```

**After:**
```jsx
<h1>Trouvez les aides...</h1>
```

### 2. Header Logo (Layout.jsx)
**Status:** Already optimized (no changes needed)
- Clean logo links without background pills
- Focus rings only visible on keyboard navigation (focus-visible)
- Perfect vertical alignment with nav items

### 3. Navigation Active State (Layout.jsx)
**Status:** Already optimized (no changes needed)
- Active link uses subtle 2px bottom border via CSS pseudo-element
- Clean hover state with `bg-brand-highlight/10`
- No visual "pill" around active items

## Files Modified
- `src/pages/Home.jsx` (6 lines removed)

## Verification

### Build Status
✅ Build successful (6.84s)
```bash
npm run build
# ✓ built in 6.84s
```

### Visual Verification
Test these routes to verify no regressions:
- `/` - Home page (hero should be clean, no logo badge)
- `/aides` - Aides listing
- `/demarches` - Démarches
- `/structures` - Annuaire
- `/actualites` - Actualités

### Accessibility
- ✅ Focus rings preserved (focus-visible)
- ✅ No layout shift on hover/focus
- ✅ Keyboard navigation intact
- ✅ ARIA labels maintained

### Design Tokens
- ✅ All existing design tokens preserved
- ✅ No new colors introduced
- ✅ Consistent with brand guidelines

## How to Test

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Start dev server:**
   ```bash
   npm run dev
   ```

3. **Visual checks:**
   - Hero section should start directly with headline (no logo badge)
   - Header logo should be clean (no white bubble)
   - Active nav item "Accueil" should have subtle underline (no pill)
   - Tab through navigation to verify focus rings

4. **Keyboard navigation:**
   - Press Tab to navigate through header links
   - Focus rings should be visible and clear
   - No visual glitches or layout shifts

## Impact
- **Visual Clarity:** Reduced visual noise in hero section
- **Brand Consistency:** Cleaner, more institutional appearance
- **Performance:** Slightly reduced DOM complexity (removed nested divs)
- **Accessibility:** Maintained (no negative impact)
- **Breaking Changes:** None

## Commit
```
a3b2f6f fix(ui): remove hero logo badge for cleaner visual
```

## Next Steps
This PR is ready to merge. No additional work required.
