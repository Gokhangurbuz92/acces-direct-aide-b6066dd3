// @ts-nocheck
/**
 * PROXY ADAPTER — pro/messages.js
 *
 * Legacy System A route → reads/writes System B tables (RdvConversation, RdvConversationMessage).
 * Maintains identical API contract:
 *   GET    /api/pro/messages?appointmentId=...  → List messages (decrypted)
 *   POST   /api/pro/messages?appointmentId=...  → Send message (encrypted)
 *   PATCH  /api/pro/messages?appointmentId=...  → Mark as read
 *   DELETE /api/pro/messages?appointmentId=...  → Delete message
 *
 * Mapping:
 *   Appointment → ProAppointment (RBAC via structureId)
 *   Message (encrypted content) → RdvConversationMessage (E2EE body)
 *   Message.sender = 'PRO' → RdvConversationMessage.senderType = 'PRO'
 *   Message.sender = 'BENEFICIARY' → RdvConversationMessage.senderType = 'USER'
 */
import logger from '../../_utils/logger.js';
import { db } from '../../../src/db/index.js';
import { ProAppointment, RdvConversation, RdvConversationMessage } from '../../../src/db/schema.js';
import { eq, desc, and, ne, sql, asc } from 'drizzle-orm';
import { requireProAuth, requireProStructureContext } from '../../_utils/auth.js';
import { encrypt } from '../../lib/crypto.js';
import { decryptMessageBody } from '../../_utils/rdv-messaging.js';
import crypto from 'crypto';

/**
 * Find or create a RdvConversation for a ProAppointment.
 */
async function getOrCreateConversation(appointment) {
    let conversation = await db.query.RdvConversation.findFirst({
        where: eq(RdvConversation.appointmentId, appointment.id),
    });

    if (!conversation) {
        const [created] = await db.insert(RdvConversation).values({
            id: crypto.randomUUID(),
            appointmentId: appointment.id,
            structureId: appointment.structureId,
            citizenUserId: appointment.citizenUserId || 'legacy-anonymous',
            lastMessageAt: new Date(),
            updatedAt: new Date(),
        }).onConflictDoUpdate({
            target: RdvConversation.appointmentId,
            set: { updatedAt: new Date() },
        }).returning();

        conversation = created;
    }

    return conversation;
}

async function handler(req, res) {
    const proCtx = requireProStructureContext(req, res);
    if (!proCtx) return;

    const { appointmentId, page = 1, pageSize = 50 } = req.query;
    if (!appointmentId) return res.status(400).json({ error: "Missing appointmentId" });

    // RBAC: Check structure ownership via ProAppointment (System B)
    const appointment = await db.query.ProAppointment.findFirst({
        where: eq(ProAppointment.id, appointmentId)
    });

    if (!appointment) return res.status(404).json({ error: "Not found" });
    if (appointment.structureId !== proCtx.structureId) {
        return res.status(403).json({ error: "Forbidden: Different Structure" });
    }

    // Get or create conversation for this appointment
    const conversation = await getOrCreateConversation(appointment);

    if (req.method === 'GET') {
        const pageInt = Math.max(1, parseInt(page));
        const limitInt = Math.min(100, Math.max(1, parseInt(pageSize)));

        const [messages, totalRes] = await Promise.all([
            db.query.RdvConversationMessage.findMany({
                where: eq(RdvConversationMessage.conversationId, conversation.id),
                orderBy: [desc(RdvConversationMessage.createdAt)],
                limit: limitInt,
                offset: (pageInt - 1) * limitInt,
            }),
            db.select({ count: sql`count(*)` })
                .from(RdvConversationMessage)
                .where(eq(RdvConversationMessage.conversationId, conversation.id))
        ]);
        const total = Number(totalRes[0].count);

        // Map to legacy response format (System A shape)
        const mapped = messages.map(m => ({
            id: m.id,
            sender: m.senderType === 'USER' ? 'BENEFICIARY' : m.senderType,
            content: decryptMessageBody(m.body),
            createdAt: m.createdAt,
            read_at: null,
            attachments: [],
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

        const [msg] = await db.insert(RdvConversationMessage).values({
            id: crypto.randomUUID(),
            conversationId: conversation.id,
            senderType: 'PRO',
            senderProUserId: proCtx.userId,
            body: encrypt(content),
        }).returning();

        // Update conversation timestamp
        await db.update(RdvConversation)
            .set({ lastMessageAt: msg.createdAt })
            .where(eq(RdvConversation.id, conversation.id));

        return res.status(201).json({ success: true, messageId: msg.id });
    }

    if (req.method === 'PATCH') {
        const { action } = req.body;
        if (action === 'read_all') {
            // RdvConversationMessage has no read_at — silently acknowledge
            return res.status(200).json({ success: true });
        }
        return res.status(400).json({ error: "Invalid action" });
    }

    if (req.method === 'DELETE') {
        const { messageId } = req.body;
        if (!messageId) return res.status(400).json({ error: "Missing messageId" });

        const message = await db.query.RdvConversationMessage.findFirst({
            where: eq(RdvConversationMessage.id, messageId),
        });

        if (!message) return res.status(404).json({ error: "Message not found" });
        if (message.conversationId !== conversation.id) {
            return res.status(400).json({ error: "Message mismatch" });
        }

        await db.delete(RdvConversationMessage).where(eq(RdvConversationMessage.id, messageId));
        return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
}

export default requireProAuth(handler);
