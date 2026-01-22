
import { PrismaClient } from '@prisma/client';
import { verifyProToken, ROLE, logProAudit } from '../../lib/pro-auth.js';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Missing token" });
    }

    const decoded = verifyProToken(authHeader.split(' ')[1]);
    if (!decoded) {
        return res.status(401).json({ error: "Invalid token" });
    }

    const { structureId, role, userId } = decoded;

    // Only allow editing own availability or admin editing others?
    // Let's assume user edits their own for now.
    // Query param ?pro_id to edit specific user (if admin)

    // For MVP: Edit MY availability.
    const targetProId = userId;

    try {
        if (req.method === 'GET') {
            const avail = await prisma.availability.findUnique({
                where: { structureId_proId: { structureId, proId: targetProId } }
            });

            return res.status(200).json(avail || { slots_json: {}, exceptions_json: [] });

        } else if (req.method === 'PUT') {
            const { slots, exceptions } = req.body; // slots = { mon: [] }, exceptions = []

            const avail = await prisma.availability.upsert({
                where: { structureId_proId: { structureId, proId: targetProId } },
                update: {
                    slots_json: slots || {},
                    exceptions_json: exceptions || []
                },
                create: {
                    structureId,
                    proId: targetProId,
                    slots_json: slots || {},
                    exceptions_json: exceptions || []
                }
            });

            await logProAudit('AVAILABILITY_UPDATED', userId, structureId, {}, req.socket.remoteAddress);
            return res.status(200).json(avail);
        } else {
            return res.status(405).json({ error: "Method not allowed" });
        }

    } catch (e) {
        console.error("Availability API Error", e);
        return res.status(500).json({ error: "Internal Error" });
    }
}
