import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../../../lib/pro-auth.js';

const prisma = new PrismaClient();

async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = Math.min(parseInt(req.query.pageSize) || 20, 50); // Max 50
        const skip = (page - 1) * pageSize;

        const fromDate = req.query.from ? new Date(req.query.from) : undefined;
        const toDate = req.query.to ? new Date(req.query.to) : undefined;
        const status = req.query.status;

        const where = {
            structureId: req.user.structureId,
            ...(fromDate || toDate ? {
                start_at: {
                    ...(fromDate && { gte: fromDate }),
                    ...(toDate && { lte: toDate })
                }
            } : {}),
            ...(status ? { status } : {})
        };

        const [total, appointments] = await prisma.$transaction([
            prisma.appointment.count({ where }),
            prisma.appointment.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { start_at: 'asc' },
                include: {
                    beneficiary: {
                        select: {
                            contact_hash: true,
                            id: true
                        }
                    },
                    service: {
                        select: { name: true }
                    }
                }
            })
        ]);

        const items = appointments.map(app => ({
            id: app.id,
            start_at: app.start_at,
            end_at: app.end_at,
            status: app.status,
            serviceName: app.service?.name,
            beneficiary: {
                id: app.beneficiary.id,
                contactMasked: `...${app.beneficiary.contact_hash.slice(-4)}`
            }
        }));

        return res.status(200).json({
            items,
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize)
        });

    } catch (e) {
        console.error('List appointments error:', e);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

export default requireAuth(handler);
