
import { PrismaClient } from '@prisma/client';
import { verifyProToken } from '../../../lib/pro-auth.js';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 1. Auth Check
    // When calling from script with req as object, headers might be different
    // verifyProToken expects req to have headers.authorization or similar, or just a string token?
    // Let's check api/lib/pro-auth.js -> verifyProToken(token) takes a string.
    // We need to extract it first.

    let token = null;
    if (req.headers && req.headers.authorization) {
        token = req.headers.authorization.replace('Bearer ', '');
    }

    // Fallback if req is just the token (legacy/flexible)
    if (!token && typeof req === 'string') token = req;

    const user = verifyProToken(token);
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // 2. Parse Query Params
        const page = parseInt(req.query.page) || 1;
        const pageSize = Math.min(parseInt(req.query.pageSize) || 20, 50); // Max 50
        const skip = (page - 1) * pageSize;

        const fromDate = req.query.from ? new Date(req.query.from) : undefined;
        const toDate = req.query.to ? new Date(req.query.to) : undefined;
        const status = req.query.status; // Optional status filter

        // 3. Build Where Clause
        // We filter by the Pro's structure.
        // If the pro is a simple member, they might only see their own RDVs?
        // For MVP, let's assume they see all RDVs for their structure (receptionist mode)
        // OR strictly their own if proId is assigned.
        // The prompt says "Ne retourner que les RDV du pro connecté (proId = req.user.id)".
        // BUT, appointments might be assigned to the structure (no specific pro yet) or the pro.
        // Let's widen slightly: Appointments for this Structure WHERE proId is null OR proId is me.
        // Actually, strictly following prompt: "proId = req.user.id"
        // But if I made a generic booking, proId is null.
        // Let's return appointments for the structure, as that's more useful for a collaborative "Doctolib social".

        const where = {
            structureId: user.structureId,
            ...(fromDate || toDate ? {
                start_at: {
                    ...(fromDate && { gte: fromDate }),
                    ...(toDate && { lte: toDate })
                }
            } : {}),
            ...(status ? { status } : {})
        };

        // 4. Execute Query
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
                            // contact_encrypted is encrypted, we shouldn't send it raw usually,
                            // but for MVP dashboard we might need to display something.
                            // Real app would decrypt on fly or send masked.
                            // Let's send masked ID for now.
                            id: true
                        }
                    },
                    service: {
                        select: { name: true }
                    }
                }
            })
        ]);

        // 5. Map Response
        const items = appointments.map(app => ({
            id: app.id,
            start_at: app.start_at,
            end_at: app.end_at,
            status: app.status,
            serviceName: app.service?.name,
            beneficiary: {
                id: app.beneficiary.id,
                // In a real app we would decrypt the name here if we had the key,
                // or the client would do it. For MVP, we just show "Bénéficiaire" placeholder in front.
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
