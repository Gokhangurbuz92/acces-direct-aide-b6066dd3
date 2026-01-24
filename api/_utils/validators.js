import { z } from 'zod';

const baseSearchSchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  id: z.string().uuid().optional(),
  slug: z.string().optional(),
});

export const searchAidesSchema = baseSearchSchema.extend({
  category: z.string().optional(),
  situation: z.string().optional(),
  geo: z.string().optional(),
  audience: z.string().optional(),
  providerType: z.string().optional(),
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
