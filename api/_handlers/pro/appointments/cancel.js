
import { PrismaClient } from '@prisma/client';
import { verifyProToken } from '../../../lib/pro-auth.js';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 1. Auth Check
    let token = null;
    if (req.headers && req.headers.authorization) {
        token = req.headers.authorization.replace('Bearer ', '');
    }
    const user = verifyProToken(token);
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

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
        if (appointment.structureId !== user.structureId) {
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
