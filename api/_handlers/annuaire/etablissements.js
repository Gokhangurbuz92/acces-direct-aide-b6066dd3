import prisma from '../../_utils/prisma.js';
import { checkRateLimit, getClientIp } from '../../_utils/rateLimit.js';
import { searchEstablishmentsSchema } from '../../_utils/validators.js';
import { Prisma } from '@prisma/client';
import { captureException } from '../../_utils/sentry.js';
import logger from '../../lib/logger.js';

/**
 * Search establishments with filters
 * Can be filtered by organization, type, location, accessibility
 */
async function searchEstablishments(prisma, params) {
  const { q, orgSlug, type, city, postal_code, department_code, accessibility, sort, page, pageSize } = params;

  const LIMIT = pageSize;
  const OFFSET = (page - 1) * LIMIT;

  const conditions = [Prisma.sql`e.status = 'publie'`];

  // 1. Filter by organization (if orgSlug provided)
  if (orgSlug) {
    conditions.push(Prisma.sql`EXISTS (
      SELECT 1 FROM "Organization" o
      WHERE o.id = e."organizationId" AND o.slug = ${orgSlug}
    )`);
  }

  // 2. Full-text search on establishment name, services
  if (q) {
    conditions.push(Prisma.sql`(
      e.name ILIKE ${'%' + q + '%'} OR
      e.city ILIKE ${'%' + q + '%'}
    )`);
  }

  // 3. Type filter
  if (type) {
    conditions.push(Prisma.sql`e.type = ${type}`);
  }

  // 4. Location filters
  if (city) {
    conditions.push(Prisma.sql`e.city ILIKE ${'%' + city + '%'}`);
  }
  if (postal_code) {
    conditions.push(Prisma.sql`e.postal_code = ${postal_code}`);
  }
  if (department_code) {
    conditions.push(Prisma.sql`e.department_code = ${department_code}`);
  }

  // 5. Accessibility filter
  if (accessibility) {
    conditions.push(Prisma.sql`${accessibility} = ANY(e.accessibility)`);
  }

  const whereClause = conditions.length > 0
    ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
    : Prisma.empty;

  // 6. Sorting
  let orderBy;
  if (sort === 'alpha') {
    orderBy = Prisma.sql`ORDER BY e.name ASC, e.id ASC`;
  } else if (sort === 'proximity') {
    // TODO: Implement proximity sort based on geo_lat/geo_lng + user location
    // For now, fallback to alpha
    orderBy = Prisma.sql`ORDER BY e.name ASC, e.id ASC`;
  } else {
    // pertinence
    if (q) {
      orderBy = Prisma.sql`ORDER BY
        CASE
          WHEN e.name ILIKE ${'%' + q + '%'} THEN 1
          WHEN e.city ILIKE ${'%' + q + '%'} THEN 2
          ELSE 3
        END ASC,
        e.name ASC`;
    } else {
      orderBy = Prisma.sql`ORDER BY e.name ASC, e.id ASC`;
    }
  }

  // 7. Execute queries
  const itemsQuery = Prisma.sql`
    SELECT e.*
    FROM "Establishment" e
    ${whereClause}
    ${orderBy}
    LIMIT ${LIMIT} OFFSET ${OFFSET}
  `;

  const countQuery = Prisma.sql`
    SELECT COUNT(*) as total
    FROM "Establishment" e
    ${whereClause}
  `;

  const [items, countResult] = await Promise.all([
    prisma.$queryRaw(itemsQuery),
    prisma.$queryRaw(countQuery)
  ]);

  return {
    items,
    total: Number(countResult[0]?.total || 0)
  };
}

/**
 * API Handler: GET /api/annuaire/etablissements
 * or GET /api/annuaire/organisations/:orgSlug/etablissements
 */
async function handler(req, res) {
  const startTime = Date.now();

  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit('SEARCH_ESTABLISHMENTS', ip);
    if (!rateLimit.allowed) {
      return res.status(429).json(rateLimit.error);
    }

    // Extract slug from URL if present (for single establishment detail)
    const slug = req.query.slug || null;

    // CASE 1: Single establishment detail by slug
    if (slug) {
      const establishment = await prisma.establishment.findUnique({
        where: { slug },
        include: {
          organization: true,
        },
      });

      if (!establishment || establishment.status !== 'publie') {
        logger.warn({ route: '/api/annuaire/etablissements/:slug', slug, status: 404 });
        return res.status(404).json({ error: 'Establishment not found' });
      }

      const duration = Date.now() - startTime;
      logger.info({
        route: '/api/annuaire/etablissements/:slug',
        slug,
        status: 200,
        duration,
      });

      return res.status(200).json(establishment);
    }

    // CASE 2: List establishments with filters
    const validation = searchEstablishmentsSchema.safeParse(req.query);
    if (!validation.success) {
      logger.warn({
        route: '/api/annuaire/etablissements',
        error: 'Validation failed',
        details: validation.error.format(),
      });
      return res.status(400).json({
        error: 'Invalid parameters',
        details: validation.error.format(),
      });
    }

    const params = validation.data;

    const { items, total } = await searchEstablishments(prisma, params);

    const duration = Date.now() - startTime;
    logger.info({
      route: '/api/annuaire/etablissements',
      params,
      results: items.length,
      total,
      duration,
    });

    return res.status(200).json({
      items,
      pagination: {
        total,
        page: params.page,
        pageSize: params.pageSize,
        totalPages: Math.ceil(total / params.pageSize),
      },
    });

  } catch (error) {
    console.error('Establishments handler error:', error);
    captureException(error, {
      tags: { route: '/api/annuaire/etablissements', method: req.method },
      extra: { query: req.query },
    });

    logger.error({
      route: '/api/annuaire/etablissements',
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime,
    });

    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default handler;
