import logger from '../../../_utils/logger.js';
import { db } from '../../../../src/db/index.js';
import { ProAppointment } from '../../../../src/db/schema.js';
import { eq, and, gte, lte, count, asc } from 'drizzle-orm';
import { requireProAuth, requireProStructureContext } from '../../../_utils/auth.js';
/**
 * @param {import('../../../_utils/http-types').ApiRequest} req
 * @param {import('../../../_utils/http-types').ApiResponse} res
 */

async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const proCtx = requireProStructureContext(req, res);
        if (!proCtx) return;

        const page = parseInt(req.query.page) || 1;
        const pageSize = Math.min(parseInt(req.query.pageSize) || 20, 50); // Max 50
        const skip = (page - 1) * pageSize;

        const fromDate = req.query.from ? new Date(req.query.from) : undefined;
        const toDate = req.query.to ? new Date(req.query.to) : undefined;
        const status = req.query.status;

        const conditions = [eq(Appointment.structureId, proCtx.structureId)];
        if (fromDate) conditions.push(gte(Appointment.start_at, fromDate));
        if (toDate) conditions.push(lte(Appointment.start_at, toDate));
        if (status) conditions.push(eq(Appointment.status, status));
        const whereFilter = and(...conditions);

        const [totalRes, appointments] = await Promise.all([
            db.select({ value: count() }).from(Appointment).where(whereFilter),
            db.query.Appointment.findMany({
                where: whereFilter,
                offset: skip,
                limit: pageSize,
                orderBy: (a, { asc }) => [asc(a.start_at)],
                with: {
                    beneficiary: {
                        columns: { contact_hash: true, id: true }
                    },
                    service: {
                        columns: { name: true }
                    }
                }
            })
        ]);
        const total = totalRes[0]?.value || 0;

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
        logger.error('List appointments error:', e);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

export default requireProAuth(handler);
