import logger from '../_utils/logger.js';
// @ts-nocheck
import prisma from '../_utils/prisma.js';

/**
 * Secure Messages API Handler
 *
 * Handles E2EE encrypted messages. The server only stores opaque blobs —
 * it never sees plaintext content (Zero-Knowledge).
 *
 * GET  /api/secure-messages?shareId=...  → List encrypted messages
 * POST /api/secure-messages               → Store a new encrypted message
 */
export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // ─── GET: List messages by shareId ───
        if (req.method === 'GET') {
            const url = new URL(req.url || '/', `https://${req.headers?.host || 'localhost'}`);
            const shareId = url.searchParams.get('shareId');

            if (!shareId) {
                return res.status(400).json({ error: 'Identifiant de partage requis' });
            }

            const messages = await prisma.rdvConversationMessage.findMany({
                where: {
                    conversationId: shareId,
                },
                orderBy: { createdAt: 'asc' },
                take: 50,
                select: {
                    id: true,
                    senderType: true,
                    senderCitizenUserId: true,
                    senderProUserId: true,
                    body: true,
                    createdAt: true,
                },
            });

            // Map to E2EE-compatible shape — `body` holds the encrypted blob
            const items = messages.map((m) => ({
                id: m.id,
                senderId: m.senderCitizenUserId || m.senderProUserId || m.senderType,
                encryptedContent: m.body,
                createdAt: m.createdAt,
            }));

            return res.status(200).json({ ok: true, items });
        }

        // ─── POST: Store a new encrypted message ───
        if (req.method === 'POST') {
            const { shareId, senderId, receiverId, encryptedContent } = req.body || {};

            if (!shareId || !encryptedContent) {
                return res.status(400).json({ error: 'Contenu ou identifiant manquant' });
            }

            // Verify conversation exists
            const conversation = await prisma.rdvConversation.findUnique({
                where: { id: shareId },
            });

            if (!conversation) {
                return res.status(404).json({ error: 'Conversation introuvable' });
            }

            // Determine sender type based on who's sending
            const isCitizen = conversation.citizenUserId === senderId;
            const senderType = isCitizen ? 'USER' : 'PRO';

            const newMessage = await prisma.rdvConversationMessage.create({
                data: {
                    conversationId: shareId,
                    senderType,
                    senderCitizenUserId: isCitizen ? senderId : null,
                    senderProUserId: !isCitizen ? senderId : null,
                    body: encryptedContent, // Opaque encrypted blob — server cannot read
                },
            });

            // Update conversation timestamp
            await prisma.rdvConversation.update({
                where: { id: shareId },
                data: { lastMessageAt: newMessage.createdAt },
            });

            return res.status(201).json({
                ok: true,
                item: {
                    id: newMessage.id,
                    senderId,
                    createdAt: newMessage.createdAt,
                },
            });
        }

        return res.status(405).json({ error: 'Méthode non autorisée' });
    } catch (error) {
        logger.error('[API Secure Messages] Erreur:', error);
        return res.status(500).json({ error: 'Erreur serveur interne' });
    }
}
