import { PrismaClient } from '@prisma/client';
import { verifyProToken, logProAudit } from '../../lib/pro-auth.js';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Missing token" });
    }

    const decoded = verifyProToken(authHeader.split(' ')[1]);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });

    const { appointmentId, reason } = req.body;
    if (!appointmentId) return res.status(400).json({ error: "Missing appointmentId" });

    try {
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId }
        });

        if (!appointment) return res.status(404).json({ error: "Appointment not found" });

        // Tenant Isolation
        if (appointment.structureId !== decoded.structureId) {
            return res.status(403).json({ error: "Unauthorized access to this structure" });
        }

        await prisma.appointment.update({
            where: { id: appointmentId },
            data: {
                status: 'cancelled',
                // We could store the reason in a new field if we want, 
                // but status change is the priority.
            }
        });

        await logProAudit('APPOINTMENT_CANCELLED', decoded.userId, decoded.structureId, { appointmentId, reason }, req.headers['x-forwarded-for']);

        return res.status(200).json({ success: true, message: "Rendez-vous annulé" });
    } catch (e) {
        console.error('Cancellation error:', e);
        return res.status(500).json({ error: "Internal Error" });
    }
}
