import { getCronAuth } from '../../_utils/cronAuth.js';
import prisma from '../../_utils/prisma.js';
import { logger } from '../../lib/logger.js';
import crypto from 'crypto';

/**
 * Link Check Cron Job
 * Checks source_url for all content modules and stores results
 */
/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */
export default async function handler(req, res) {
    const auth = getCronAuth(req);
    if (!auth.ok) {
        if (auth.reason === 'missing_secret') {
            return res.status(500).json({ error: 'CRON_SECRET is not configured' });
        }
        logger.warn('Unauthorized link-check attempt');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const runId = crypto.randomUUID();
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;

    logger.info('LINK_CHECK_START', { runId, limit });

    const stats = {
        checked: 0,
        broken: 0,
        ok: 0,
        errors: []
    };

    try {
        // Fetch items with source_url from all modules
        const [aides, demarches, structures, dispositifs, ressources] = await Promise.all([
            prisma.aide.findMany({
                where: { 
                    statut: 'publie',
                    source_url: { not: null }
                },
                select: { id: true, source_url: true, titre: true },
                take: limit
            }),
            prisma.demarche.findMany({
                where: { 
                    statut: 'publie',
                    source_url_exact: { not: null }
                },
                select: { id: true, source_url_exact: true, titre: true },
                take: limit
            }),
            prisma.structure.findMany({
                where: { 
                    statut: 'publie',
                    source_url: { not: null }
                },
                select: { id: true, source_url: true, nom: true },
                take: limit
            }),
            prisma.dispositif.findMany({
                where: { 
                    statut: 'publie',
                    source_url_exact: { not: null }
                },
                select: { id: true, source_url_exact: true, titre: true },
                take: limit
            }),
            prisma.resourceAccessibility.findMany({
                where: { 
                    status: 'published',
                    source_url: { not: null }
                },
                select: { id: true, source_url: true, title: true },
                take: limit
            })
        ]);

        // Check each URL
        const checkUrl = async (url, entityType, entityId, title) => {
            stats.checked++;
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

                const response = await fetch(url, {
                    method: 'HEAD',
                    signal: controller.signal,
                    headers: {
                        'User-Agent': 'AccesDirectAide-LinkChecker/1.0'
                    }
                });

                clearTimeout(timeoutId);

                const isBroken = response.status >= 400;
                
                if (isBroken) {
                    stats.broken++;
                    logger.warn('LINK_CHECK_BROKEN', { 
                        entityType, 
                        entityId, 
                        title, 
                        url, 
                        status: response.status 
                    });
                } else {
                    stats.ok++;
                }

                // Store result in SourceSnapshot table
                await prisma.sourceSnapshot.create({
                    data: {
                        entity_type: entityType,
                        entity_id: entityId,
                        fetched_at: new Date(),
                        http_status: response.status,
                        final_url: url
                    }
                });

            } catch (error) {
                stats.broken++;
                stats.errors.push(`${entityType}:${entityId} - ${error.message}`);
                logger.error('LINK_CHECK_ERROR', { entityType, entityId, url, error: error.message });

                // Store error result
                await prisma.sourceSnapshot.create({
                    data: {
                        entity_type: entityType,
                        entity_id: entityId,
                        fetched_at: new Date(),
                        http_status: 0, // 0 indicates network error
                        final_url: url
                    }
                });
            }
        };

        // Process all items
        for (const aide of aides) {
            await checkUrl(aide.source_url, 'Aide', aide.id, aide.titre);
        }

        for (const demarche of demarches) {
            await checkUrl(demarche.source_url_exact, 'Demarche', demarche.id, demarche.titre);
        }

        for (const structure of structures) {
            await checkUrl(structure.source_url, 'Structure', structure.id, structure.nom);
        }

        for (const dispositif of dispositifs) {
            await checkUrl(dispositif.source_url_exact, 'Dispositif', dispositif.id, dispositif.titre);
        }

        for (const ressource of ressources) {
            await checkUrl(ressource.source_url, 'ResourceAccessibility', ressource.id, ressource.title);
        }

        logger.info('LINK_CHECK_END', { runId, stats });

        return res.status(200).json({
            success: true,
            runId,
            ...stats
        });

    } catch (error) {
        logger.error('LINK_CHECK_FATAL', { runId, error: error.message });
        return res.status(500).json({ 
            error: 'Link check failed', 
            details: error.message 
        });
    }
}
