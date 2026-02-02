import { z } from 'zod';

const baseSearchSchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  id: z.string().optional(),
  slug: z.string().optional(),
});

export const searchAidesSchema = baseSearchSchema.extend({
  // Legacy filters (keep for backward compatibility)
  category: z.string().optional(),
  situation: z.string().optional(),
  geo: z.string().optional(),
  audience: z.string().optional(),
  providerType: z.string().optional(),

  // DOD Required filters
  theme: z.string().optional(),
  sousTheme: z.string().optional(),
  public: z.string().optional(), // handicap, seniors, jeunes, famille, etc.
  territoire: z.string().optional(), // national, region, departement, commune
  territoireCode: z.string().optional(), // 67, 68, FR-GES, etc.
  organisme: z.string().optional(), // CAF, AGEFIPH, Région, etc.
  urgent: z.coerce.boolean().optional(),
  statut: z.string().default('publie'),
  sort: z.enum(['pertinence', '-created_date', 'title']).default('pertinence'),
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
