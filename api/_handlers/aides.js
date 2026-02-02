import prisma from '../_utils/prisma.js';
import { checkRateLimit, getClientIp } from '../_utils/rateLimit.js';
import { searchAidesSchema } from '../_utils/validators.js';
import { searchAides } from '../lib/search-query.js';
import { logger } from '../lib/logger.js';
import crypto from 'crypto';

async function handler(req, res) {
    const requestId = crypto.randomUUID();
    const startMs = Date.now();

    logger.info('AIDES_HANDLER_START', {
        requestId,
        method: req.method,
        path: req.url,
        query: logger.mask(req.query)
    });

    try {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            logger.warn('AIDES_METHOD_NOT_ALLOWED', { requestId, method: req.method });
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const ip = getClientIp(req);
        const rateLimit = await checkRateLimit('SEARCH_AIDES', ip);
        if (!rateLimit.allowed) {
            logger.warn('AIDES_RATE_LIMITED', { requestId, ip });
            return res.status(429).json(rateLimit.error);
        }

        // Validate Input
        logger.info('AIDES_VALIDATION_START', { requestId });
        const validation = searchAidesSchema.safeParse(req.query);
        if (!validation.success) {
            logger.error('AIDES_VALIDATION_ERROR', { requestId, errors: validation.error.format() });
            return res.status(400).json({ error: 'Invalid parameters', details: validation.error.format() });
        }
        const params = validation.data;
        logger.info('AIDES_VALIDATION_SUCCESS', { requestId, params: logger.mask(params) });

        // 1. Single Item (Direct access via ID/Slug)
        if (params.id || params.slug) {
            logger.info('AIDES_DB_SINGLE_START', { requestId, id: params.id, slug: params.slug });
            const dbStart = Date.now();

            const aide = await prisma.aide.findFirst({
                where: params.id ? { id: params.id } : { slug: params.slug },
                include: { category: true, situations: true }
            });

            const dbDuration = Date.now() - dbStart;
            logger.info('AIDES_DB_SINGLE_END', { requestId, found: !!aide, duration_ms: dbDuration });

            if (!aide || aide.statut !== 'publie') {
                const totalDuration = Date.now() - startMs;
                logger.warn('AIDES_NOT_FOUND', { requestId, id: params.id, slug: params.slug, duration_ms: totalDuration });
                return res.status(404).json({ error: "Aide non trouvée" });
            }

            const totalDuration = Date.now() - startMs;
            logger.info('AIDES_SUCCESS', { requestId, type: 'single', duration_ms: totalDuration });
            return res.status(200).json(aide);
        }

        // 2. Search / List (Unified)
        logger.info('AIDES_DB_SEARCH_START', { requestId, filters: logger.mask(params) });
        const dbStart = Date.now();

        const { items, total } = await searchAides(prisma, params);

        const dbDuration = Date.now() - dbStart;
        const totalDuration = Date.now() - startMs;

        logger.info('AIDES_DB_SEARCH_END', {
            requestId,
            count: items.length,
            total,
            db_duration_ms: dbDuration,
            total_duration_ms: totalDuration
        });

        logger.info('AIDES_SUCCESS', {
            requestId,
            type: 'search',
            count: items.length,
            duration_ms: totalDuration
        });

        return res.status(200).json({
            items,
            pagination: {
                total,
                page: params.page,
                pageSize: params.pageSize,
                totalPages: Math.ceil(total / params.pageSize)
            }
        });
    } catch (error) {
        const totalDuration = Date.now() - startMs;
        logger.error('AIDES_ERROR', {
            requestId,
            error: error.message,
            stack: error.stack,
            duration_ms: totalDuration
        });
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export default handler;
