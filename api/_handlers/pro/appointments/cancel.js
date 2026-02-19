import prisma from '../../../_utils/prisma.js';
import { requireProAuth, requireProStructureContext } from '../../../_utils/auth.js';
/**
 * @param {import('../../../_utils/http-types').ApiRequest} req
 * @param {import('../../../_utils/http-types').ApiResponse} res
 */

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const proCtx = requireProStructureContext(req, res);
    if (!proCtx) return;

    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing appointment ID' });

    try {
        // 2. Verify Ownership & Existence
        const appointment = await prisma.appointment.findUnique({
            where: { id },
            include: { structure: true }
        });

        if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

        // Ensure the pro belongs to the structure of the appointment
        if (appointment.structureId !== proCtx.structureId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // 3. Update Status
        const updated = await prisma.appointment.update({
            where: { id },
            data: { status: 'cancelled' }
        });

        return res.status(200).json(updated);

    } catch (e) {
        console.error('Pro cancel error:', e);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

export default requireProAuth(handler);
