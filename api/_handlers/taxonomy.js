import { PrismaClient } from '@prisma/client';
import { checkRateLimit, getClientIp } from '../_utils/rateLimit.js';

const prisma = new PrismaClient();

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

        return res.status(200).json({
            categories: categories.map(c => ({
                id: c.id,
                slug: c.slug,
                label: c.label,
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
            }))
        });
    } catch (error) {
        console.error('Taxonomy API Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
