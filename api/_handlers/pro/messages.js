import logger from '../../_utils/logger.js';
import { db } from '../../../src/db/index.js';
import { Appointment, Message } from '../../../src/db/schema.js';
import { eq, desc, and, ne, isNull, sql } from 'drizzle-orm';
import { requireProAuth, requireProStructureContext } from '../../_utils/auth.js';
import { encrypt, decrypt, generateAttachmentToken } from '../../lib/crypto.js';
import { storage } from '../../lib/storage.js';
/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */

async function handler(req, res) {
    // Auth handled by requireProAuth wrapper
    // req.user is populated
    const proCtx = requireProStructureContext(req, res);
    if (!proCtx) return;

    const { appointmentId, page = 1, pageSize = 50 } = req.query;
    if (!appointmentId) return res.status(400).json({ error: "Missing appointmentId" });

    // RBAC: Check structure ownership
    const appointment = await db.query.Appointment.findFirst({
        where: eq(Appointment.id, appointmentId)
    });

    if (!appointment) return res.status(404).json({ error: "Not found" });
    if (appointment.structureId !== proCtx.structureId) {
        return res.status(403).json({ error: "Forbidden: Different Structure" });
    }

    if (req.method === 'GET') {
        const pageInt = Math.max(1, parseInt(page));
        const limitInt = Math.min(100, Math.max(1, parseInt(pageSize)));

        const [messages, totalRes] = await Promise.all([
            db.query.Message.findMany({
                where: eq(Message.appointmentId, appointmentId),
                orderBy: [desc(Message.createdAt)],
                limit: limitInt,
                offset: (pageInt - 1) * limitInt,
                with: { attachments: true }
            }),
            db.select({ count: sql`count(*)` }).from(Message).where(eq(Message.appointmentId, appointmentId))
        ]);
        const total = Number(totalRes[0].count);

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

        const [msg] = await db.insert(Message).values({
                appointmentId: appointment.id,
                sender: 'PRO',
                content_encrypted: encrypt(content),
                read_at: null
        }).returning();

        return res.status(201).json({ success: true, messageId: msg.id });
    }

    if (req.method === 'PATCH') {
        // Mark as read
        const { action } = req.body;
        if (action === 'read_all') {
            await db.update(Message).set({ read_at: new Date() }).where(
                and(
                    eq(Message.appointmentId, appointment.id),
                    ne(Message.sender, 'PRO'),
                    isNull(Message.read_at)
                )
            );
            return res.status(200).json({ success: true });
        }
        return res.status(400).json({ error: "Invalid action" });
    }

    if (req.method === 'DELETE') {
        const { messageId } = req.body; // or query
        if (!messageId) return res.status(400).json({ error: "Missing messageId" });

        const message = await db.query.Message.findFirst({
            where: eq(Message.id, messageId),
            with: { attachments: true }
        });

        if (!message) return res.status(404).json({ error: "Message not found" });
        if (message.appointmentId !== appointment.id) return res.status(400).json({ error: "Message mismatch" });

        // Cleanup Storage
        if (message.attachments.length > 0) {
            for (const attachment of message.attachments) {
                await storage.delete(attachment.storage_key).catch(e => logger.error(`Failed to delete storage key ${attachment.storage_key}`, e));
            }
        }

        await db.delete(Message).where(eq(Message.id, messageId));
        return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
}

export default requireProAuth(handler);
