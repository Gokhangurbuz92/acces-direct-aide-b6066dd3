/**
 * ACTUALITÉS API HANDLER (PREMIUM VERSION)
 *
 * Endpoints:
 * - GET /api/actualites (listing with filters)
 * - GET /api/actualites/premium (alerts + weeklyImportant sections)
 * - GET /api/actualites/:slug (detail)
 */

import prisma from '../_utils/prisma.js';
import { verifyAdmin } from '../_utils/auth.js';
import { createEntity, updateEntity, deleteEntity } from '../_utils/crud.js';
import { z } from 'zod';

// Validation schemas
const listQuerySchema = z.object({
  topic: z.string().optional(),
  q: z.string().optional(),
  impact: z.enum(['alerte', 'important', 'info']).optional(),
  source: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  audience: z.string().optional(),
  territory_level: z.string().optional(),
  territory_code: z.string().optional(),
  statut: z.string().default('publie'),
  status: z.string().optional(),
  sort: z.enum(['recent', 'pertinence']).default('recent'),
  page: z.string().optional().transform(val => parseInt(val || '1', 10)),
  limit: z.string().optional().transform(val => Math.min(parseInt(val || '20', 10), 50))
});

/**
 * Build Prisma where clause from query params
 */
function buildWhereClause(params, isAdmin) {
  const where = {};

  // Status filter
  if (!isAdmin) {
    where.statut = 'publie';
  } else if (params.statut) {
    where.statut = params.statut;
  } else if (params.status) {
    where.status = params.status;
  }

  // Topic filter
  if (params.topic && params.topic !== 'toutes') {
    where.topic_primary = params.topic;
  }

  // Impact filter
  if (params.impact) {
    where.impact = params.impact;
  }

  // Source filter
  if (params.source) {
    where.source_domain = { contains: params.source, mode: 'insensitive' };
  }

  // Date range filter
  if (params.date_from || params.date_to) {
    where.source_published_at = {};
    if (params.date_from) {
      where.source_published_at.gte = new Date(params.date_from);
    }
    if (params.date_to) {
      where.source_published_at.lte = new Date(params.date_to);
    }
  }

  // Audience filter
  if (params.audience) {
    where.audience = { has: params.audience };
  }

  // Territory filter
  if (params.territory_code) {
    where.territory_codes = { has: params.territory_code };
  }
  if (params.territory_level) {
    where.territory_level = params.territory_level;
  }

  // Search query (full-text across title, excerpt, tags, source_name)
  if (params.q) {
    where.OR = [
      { titre: { contains: params.q, mode: 'insensitive' } },
      { excerpt: { contains: params.q, mode: 'insensitive' } },
      { source_name: { contains: params.q, mode: 'insensitive' } },
      { tags: { has: params.q } }
    ];
  }

  return where;
}

/**
 * Build order by clause
 */
function buildOrderBy(sort, hasSearchQuery) {
  if (sort === 'pertinence' && hasSearchQuery) {
    // For relevance sorting when search query exists
    // This is a simplified approach; ideally use full-text search ranking
    return [
      { source_published_at: 'desc' },
      { fetched_at: 'desc' }
    ];
  }

  // Default: recent
  return [
    { source_published_at: 'desc' },
    { date_publication: 'desc' }
  ];
}

