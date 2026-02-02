import prisma from '../../../_utils/prisma.js';
import { verifyProToken, logProAudit } from '../../../lib/pro-auth.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Missing token" });
    }

    const decoded = verifyProToken(authHeader.split(' ')[1]);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });

    const { appointmentId, visio_url } = req.body;
    if (!appointmentId || !visio_url) {
        return res.status(400).json({ error: "Missing appointmentId or visio_url" });
    }

    try {
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId }
        });

        if (!appointment) return res.status(404).json({ error: "Appointment not found" });
        if (appointment.structureId !== decoded.structureId) {
            return res.status(403).json({ error: "Unauthorized access" });
        }

        const metadata = {
            ...(typeof appointment.metadata === 'object' ? appointment.metadata : {}),
            visio_url
        };

        await prisma.appointment.update({
            where: { id: appointmentId },
            data: {
                mode: 'visio',
                metadata
            }
        });

        await logProAudit('VISIO_LINK_UPDATED', decoded.userId, decoded.structureId, { appointmentId, visio_url }, req.headers['x-forwarded-for']);

        return res.status(200).json({ success: true, message: "Lien visio mis à jour" });

    } catch (e) {
        console.error('Visio update error:', e);
        return res.status(500).json({ error: "Internal Error" });
    }
}
