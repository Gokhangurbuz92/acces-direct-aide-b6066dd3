# FALC Fields Priority Documentation

**FALC** = Facile à Lire et à Comprendre (Easy to Read and Understand)

## Overview

This document defines the priority order for FALC fields across different entity types in the AccesDirectAide platform. The `FalcSummary` component uses these priorities to display simplified content when available.

## Field Priority by Entity Type

### 1. Aides (Financial Aid)
**Component**: `AideDetail.jsx`

**Priority**:
1. `summary_falc` (primary FALC summary)

**Rationale**: Aides have a dedicated FALC summary field that is specifically written for accessibility.

### 2. Démarches (Administrative Procedures)
**Component**: `DemarcheDetail.jsx`

**Priority**:
1. `summary_falc` (primary FALC summary)
2. `description_falc` (FALC description)
3. `resume_falc` (FALC resume)

**Rationale**: Démarches may have multiple FALC fields depending on data source. Priority ensures the most concise summary is shown first.

### 3. Structures (Organizations)
**Component**: `StructureDetail.jsx`

**Priority**:
1. `resume_falc` (FALC resume)
2. `summary_falc` (FALC summary)
3. `description_falc` (FALC description)

**Rationale**: Structures typically have a resume field as primary, with fallbacks for different data sources.

### 4. Dispositifs (Programs/Schemes)
**Component**: `DispositifDetail.jsx`

**Priority**:
1. `description_falc` (FALC description)
2. `summary_falc` (FALC summary)

**Rationale**: Dispositifs primarily use description_falc as their main FALC field.

### 5. Ressources (Resources)
**Component**: `RessourceDetail.jsx`

**Priority**:
1. `resume_falc` (FALC resume)
2. `summary_falc` (FALC summary)
3. `description_falc` (FALC description)

**Rationale**: Similar to Structures, Ressources use resume as primary field.

### 6. Actualités (News)
**Component**: `ActualiteDetail.jsx`

**Priority**:
1. `summary_falc` (FALC summary)

**Rationale**: News items have a single dedicated FALC summary field.

## Implementation

### FalcSummary Component

The `FalcSummary` component (`src/components/FalcSummary.jsx`) handles FALC content display:

```jsx
<FalcSummary text={aide?.summary_falc} />
```

**Behavior**:
- If `text` is empty, null, or undefined → renders nothing (silent fallback)
- If `text` has content → displays FALC badge + formatted text
- Preserves whitespace and line breaks
- Accessible with `aria-label`

### Usage Pattern

```jsx
// In detail pages
import FalcSummary from "@/components/FalcSummary";

// With single field
<FalcSummary text={aide?.summary_falc} />

// With fallback chain (using || operator)
<FalcSummary text={demarche?.summary_falc || demarche?.description_falc || demarche?.resume_falc} />
```

## Data Quality Guidelines

### Content Requirements

FALC content should follow these principles:
1. **Simple language**: Avoid jargon and complex terms
2. **Short sentences**: Maximum 15-20 words per sentence
3. **Clear structure**: One idea per paragraph
4. **Active voice**: Prefer active over passive voice
5. **Concrete examples**: Use real-world examples when possible

### Field Naming Conventions

- `summary_falc`: Short summary (1-3 sentences)
- `description_falc`: Detailed description (multiple paragraphs)
- `resume_falc`: Brief resume (similar to summary)

### Validation

FALC fields should be:
- **Non-empty**: At least one FALC field should have content
- **Trimmed**: No leading/trailing whitespace
- **Formatted**: Proper line breaks and paragraphs
- **Accessible**: Screen reader friendly

## Testing

### Unit Tests

Location: `tests/unit/falcsummary.test.js`

Tests cover:
- Empty text handling (renders nothing)
- Content rendering (displays badge + text)
- Whitespace trimming
- Null/undefined handling
- Multiline text formatting

### Integration Tests

Verify FALC content appears on all 6 detail pages:
1. AideDetail
2. DemarcheDetail
3. StructureDetail
4. DispositifDetail
5. RessourceDetail
6. ActualiteDetail

## Maintenance

### Adding New Entity Types

When adding a new entity type with FALC support:

1. **Identify FALC fields** in the data model
2. **Define priority order** based on content quality
3. **Update this documentation**
4. **Add to FalcSummary usage** in the detail page
5. **Add tests** for the new entity type

### Updating Field Priority

If field priority needs to change:

1. **Update detail page component** with new fallback chain
2. **Update this documentation**
3. **Add migration notes** if data structure changes
4. **Test thoroughly** to ensure no regressions

## References

- **FALC Guidelines**: https://www.inclusion-europe.eu/easy-to-read/
- **Component**: `src/components/FalcSummary.jsx`
- **Tests**: `tests/unit/falcsummary.test.js`
- **Integration**: Phase 3 FALC implementation (PR #91)

## Changelog

- **2026-02-04**: Initial documentation created
- **2026-02-04**: Added priority definitions for all 6 entity types
- **2026-02-04**: Added implementation guidelines and testing requirements
