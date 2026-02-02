import prisma from '../../_utils/prisma.js';
import { checkRateLimit, getClientIp } from '../../_utils/rateLimit.js';
import { searchOrganisationsSchema } from '../../_utils/validators.js';
import { Prisma } from '@prisma/client';
import { captureException } from '../../_utils/sentry.js';
import logger from '../../lib/logger.js';

/**
 * Search organizations with advanced filters
 * Supports full-text search, faceting, and complex AND filters
 */
async function searchOrganisations(prisma, params) {
  const { q, category, domain, public: publicFilter, territoire_level, territoire_code, status, sort, page, pageSize } = params;

  const LIMIT = pageSize;
  const OFFSET = (page - 1) * LIMIT;

  const conditions = [];

  // 1. Status filter (default: publie)
  conditions.push(Prisma.sql`status = ${status || 'publie'}`);

  // 2. Full-text search (if q provided)
  if (q) {
    // Search on name, description (using FTS if available, else ILIKE)
    conditions.push(
      Prisma.sql`(
        name ILIKE ${'%' + q + '%'} OR
        description ILIKE ${'%' + q + '%'} OR
        ${q} = ANY(acronyms)
      )`
    );
  }

  // 3. Category filter
  if (category) {
    conditions.push(Prisma.sql`category = ${category}`);
  }

  // 4. Domain filter (array ANY match)
  if (domain) {
    conditions.push(Prisma.sql`${domain} = ANY(domains)`);
  }

  // 5. Public filter (array ANY match)
  if (publicFilter) {
    conditions.push(Prisma.sql`${publicFilter} = ANY(publics)`);
  }

  // 6. Territory filters
  if (territoire_level) {
    conditions.push(Prisma.sql`territory_level = ${territoire_level}`);
  }
  if (territoire_code) {
    conditions.push(Prisma.sql`${territoire_code} = ANY(territory_codes)`);
  }

  const whereClause = conditions.length > 0
    ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
    : Prisma.empty;

  // 7. Sorting
  let orderBy;
  if (sort === 'alpha') {
    orderBy = Prisma.sql`ORDER BY name ASC, id ASC`;
  } else if (sort === 'recent') {
    orderBy = Prisma.sql`ORDER BY created_at DESC, id ASC`;
  } else {
    // pertinence (if q, prioritize name match, else alpha)
    if (q) {
      orderBy = Prisma.sql`ORDER BY
        CASE
          WHEN name ILIKE ${'%' + q + '%'} THEN 1
          WHEN description ILIKE ${'%' + q + '%'} THEN 2
          ELSE 3
        END ASC,
        name ASC`;
    } else {
      orderBy = Prisma.sql`ORDER BY name ASC, id ASC`;
    }
  }

  // 8. Execute queries
  const itemsQuery = Prisma.sql`
    SELECT
      o.*,
      (SELECT COUNT(*) FROM "Establishment" e WHERE e."organizationId" = o.id AND e.status = 'publie') as "establishmentCount"
    FROM "Organization" o
    ${whereClause}
    ${orderBy}
    LIMIT ${LIMIT} OFFSET ${OFFSET}
  `;

  const countQuery = Prisma.sql`
    SELECT COUNT(*) as total
    FROM "Organization" o
    ${whereClause}
  `;

  const [items, countResult] = await Promise.all([
    prisma.$queryRaw(itemsQuery),
    prisma.$queryRaw(countQuery)
  ]);

  // 9. Compute facets (categories, domains, publics, territoires)
  const facetsQuery = Prisma.sql`
    SELECT
      jsonb_agg(DISTINCT category) FILTER (WHERE category IS NOT NULL) as categories,
      (SELECT jsonb_agg(DISTINCT d) FROM "Organization", unnest(domains) AS d WHERE status = ${status || 'publie'}) as domains,
      (SELECT jsonb_agg(DISTINCT p) FROM "Organization", unnest(publics) AS p WHERE status = ${status || 'publie'}) as publics,
      (SELECT jsonb_agg(DISTINCT t) FROM "Organization", unnest(territory_codes) AS t WHERE status = ${status || 'publie'}) as territoires
    FROM "Organization"
    WHERE status = ${status || 'publie'}
  `;

  const facetsResult = await prisma.$queryRaw(facetsQuery);
  const facets = facetsResult[0] || {};

  return {
    items: items.map(item => ({
      ...item,
      establishmentCount: Number(item.establishmentCount || 0)
    })),
    total: Number(countResult[0]?.total || 0),
    facets: {
      categories: facets.categories || [],
      domains: facets.domains || [],
      publics: facets.publics || [],
      territoires: facets.territoires || [],
    }
  };
}

/**
 * API Handler: GET /api/annuaire/organisations
 * Handles both list and single organization detail (by slug)
 */
async function handler(req, res) {
  const startTime = Date.now();

  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit('SEARCH_ORGANISATIONS', ip);
    if (!rateLimit.allowed) {
      return res.status(429).json(rateLimit.error);
    }

    // Extract slug from URL if present (e.g., /api/annuaire/organisations/france-travail)
    const slug = req.query.slug || null;

    // CASE 1: Single organization detail by slug
    if (slug) {
      const organization = await prisma.organization.findUnique({
        where: { slug },
        include: {
          establishments: {
            where: { status: 'publie' },
            orderBy: { name: 'asc' },
          },
        },
      });

      if (!organization || organization.status !== 'publie') {
        logger.warn({ route: '/api/annuaire/organisations/:slug', slug, status: 404 });
        return res.status(404).json({ error: 'Organization not found' });
      }

      // Compute establishment summary
      const establishments = organization.establishments || [];
      const byType = establishments.reduce((acc, est) => {
        acc[est.type || 'autre'] = (acc[est.type || 'autre'] || 0) + 1;
        return acc;
      }, {});

      const byCities = establishments.reduce((acc, est) => {
        if (est.city) {
          const existing = acc.find(c => c.city === est.city);
          if (existing) {
            existing.count++;
          } else {
            acc.push({ city: est.city, count: 1 });
          }
        }
        return acc;
      }, []).sort((a, b) => b.count - a.count);

      const duration = Date.now() - startTime;
      logger.info({
        route: '/api/annuaire/organisations/:slug',
        slug,
        status: 200,
        duration,
      });

      return res.status(200).json({
        organization,
        establishmentsSummary: {
          total: establishments.length,
          byType,
          byCities,
        },
      });
    }

    // CASE 2: List organizations with filters
    const validation = searchOrganisationsSchema.safeParse(req.query);
    if (!validation.success) {
      logger.warn({
        route: '/api/annuaire/organisations',
        error: 'Validation failed',
        details: validation.error.format(),
      });
      return res.status(400).json({
        error: 'Invalid parameters',
        details: validation.error.format(),
      });
    }

    const params = validation.data;

    const { items, total, facets } = await searchOrganisations(prisma, params);

    const duration = Date.now() - startTime;
    logger.info({
      route: '/api/annuaire/organisations',
      params,
      results: items.length,
      total,
      duration,
    });

    return res.status(200).json({
      items,
      facets,
      pagination: {
        total,
        page: params.page,
        pageSize: params.pageSize,
        totalPages: Math.ceil(total / params.pageSize),
      },
    });

  } catch (error) {
    console.error('Organisations handler error:', error);
    captureException(error, {
      tags: { route: '/api/annuaire/organisations', method: req.method },
      extra: { query: req.query },
    });

    logger.error({
      route: '/api/annuaire/organisations',
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime,
    });

    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default handler;
