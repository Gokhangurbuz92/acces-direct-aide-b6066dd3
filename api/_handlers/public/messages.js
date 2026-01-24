
import { PrismaClient } from '@prisma/client';
import { hash, encrypt, decrypt } from '../../lib/crypto.js';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    try {
        const { token } = req.query;
        // Beneficiary accesses via `?token=...` (cancel_token or dedicated access_token).
        // Lot 6 spec says "secure token (magic link) OR OTP".
        // For MVP, we can reuse the cancel_token schema or a new derived token.
        // Schema now has `access_token_hash`.

        if (!token) return res.status(401).json({ error: "Unauthorized" });

        const tokenHash = hash(token);

        // Find appointment by access_token_hash OR cancel_token_hash (if we want to allow cancel link to also view messages?)
        // "Conversation is always tied to an Appointment".
        // Let's assume we look up by access_token_hash primarily.

        const appointment = await prisma.appointment.findFirst({
            where: {
                OR: [
                    { access_token_hash: tokenHash },
                    { cancel_token_hash: tokenHash }
                ]
            },
            include: { messages: { include: { attachments: true } } }
        });

        if (!appointment) return res.status(401).json({ error: "Invalid token" });

        // GET: List messages
        if (req.method === 'GET') {
            const messages = appointment.messages.map(m => ({
                id: m.id,
                sender: m.sender,
                content: decrypt(m.content_encrypted), // Decrypt for transport
                createdAt: m.createdAt,
                attachments: m.attachments.map(a => ({
                    id: a.id,
                    filename: decrypt(a.filename_encrypted),
                    mime_type: a.mime_type,
                    size: a.size_bytes
                }))
            }));

            // Return appointmentId for linking uploads
            return res.status(200).json({
                appointmentId: appointment.id,
                messages
            });
        }

        // POST: Send message
        if (req.method === 'POST') {
            const { content } = req.body;
            if (!content) return res.status(400).json({ error: "Empty message" });


            const encrypted = encrypt(content);

            const msg = await prisma.message.create({
                data: {
                    appointmentId: appointment.id,
                    sender: 'BENEFICIARY',
                    content_encrypted: encrypted
                }
            });

            return res.status(201).json({ success: true, messageId: msg.id });
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (error) {
        console.error("Public Message Error:", error);
        return res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
}
