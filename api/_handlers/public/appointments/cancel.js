
import { PrismaClient } from '@prisma/client';
import { hash } from '../../lib/crypto.js';
import { checkRateLimit } from '../../lib/pro-auth.js';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    // Rate Limit (IP based)
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const limit = await checkRateLimit(`cancel:${ip}`);
    if (!limit.allowed) return res.status(429).json({ error: "Too many attempts" });

    const { token } = req.query; // or body
    if (!token) return res.status(400).json({ error: "Missing token" });

    const tokenHash = hash(token);

    try {
        // Find appointment by hash
        // We indexed cancel_token_hash
        // findFirst is adequate
        const appointment = await prisma.appointment.findFirst({
            where: { cancel_token_hash: tokenHash }
        });

        if (!appointment) {
            return res.status(404).json({ error: "Invalid or used token" });
        }

        if (appointment.status === 'cancelled') {
            return res.status(200).json({ message: "Already cancelled" });
        }

        // Update
        await prisma.appointment.update({
            where: { id: appointment.id },
            data: { status: 'cancelled' }
        });

        // Audit
        await prisma.auditLog.create({
            data: {
                action: 'BOOK_CANCELLED_PUBLIC',
                actor: 'beneficiary',
                entity: 'Appointment',
                entity_id: appointment.id,
                details: { structureId: appointment.structureId }
            }
        });

        return res.status(200).json({ success: true, message: "Appointment cancelled" });

    } catch (e) {
        console.error("Cancel API Error", e);
        return res.status(500).json({ error: "Cancellation failed" });
    }
}
