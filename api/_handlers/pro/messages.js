
import { PrismaClient } from '@prisma/client';
import { verifyProToken, checkRateLimit } from '../lib/pro-auth.js';
import { encrypt, decrypt } from '../lib/crypto.js';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    // Auth Check
    const auth = await verifyProToken(req);
    if (!auth) return res.status(401).json({ error: "Unauthorized" });

    const { appointmentId } = req.query; // ?appointmentId=...
    if (!appointmentId) return res.status(400).json({ error: "Missing appointmentId" });

    // RBAC: Check structure ownership
    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { messages: { include: { attachments: true } } }
    });

    if (!appointment) return res.status(404).json({ error: "Not found" });
    if (appointment.structureId !== auth.structureId) {
        return res.status(403).json({ error: "Forbidden: Different Structure" });
    }

    if (req.method === 'GET') {
        // List
        const messages = appointment.messages.map(m => ({
            id: m.id,
            sender: m.sender,
            content: decrypt(m.content_encrypted),
            createdAt: m.createdAt,
            attachments: m.attachments.map(a => ({
                id: a.id,
                filename: decrypt(a.filename_encrypted),
                mime_type: a.mime_type,
                size: a.size_bytes
            }))
        }));
        return res.status(200).json({ messages });
    }

    if (req.method === 'POST') {
        const { content } = req.body;
        if (!content) return res.status(400).json({ error: "Empty content" });

        const msg = await prisma.message.create({
            data: {
                appointmentId: appointment.id,
                sender: 'PRO',
                content_encrypted: encrypt(content)
            }
        });

        return res.status(201).json({ success: true, messageId: msg.id });
    }

    return res.status(405).json({ error: "Method not allowed" });
}
