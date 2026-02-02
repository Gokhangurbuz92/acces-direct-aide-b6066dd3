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
  public: z.string().optional(), // audience alias
  territoire: z.string().optional(),
  organisme: z.string().optional(),
  urgent: z.enum(['true', 'false']).optional(),
  statut: z.string().default('publie'),
  sort: z.enum(['pertinence', 'date', 'alpha']).default('pertinence'),
  // Legacy/Compatibility
  category: z.string().optional(),
  situation: z.string().optional(),
  geo: z.string().optional(),
  audience: z.string().optional(),
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
