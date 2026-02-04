# FALC Fields Priority Documentation

## Overview

FALC (Facile à Lire et à Comprendre) is a simplified language standard designed to make content accessible to people with reading difficulties. This document defines the field priority for FALC content across different entity types in the AccesDirectAide platform.

## Component

**Location:** `src/components/FalcSummary.jsx`

**Behavior:**
- Displays FALC content in a visually distinct card with a "FALC" badge
- Renders nothing (null) if no FALC content is available
- Preserves whitespace and line breaks for readability
- Accessible with `aria-label`

## Field Priority by Entity Type

### 1. Aide (Aid/Benefit)

**Page:** `src/pages/AideDetail.jsx`

**Priority:**
```javascript
aide?.summary_falc
```

**Rationale:** Aides have a dedicated `summary_falc` field that provides a simplified summary of the benefit.

---

### 2. Démarche (Administrative Procedure)

**Page:** `src/pages/DemarcheDetail.jsx`

**Priority:**
```javascript
demarche?.summary_falc || demarche?.description_falc || demarche?.resume_falc
```

**Rationale:**
1. `summary_falc` - Primary FALC field (preferred)
2. `description_falc` - Alternative FALC description
3. `resume_falc` - Fallback FALC summary

---

### 3. Structure (Organization)

**Page:** `src/pages/StructureDetail.jsx`

**Priority:**
```javascript
structure?.resume_falc || structure?.summary_falc || structure?.description_falc
```

**Rationale:**
1. `resume_falc` - Primary FALC summary for structures
2. `summary_falc` - Alternative FALC summary
3. `description_falc` - Fallback FALC description

---

### 4. Dispositif (Program/Scheme)

**Page:** `src/pages/DispositifDetail.jsx`

**Priority:**
```javascript
dispositif?.description_falc || dispositif?.summary_falc
```

**Rationale:**
1. `description_falc` - Primary FALC description for programs
2. `summary_falc` - Fallback FALC summary

---

### 5. Ressource (Resource)

**Page:** `src/pages/RessourceDetail.jsx`

**Priority:**
```javascript
ressource?.resume_falc || ressource?.summary_falc || ressource?.description_falc
```

**Rationale:**
1. `resume_falc` - Primary FALC summary for resources
2. `summary_falc` - Alternative FALC summary
3. `description_falc` - Fallback FALC description

---

### 6. Actualité (News/Update)

**Page:** `src/pages/ActualiteDetail.jsx`

**Priority:**
```javascript
actu?.summary_falc
```

**Rationale:** Actualités have a dedicated `summary_falc` field for simplified news summaries.

---

## Data Quality Guidelines

### Content Requirements

1. **Length:** FALC content should be concise (100-300 words)
2. **Language:** Use simple, everyday words
3. **Sentences:** Keep sentences short (max 15-20 words)
4. **Structure:** Use clear paragraphs with line breaks
5. **Avoid:** Jargon, acronyms (unless explained), complex grammar

### Validation Rules

1. **Non-empty:** FALC fields should not be empty strings or whitespace-only
2. **Trimming:** Component automatically trims whitespace
3. **Null handling:** Component gracefully handles null/undefined values
4. **Type safety:** Component expects string values

### Testing

**Test file:** `tests/unit/falcsummary.test.js`

**Coverage:**
- ✅ Renders nothing when text is empty
- ✅ Renders nothing when text is null/undefined
- ✅ Renders content when text is provided
- ✅ Trims whitespace correctly
- ✅ Preserves line breaks
- ✅ Handles multiline content
- ✅ Displays FALC badge
- ✅ Uses custom title when provided
- ✅ Applies custom className

## Integration Checklist

When adding FALC support to a new entity type:

- [ ] Identify the primary FALC field name
- [ ] Define fallback fields (if applicable)
- [ ] Import `FalcSummary` component
- [ ] Add component to detail page with correct field priority
- [ ] Update this documentation
- [ ] Add integration test
- [ ] Verify rendering with real data

## Maintenance

### Adding New FALC Fields

1. Update database schema to include new FALC field
2. Update API response to include the field
3. Update field priority in the relevant detail page
4. Update this documentation
5. Add test coverage

### Deprecating FALC Fields

1. Update field priority to remove deprecated field
2. Add migration plan for existing data
3. Update this documentation
4. Maintain backward compatibility for 1-2 releases

## References

- **FALC Standard:** [Inclusion Europe - Easy to Read Guidelines](https://www.inclusion-europe.eu/easy-to-read/)
- **Component:** `src/components/FalcSummary.jsx`
- **Tests:** `tests/unit/falcsummary.test.js`
- **Integration:** All `*Detail.jsx` pages in `src/pages/`

---

**Last Updated:** 2026-02-04  
**Maintained by:** Tech Lead Fullstack