async function handler(req, res) {
  const isAdmin = verifyAdmin(req);
  const { pathname } = new URL(req.url || '', `http://${req.headers.host}`);

  try {
    // CRUD operations (admin only)
    if (req.method === 'POST') return createEntity(req, res, prisma.actualite);
    if (req.method === 'PUT') return updateEntity(req, res, prisma.actualite, 'Actualite');
    if (req.method === 'DELETE') return deleteEntity(req, res, prisma.actualite);

    // READ operations
    if (req.method === 'GET' || req.method === 'HEAD') {
      // Premium endpoint: /api/actualites/premium
      if (pathname.endsWith('/premium')) {
        try {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          // Alerts (max 3, impact=alerte)
          const alerts = await prisma.actualite.findMany({
            where: {
              statut: 'publie',
              impact: 'alerte'
            },
            orderBy: [
              { source_published_at: 'desc' },
              { date_publication: 'desc' }
            ],
            take: 3,
            select: {
              id: true,
              slug: true,
              titre: true,
              excerpt: true,
              topic_primary: true,
              topics: true,
              impact: true,
              source_name: true,
              source_domain: true,
              source_published_at: true,
              fetched_at: true,
              first_seen_at: true,
              source_url: true
            }
          });

          // Weekly important (max 5, impact=important, within last 7 days)
          const weeklyImportant = await prisma.actualite.findMany({
            where: {
              statut: 'publie',
              impact: 'important',
              source_published_at: { gte: sevenDaysAgo }
            },
            orderBy: [
              { source_published_at: 'desc' },
              { date_publication: 'desc' }
            ],
            take: 5,
            select: {
              id: true,
              slug: true,
              titre: true,
              excerpt: true,
              topic_primary: true,
              topics: true,
              impact: true,
              source_name: true,
              source_domain: true,
              source_published_at: true,
              fetched_at: true,
              first_seen_at: true,
              source_url: true
            }
          });

          return res.status(200).json({
            alerts,
            weeklyImportant,
            dateRange: {
              from: sevenDaysAgo.toISOString(),
              to: new Date().toISOString()
            }
          });
        } catch (dbError) {
          console.error('Premium endpoint DB error:', dbError);
          return res.status(200).json({ alerts: [], weeklyImportant: [] });
        }
      }

      // Detail endpoint: /api/actualites/:slug
      const { id, slug } = req.query;
      if (id || slug) {
        try {
          const item = await prisma.actualite.findFirst({
            where: id ? { id: String(id) } : { slug: String(slug) }
          });

          if (!item) {
            return res.status(404).json({ error: 'Not found' });
          }

          // Enforce visibility for non-admin
          if (!isAdmin && item.statut !== 'publie') {
            return res.status(404).json({ error: 'Not found' });
          }

          return res.status(200).json(item);
        } catch (dbError) {
          console.error('Detail endpoint DB error:', dbError);
          return res.status(500).json({ error: 'Internal server error' });
        }
      }

      // List endpoint: /api/actualites
      try {
        // Validate query params
        const params = listQuerySchema.parse(req.query);

        // Build where clause
        const where = buildWhereClause(params, isAdmin);

        // Build order by
        const orderBy = buildOrderBy(params.sort, !!params.q);

        // Pagination
        const page = params.page || 1;
        const limit = params.limit || 20;
        const skip = (page - 1) * limit;

        // Execute queries
        const [items, total] = await Promise.all([
          prisma.actualite.findMany({
            where,
            orderBy,
            skip,
            take: limit,
            select: {
              id: true,
              slug: true,
              titre: true,
              excerpt: true,
              topic_primary: true,
              topics: true,
              impact: true,
              audience: true,
              source_name: true,
              source_domain: true,
              source_published_at: true,
              fetched_at: true,
              first_seen_at: true,
              tags: true,
              source_url: true
            }
          }),
          prisma.actualite.count({ where })
        ]);

        // Calculate is_new (within 7 days)
        const now = new Date();
        const itemsWithMeta = items.map(item => ({
          ...item,
          is_new: item.first_seen_at && (now - new Date(item.first_seen_at)) / (1000 * 60 * 60 * 24) <= 7
        }));

        // Compute facets (for UI filters)
        const facets = {};
        if (items.length > 0) {
          // Topics facets
          const topicsSet = new Set();
          items.forEach(item => {
            if (item.topic_primary) topicsSet.add(item.topic_primary);
          });
          facets.topics = Array.from(topicsSet);

          // Sources facets
          const sourcesSet = new Set();
          items.forEach(item => {
            if (item.source_domain) sourcesSet.add(item.source_domain);
          });
          facets.sources = Array.from(sourcesSet);

          // Impacts facets
          const impactsSet = new Set();
          items.forEach(item => {
            if (item.impact) impactsSet.add(item.impact);
          });
          facets.impacts = Array.from(impactsSet);

          // Audiences facets
          const audiencesSet = new Set();
          items.forEach(item => {
            if (item.audience) item.audience.forEach(a => audiencesSet.add(a));
          });
          facets.audiences = Array.from(audiencesSet);
        }

        const totalPages = Math.ceil(total / limit);

        return res.status(200).json({
          items: itemsWithMeta,
          facets,
          page,
          limit,
          total,
          totalPages
        });
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          return res.status(400).json({
            error: 'Invalid query parameters',
            details: validationError.errors
          });
        }
        throw validationError;
      } catch (dbError) {
        console.error('List endpoint DB error:', dbError);
        // Fallback to safe empty state
        return res.status(200).json({
          items: [],
          facets: {},
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0
        });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Actualites handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default handler;
