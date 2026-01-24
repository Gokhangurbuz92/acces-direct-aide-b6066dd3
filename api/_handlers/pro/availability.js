import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../../../lib/pro-auth.js';

const prisma = new PrismaClient();

async function handler(req, res) {
    // GET: Fetch availability
    if (req.method === 'GET') {
        try {
            const availability = await prisma.availability.findUnique({
                where: { structureId_proId: { structureId: req.user.structureId, proId: req.user.userId } }
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
                where: { structureId_proId: { structureId: req.user.structureId, proId: req.user.userId } },
                update: {
                    slots_json: slots_json,
                    exceptions_json: exceptions_json || []
                },
                create: {
                    structureId: req.user.structureId,
                    proId: req.user.userId,
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

export default requireAuth(handler);
