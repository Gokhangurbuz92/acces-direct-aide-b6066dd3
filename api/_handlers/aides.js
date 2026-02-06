import prisma from '../_utils/prisma.js';
import { checkRateLimit, getClientIp } from '../_utils/rateLimit.js';
import { searchAidesSchema } from '../_utils/validators.js';
import { searchAides } from '../lib/search-query.js';
import { logger } from '../lib/logger.js';
import * as Sentry from '@sentry/node';
import crypto from 'crypto';

async function handler(req, res) {
    const requestId = crypto.randomUUID();
    const start = Date.now();

    try {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const ip = getClientIp(req);

        // Logger Start
        logger.info('SEARCH_AIDES_START', { requestId, path: req.url, query: req.query, ip });

        const rateLimit = await checkRateLimit('SEARCH_AIDES', ip);
        if (!rateLimit.allowed) {
            logger.warn('SEARCH_AIDES_RATELIMIT', { requestId, ip });
            return res.status(429).json(rateLimit.error);
        }

        // Validate Input
        Sentry.addBreadcrumb({
            category: 'validation',
            message: 'Validating search params',
            level: 'info'
        });

        const validation = searchAidesSchema.safeParse(req.query);
        if (!validation.success) {
            logger.warn('SEARCH_AIDES_INVALID_PARAMS', { requestId, error: validation.error });
            return res.status(400).json({ error: 'Invalid parameters', details: validation.error.format() });
        }
        const params = validation.data;

        // 1. Single Item (Direct access via ID/Slug)
        if (params.id || params.slug) {
            Sentry.addBreadcrumb({
                category: 'db',
                message: 'Fetching single aide',
                data: { id: params.id, slug: params.slug },
                level: 'info'
            });

            const aide = await prisma.aide.findFirst({
                where: params.id ? { id: params.id } : { slug: params.slug },
                include: { category: true, situations: true }
            });

            if (!aide || aide.statut !== 'publie') {
                return res.status(404).json({ error: "Aide non trouvée" });
            }

            // Fetch FALC summary if available
            const falcSummary = await prisma.falcSummary.findUnique({
                where: {
                    entity_type_entity_id: {
                        entity_type: 'aide',
                        entity_id: aide.id
                    }
                }
            }).catch(() => null); // Graceful fallback if table doesn't exist yet

            if (falcSummary) {
                aide.falcSummary = falcSummary;
            }

            logger.info('SEARCH_AIDES_SINGLE_SUCCESS', { requestId, duration_ms: Date.now() - start });
            return res.status(200).json(aide);
        }

        // 2. Search / List (Unified)
        Sentry.addBreadcrumb({
            category: 'db',
            message: 'Executing search query',
            data: params,
            level: 'info'
        });

        // Ensure ONLY ONE declaration of items/total
        const { items, total, facets } = await searchAides(prisma, params);

        logger.info('SEARCH_AIDES_SUCCESS', {
            requestId,
            duration_ms: Date.now() - start,
            total,
            count: items.length,
            page: params.page,
            limit: params.pageSize
        });

        Sentry.addBreadcrumb({
            category: 'response',
            message: 'Sending search results',
            level: 'info'
        });

        return res.status(200).json({
            items,
            facets,
            pagination: {
                total,
                page: params.page,
                pageSize: params.pageSize,
                totalPages: Math.ceil(total / params.pageSize)
            }
        });
    } catch (error) {
        logger.error('SEARCH_AIDES_ERROR', { requestId, duration_ms: Date.now() - start, error });
        Sentry.captureException(error, {
            extra: { requestId, query: req.query }
        });
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export default handler;
