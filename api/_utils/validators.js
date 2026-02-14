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
  // P2: cap listing page size for public /api/aides
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  theme: z.string().optional(),
  sousTheme: z.string().optional(),
  public: z.string().optional(), // audience alias
  territoire: z.string().optional(),
  territory: z.string().optional(), // english alias (P2)
  organisme: z.string().optional(),
  urgent: z.enum(['true', 'false']).optional(),
  statut: z.string().default('publie'),
  // Strict whitelist for sort to prevent SQL injection
  // Accepts: pertinence, date, alpha, created_date, -created_date, published_at, -published_at, date_publication, -date_publication
  sort: z.enum([
    // P2 aliases
    'relevance',
    'recent',
    '-recent',
    'quality',
    '-quality',
    // Backward compatible aliases (admin/front)
    'updated_date',
    '-updated_date',
    'pertinence', 'date', 'alpha',
    'created_date', '-created_date',
    'published_at', '-published_at',
    'date_publication', '-date_publication',
    'titre', '-titre'
  ]).optional(),
  // Legacy/Compatibility
  category: z.string().optional(),
  situation: z.string().optional(),
  geo: z.string().optional(),
  audience: z.string().optional(),
});

export const searchDemarchesSchema = baseSearchSchema.extend({
  // P3: cap listing page size for public /api/demarches
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  // Allow `limit=` (empty) without failing validation (compat with legacy list() calls).
  limit: z.preprocess(
    (value) => (value === '' || value == null ? undefined : value),
    z.coerce.number().int().min(1).max(50).optional(),
  ),
  // Aliases (front/back compatibility)
  theme: z.string().optional(), // alias for category
  territoire: z.string().optional(), // alias for geo
  territory: z.string().optional(), // english alias
  // Basic filters
  category: z.string().optional(),
  situation: z.string().optional(),
  geo: z.string().optional(),
  audience: z.string().optional(),
  online: z.enum(['true', 'false', '1', '0']).optional(),
  statut: z.string().default('publie'),
  // Strict whitelist for sort to prevent SQL injection
  sort: z.enum([
    // External stable aliases
    'relevance',
    'recent',
    '-recent',
    'quality',
    '-quality',
    // Backward compatible aliases (admin/front)
    'updated_date',
    '-updated_date',
    'pertinence', 'date', 'alpha',
    'created_date', '-created_date',
    'published_at', '-published_at',
    'date_publication', '-date_publication',
    'titre', '-titre'
  ]).optional(),
});

export const searchStructuresSchema = baseSearchSchema.extend({
  // P4: cap listing page size for public /api/structures
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  // Allow `limit=` (empty) without failing validation (compat with legacy list() calls).
  limit: z.preprocess(
    (value) => (value === '' || value == null ? undefined : value),
    z.coerce.number().int().min(1).max(50).optional(),
  ),
  city: z.string().optional(),
  zip: z.string().optional(),
  type: z.string().optional(),
  departement: z.string().optional(),
  territory: z.string().optional(), // alias
  geo: z.string().optional(), // alias
  pmr: z.enum(['true', 'false', '1', '0']).optional(),
  // Strict whitelist for sort to prevent SQL injection
  sort: z.enum([
    // External stable aliases
    'relevance',
    'recent',
    '-recent',
    'quality',
    '-quality',
    // Backward compatible aliases (admin/front)
    'updated_date',
    '-updated_date',
    'alpha',
    '-alpha',
    'nom',
    '-nom',
    'quality_score',
    '-quality_score',
  ]).optional(),
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
