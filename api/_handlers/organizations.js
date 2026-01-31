import { PrismaClient } from '@prisma/client';
import { checkRateLimit, getClientIp } from '../_utils/rateLimit.js';
import { searchOrganizationsSchema, searchEstablishmentsSchema } from '../_utils/validators.js';
import { searchOrganizations, searchEstablishments } from '../lib/search-query.js';

const prisma = new PrismaClient();

async function handler(req, res) {
    try {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const ip = getClientIp(req);
        const rateLimit = await checkRateLimit('SEARCH_ORGANIZATIONS', ip);
        if (!rateLimit.allowed) {
            return res.status(429).json(rateLimit.error);
        }

        // Check if requesting establishments for a specific organization
        const { organizationSlug } = req.query;
        
        if (organizationSlug && req.url.includes('/establishments')) {
            // Get establishments for this organization
            const organization = await prisma.organization.findFirst({
                where: { slug: organizationSlug, statut: 'publie' }
            });

            if (!organization) {
                return res.status(404).json({ error: 'Organization not found' });
            }

            const validation = searchEstablishmentsSchema.safeParse({
                ...req.query,
                organizationId: organization.id
            });

            if (!validation.success) {
                return res.status(400).json({ error: 'Invalid parameters', details: validation.error.format() });
            }

            const params = validation.data;
            const { items, total } = await searchEstablishments(prisma, params);

            return res.status(200).json({
                items,
                pagination: {
                    total,
                    page: params.page,
                    pageSize: params.pageSize,
                    totalPages: Math.ceil(total / params.pageSize)
                }
            });
        }

        // Validate Input for organizations
        const validation = searchOrganizationsSchema.safeParse(req.query);
        if (!validation.success) {
            return res.status(400).json({ error: 'Invalid parameters', details: validation.error.format() });
        }
        const params = validation.data;

        // 1. Single Item (ID or Slug)
        if (params.id || params.slug) {
            const organization = await prisma.organization.findFirst({
                where: params.id ? { id: params.id } : { slug: params.slug },
                include: {
                    _count: {
                        select: { establishments: { where: { statut: 'actif' } } }
                    }
                }
            });

            if (!organization || organization.statut !== 'publie') {
                return res.status(404).json({ error: "Organization not found" });
            }

            // Add establishmentCount to response
            const response = {
                ...organization,
                establishmentCount: organization._count.establishments
            };
            delete response._count;

            return res.status(200).json(response);
        }

        // 2. Search / List
        const { items, total } = await searchOrganizations(prisma, params);

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
        console.error('Organizations handler error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export default handler;
