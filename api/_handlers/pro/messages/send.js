import logger from '../../../_utils/logger.js';
import { db } from '../../../../src/db/index.js';
import { ProMessage } from '../../../../src/db/schema.js';
import { eq, desc, asc } from 'drizzle-orm';
import { requireProAuth, requireProStructureContext } from '../../../_utils/auth.js';
import { encryptMessage, decryptMessage } from '../../../lib/messaging-crypto.js';

/**
 * Pro Messages — Send (G3/G4)
 *
 * POST /api/pro/messages/send
 * Body: { conversationId, content }
 *
 * Encrypts content with AES-256-GCM and persists to ProMessage.
 *
 * GET /api/pro/messages/send?conversationId=xxx&page=1&limit=50
 *
 * Returns decrypted messages for a conversation.
 */
async function handler(req, res) {
    const proCtx = requireProStructureContext(req, res);
    if (!proCtx) return;

    if (req.method === 'POST') {
        const { conversationId, content } = req.body || {};

        if (!conversationId || !content) {
            return res.status(400).json({ error: 'conversationId et content requis.' });
        }

        if (typeof content !== 'string' || content.trim().length === 0) {
            return res.status(400).json({ error: 'Le contenu du message ne peut pas être vide.' });
        }

        try {
            const { content: encrypted, iv } = encryptMessage(content.trim());

            const [message] = await db.insert(ProMessage).values({
                    conversationId,
                    senderId: proCtx.userId,
                    contentEncrypted: encrypted,
                    iv,
            }).returning();

            return res.status(201).json({
                ok: true,
                messageId: message.id,
                createdAt: message.createdAt,
            });
        } catch (error) {
            logger.error({ err: error }, '[ProMessage] Erreur d\'envoi');
            return res.status(500).json({ error: 'Impossible d\'envoyer le message.' });
        }
    }

    if (req.method === 'GET') {
        const url = new URL(req.url || '/', `https://${req.headers?.host || 'localhost'}`);
        const conversationId = url.searchParams.get('conversationId');

        if (!conversationId) {
            return res.status(400).json({ error: 'conversationId requis.' });
        }

        const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)));

        try {
            const [messages, totalCountObj] = await Promise.all([
                db.query.ProMessage.findMany({
                    where: eq(ProMessage.conversationId, conversationId),
                    orderBy: [asc(ProMessage.createdAt)],
                    limit: limit,
                    offset: (page - 1) * limit,
                }),
                db.execute(db.select({ count: sql`count(*)` }).from(ProMessage).where(eq(ProMessage.conversationId, conversationId)))
            ]);
            const totalCount = Number(totalCountObj.rows ? totalCountObj.rows[0].count : totalCountObj[0].count);

            const items = messages.map((m) => ({
                id: m.id,
                senderId: m.senderId,
                content: decryptMessage(m.contentEncrypted, m.iv),
                createdAt: m.createdAt,
                readAt: m.readAt,
            }));

            return res.status(200).json({
                ok: true,
                messages: items,
                pagination: {
                    page,
                    limit,
                    totalCount,
                    totalPages: Math.ceil(totalCount / limit),
                },
            });
        } catch (error) {
            logger.error({ err: error }, '[ProMessage] Erreur de lecture');
            return res.status(500).json({ error: 'Impossible de charger les messages.' });
        }
    }

    return res.status(405).json({ error: 'Méthode non autorisée' });
}

export default requireProAuth(handler);
