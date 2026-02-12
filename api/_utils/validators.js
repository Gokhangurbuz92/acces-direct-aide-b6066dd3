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
  // Strict whitelist for sort to prevent SQL injection
  // Accepts: pertinence, date, alpha, created_date, -created_date, published_at, -published_at, date_publication, -date_publication
  sort: z.enum([
    'pertinence', 'date', 'alpha',
    'created_date', '-created_date',
    'published_at', '-published_at',
    'date_publication', '-date_publication',
    'titre', '-titre'
  ]).default('pertinence'),
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

const aidCategoryCodeSchema = z.enum([
  'LOGEMENT',
  'SANTE',
  'HANDICAP',
  'EMPLOI',
  'FAMILLE',
  'ETUDES',
  'MOBILITE',
  'ENERGIE',
  'ALIMENTATION',
  'JUSTICE',
  'NUMERIQUE',
  'AUTRE',
]);

export const hybridSearchSchema = z.object({
  query: z.string().trim().min(2).max(500),
  category: aidCategoryCodeSchema.optional(),
  situations: z
    .union([z.string().trim().min(1), z.array(z.string().trim().min(1)).max(20)])
    .optional()
    .transform((value) => {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      return [value];
    }),
  geoScope: z.string().trim().min(1).max(64).optional(),
  limit: z.coerce.number().int().min(1).max(30).default(10),
});
