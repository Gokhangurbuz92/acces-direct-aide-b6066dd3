import prisma from '../../_utils/prisma.js';
import { requireProAuth, requireProStructureContext } from '../../_utils/auth.js';
/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */

async function handler(req, res) {
    const proCtx = requireProStructureContext(req, res);
    if (!proCtx) return;

    // GET: Fetch availability
    if (req.method === 'GET') {
        try {
            const availability = await prisma.availability.findUnique({
                where: { structureId_proId: { structureId: proCtx.structureId, proId: proCtx.userId } }
            });

            // If not found, return defaults
            if (!availability) {
                return res.status(200).json({
                    slots_json: {
                        mon: ["09:00-12:00", "14:00-17:00"],
                        tue: ["09:00-12:00", "14:00-17:00"],
                        wed: ["09:00-12:00", "14:00-17:00"],
                        thu: ["09:00-12:00", "14:00-17:00"],
                        fri: ["09:00-12:00", "14:00-16:00"]
                    },
                    exceptions_json: []
                });
            }

            return res.status(200).json({
                slots_json: availability.slots_json,
                exceptions_json: availability.exceptions_json
            });
        } catch (e) {
            console.error(e);
            return res.status(500).json({ error: 'Internal Error' });
        }
    }

    // POST: Update availability
    if (req.method === 'POST') {
        const { slots_json, exceptions_json } = req.body;
        try {
            const availability = await prisma.availability.upsert({
                where: { structureId_proId: { structureId: proCtx.structureId, proId: proCtx.userId } },
                update: {
                    slots_json: slots_json,
                    exceptions_json: exceptions_json || []
                },
                create: {
                    structureId: proCtx.structureId,
                    proId: proCtx.userId,
                    slots_json: slots_json,
                    exceptions_json: exceptions_json || []
                }
            });
            return res.status(200).json(availability);
        } catch (e) {
            console.error(e);
            return res.status(500).json({ error: 'Internal Error' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

export default requireProAuth(handler);
