import prisma from '../_utils/prisma.js';
import { checkRateLimit, getClientIp } from '../_utils/rateLimit.js';
import { logger } from '../lib/logger.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const taxonomyJson = require('../data/taxonomy.json');

// Build color lookup from taxonomy.json
const colorBySlug = {};
for (const cat of taxonomyJson) {
    colorBySlug[cat.slug] = cat.color || null;
}

/**
 * @param {import('../_utils/http-types').ApiRequest} req
 * @param {import('../_utils/http-types').ApiResponse} res
 */
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit('TAXONOMY', ip);
    if (!rateLimit.allowed) {
        return res.status(429).json(rateLimit.error);
    }

    try {
        const categories = await prisma.aidCategory.findMany({
            orderBy: { label: 'asc' },
            include: {
                _count: {
                    select: {
                        aides: { where: { statut: 'publie' } },
                        demarches: { where: { statut: 'publie' } }
                    }
                }
            }
        });

        const situations = await prisma.lifeSituation.findMany({
            orderBy: { label: 'asc' },
            include: {
                _count: {
                    select: {
                        aides: { where: { statut: 'publie' } },
                        demarches: { where: { statut: 'publie' } }
                    }
                }
            }
        });

        const aidSituations = await prisma.situation.findMany({
            orderBy: { label: 'asc' },
            include: {
                _count: {
                    select: {
                        aidRelations: { where: { aid: { statut: 'publie' } } }
                    }
                }
            }
        });

        return res.status(200).json({
            // Enriched taxonomy from JSON (12 standard categories with colors)
            taxonomy: taxonomyJson,
            categories: categories.map(c => ({
                id: c.id,
                slug: c.slug,
                label: c.label,
                color: colorBySlug[c.slug] || null,
                count: c._count.aides + c._count.demarches,
                aidesCount: c._count.aides,
                demarchesCount: c._count.demarches
            })),
            situations: situations.map(s => ({
                id: s.id,
                slug: s.slug,
                label: s.label,
                count: s._count.aides + s._count.demarches,
                aidesCount: s._count.aides,
                demarchesCount: s._count.demarches
            })),
            aidSituations: aidSituations.map(s => ({
                id: s.id,
                code: s.code,
                slug: s.code,
                label: s.label,
                count: s._count.aidRelations
            }))
        });
    } catch (error) {
        logger.error('Taxonomy API Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

