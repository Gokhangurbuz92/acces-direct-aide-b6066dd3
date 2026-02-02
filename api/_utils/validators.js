import { z } from 'zod';

const baseSearchSchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  id: z.string().optional(),
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

// ============================================================================
// ANNUAIRE: Organization & Establishment Validators
// ============================================================================

export const searchOrganisationsSchema = baseSearchSchema.extend({
  category: z.string().optional(), // institution/association/collectivite/entreprise_solidaire
  domain: z.string().optional(), // emploi/handicap/logement/sante/acces_droits (single value, use Array.isArray(domain) to check if multiple)
  public: z.string().optional(), // handicap/seniors/jeunes/famille/etrangers
  territoire_level: z.string().optional(), // national/regional/departmental/local
  territoire_code: z.string().optional(), // 67/68/GRAND_EST
  status: z.string().optional().default('publie'), // publie/brouillon/archive
  sort: z.enum(['pertinence', 'alpha', 'recent']).optional().default('pertinence'),
});

export const searchEstablishmentsSchema = baseSearchSchema.extend({
  orgSlug: z.string().optional(), // Filter by organization slug
  type: z.string().optional(), // agence_ft/esat/ime/mas/fam/sessad/antenne/siege
  city: z.string().optional(),
  postal_code: z.string().optional(),
  department_code: z.string().optional(),
  accessibility: z.string().optional(), // pmr/lsf/braille/facile_lire
  sort: z.enum(['pertinence', 'alpha', 'proximity']).optional().default('pertinence'),
});
