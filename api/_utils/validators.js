import { z } from 'zod';

const baseSearchSchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20), // limit alias
  limit: z.coerce.number().int().min(1).max(100).optional(), // optional override
  id: z.string().optional(),
  slug: z.string().optional(),
});

export const searchAidesSchema = baseSearchSchema.extend({
  theme: z.string().optional(),
  sousTheme: z.string().optional(),
  sub_theme: z.string().optional(), // alias for sousTheme
  public: z.string().optional(), // audience alias
  territoire: z.string().optional(),
  organisme: z.string().optional(),
  urgent: z.enum(['true', 'false']).optional(),
  statut: z.string().default('publie'),
  sort: z.enum(['pertinence', 'date', 'alpha']).default('pertinence'),
  // Legacy/Compatibility
  category: z.string().optional(),
  categorie: z.string().optional(), // French alias
  situation: z.string().optional(),
  geo: z.string().optional(),
  audience: z.string().optional(),
}).transform((data) => {
  // Normalize aliases
  return {
    ...data,
    theme: data.theme || data.category || data.categorie,
    sousTheme: data.sousTheme || data.sub_theme,
    public: data.public || data.audience,
    territoire: data.territoire || data.geo
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
