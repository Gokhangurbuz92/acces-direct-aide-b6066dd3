import prisma from '../_utils/prisma.js';
import { checkRateLimit, getClientIp } from '../_utils/rateLimit.js';
import { logger } from '../lib/logger.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load static taxonomy
let staticTaxonomy = null;
try {
    const taxonomyPath = join(__dirname, '../../config/taxonomy.json');
    staticTaxonomy = JSON.parse(readFileSync(taxonomyPath, 'utf-8'));
} catch (error) {
    logger.warn('Failed to load static taxonomy, will use DB only', { error: error.message });
}

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Rate Limit
    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit('TAXONOMY', ip);
    if (!rateLimit.allowed) {
        return res.status(429).json(rateLimit.error);
    }

    try {
        // Fetch DB categories with counts
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

        // Merge with static taxonomy if available
        let enrichedCategories = categories.map(c => ({
            id: c.id,
            slug: c.slug,
            label: c.label,
            count: c._count.aides + c._count.demarches,
            aidesCount: c._count.aides,
            demarchesCount: c._count.demarches
        }));

        if (staticTaxonomy) {
            // Add static categories that might not be in DB yet
            const dbSlugs = new Set(enrichedCategories.map(c => c.slug));
            staticTaxonomy.categories.forEach(staticCat => {
                if (!dbSlugs.has(staticCat.slug)) {
                    enrichedCategories.push({
                        slug: staticCat.slug,
                        label: staticCat.label,
                        description: staticCat.description,
                        icon: staticCat.icon,
                        subThemes: staticCat.subThemes,
                        count: 0,
                        aidesCount: 0,
                        demarchesCount: 0
                    });
                } else {
                    // Enrich existing with static data
                    const existing = enrichedCategories.find(c => c.slug === staticCat.slug);
                    if (existing) {
                        existing.description = staticCat.description;
                        existing.icon = staticCat.icon;
                        existing.subThemes = staticCat.subThemes;
                    }
                }
            });
        }

        return res.status(200).json({
            categories: enrichedCategories,
            situations: situations.map(s => ({
                id: s.id,
                slug: s.slug,
                label: s.label,
                count: s._count.aides + s._count.demarches,
                aidesCount: s._count.aides,
                demarchesCount: s._count.demarches
            })),
            publics: staticTaxonomy?.publics || [],
            territoires: staticTaxonomy?.territoires || [],
            organismes: staticTaxonomy?.organismes || []
        });
    } catch (error) {
        logger.error('Taxonomy API Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
