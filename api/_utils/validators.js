import { z } from 'zod';

// Helper to convert empty strings to undefined
const emptyStringToUndefined = (val) => (val === '' ? undefined : val);

const baseSearchSchema = z.object({
  q: z.string().transform(emptyStringToUndefined).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20), // limit alias
  limit: z.coerce.number().int().min(1).max(100).optional(), // optional override
  id: z.string().transform(emptyStringToUndefined).optional(),
  slug: z.string().transform(emptyStringToUndefined).optional(),
});

export const searchAidesSchema = baseSearchSchema.extend({
  theme: z.string().transform(emptyStringToUndefined).optional(),
  sousTheme: z.string().transform(emptyStringToUndefined).optional(),
  sub_theme: z.string().transform(emptyStringToUndefined).optional(), // alias for sousTheme
  public: z.string().transform(emptyStringToUndefined).optional(), // audience alias
  territoire: z.string().transform(emptyStringToUndefined).optional(),
  organisme: z.string().transform(emptyStringToUndefined).optional(),
  urgent: z.string().transform(emptyStringToUndefined).optional().transform(val => val === 'true' ? 'true' : val === 'false' ? 'false' : undefined),
  statut: z.string().transform(emptyStringToUndefined).default('publie'),
  sort: z.string().transform(emptyStringToUndefined).optional().default('pertinence'),
  // Legacy/Compatibility
  category: z.string().transform(emptyStringToUndefined).optional(),
  categorie: z.string().transform(emptyStringToUndefined).optional(), // French alias
  situation: z.string().transform(emptyStringToUndefined).optional(),
  geo: z.string().transform(emptyStringToUndefined).optional(),
  audience: z.string().transform(emptyStringToUndefined).optional(),
}).transform((data) => {
  // Normalize aliases
  let normalizedSort = data.sort || 'pertinence';
  
  // Handle various sort formats
  if (normalizedSort.includes('created') || normalizedSort.includes('date') || normalizedSort === '-created_date' || normalizedSort === 'created_date') {
    normalizedSort = 'date';
  } else if (normalizedSort.includes('alpha') || normalizedSort.includes('title') || normalizedSort.includes('titre')) {
    normalizedSort = 'alpha';
  } else if (normalizedSort.includes('pertinence') || normalizedSort.includes('relevance') || normalizedSort.includes('rank')) {
    normalizedSort = 'pertinence';
  } else {
    // Default to pertinence for unknown values
    normalizedSort = 'pertinence';
  }
  
  // Handle limit -> pageSize alias (limit takes precedence if provided)
  const finalPageSize = data.limit !== undefined ? data.limit : data.pageSize;
  
  return {
    ...data,
    theme: data.theme || data.category || data.categorie,
    sousTheme: data.sousTheme || data.sub_theme,
    public: data.public || data.audience,
    territoire: data.territoire || data.geo,
    sort: normalizedSort,
    pageSize: finalPageSize
  };
});

export const searchDemarchesSchema = baseSearchSchema.extend({
  category: z.string().optional(),
  situation: z.string().optional(),
  geo: z.string().optional(),
});

export const searchStructuresSchema = baseSearchSchema.extend({
  city: z.string().optional(),
  zip: z.string().optional(),
  type: z.string().optional(),
});
