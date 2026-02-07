import prisma from '../../_utils/prisma.js';
import { verifyProToken, checkRateLimit, requireAuth } from '../../lib/pro-auth.js';
import { encrypt, decrypt, generateAttachmentToken } from '../../lib/crypto.js';
import { storage } from '../../lib/storage.js';

async function handler(req, res) {
    // Auth handled by requireAuth wrapper
    // req.user is populated

    const { appointmentId, page = 1, pageSize = 50 } = req.query;
    if (!appointmentId) return res.status(400).json({ error: "Missing appointmentId" });

    // RBAC: Check structure ownership
    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId }
    });

    if (!appointment) return res.status(404).json({ error: "Not found" });
    if (appointment.structureId !== req.user.structureId) {
        return res.status(403).json({ error: "Forbidden: Different Structure" });
    }

    if (req.method === 'GET') {
        const pageInt = Math.max(1, parseInt(page));
        const limitInt = Math.min(100, Math.max(1, parseInt(pageSize)));

        const [messages, total] = await Promise.all([
            prisma.message.findMany({
                where: { appointmentId },
                orderBy: { createdAt: 'desc' },
                skip: (pageInt - 1) * limitInt,
                take: limitInt,
                include: { attachments: true }
            }),
            prisma.message.count({ where: { appointmentId } })
        ]);

        const mapped = messages.map(m => ({
            id: m.id,
            sender: m.sender,
            content: decrypt(m.content_encrypted),
            createdAt: m.createdAt,
            read_at: m.read_at,
            attachments: m.attachments.map(a => ({
                id: a.id,
                filename: decrypt(a.filename_encrypted),
                mime_type: a.mime_type,
                size: a.size_bytes,
                downloadUrl: `/api/download?token=${generateAttachmentToken(a.id)}`
            }))
        }));

        return res.status(200).json({
            messages: mapped,
            pagination: {
                page: pageInt,
                pageSize: limitInt,
                total,
                totalPages: Math.ceil(total / limitInt)
            }
        });
    }

    if (req.method === 'POST') {
        const { content } = req.body;
        if (!content) return res.status(400).json({ error: "Empty content" });

        const msg = await prisma.message.create({
            data: {
                appointmentId: appointment.id,
                sender: 'PRO',
                content_encrypted: encrypt(content),
                read_at: null
            }
        });

        return res.status(201).json({ success: true, messageId: msg.id });
    }

    if (req.method === 'PATCH') {
        // Mark as read
        const { action } = req.body;
        if (action === 'read_all') {
            await prisma.message.updateMany({
                where: {
                    appointmentId: appointment.id,
                    sender: { not: 'PRO' }, // Mark messages from Beneficiary as read
                    read_at: null
                },
                data: { read_at: new Date() }
            });
            return res.status(200).json({ success: true });
        }
        return res.status(400).json({ error: "Invalid action" });
    }

    if (req.method === 'DELETE') {
        const { messageId } = req.body; // or query
        if (!messageId) return res.status(400).json({ error: "Missing messageId" });

        const message = await prisma.message.findUnique({
            where: { id: messageId },
            include: { attachments: true }
        });

        if (!message) return res.status(404).json({ error: "Message not found" });
        if (message.appointmentId !== appointment.id) return res.status(400).json({ error: "Message mismatch" });

        // Cleanup Storage
        if (message.attachments.length > 0) {
            for (const attachment of message.attachments) {
                await storage.delete(attachment.storage_key).catch(e => console.error(`Failed to delete storage key ${attachment.storage_key}`, e));
            }
        }

        await prisma.message.delete({ where: { id: messageId } });
        return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
}

export default requireAuth(handler);
