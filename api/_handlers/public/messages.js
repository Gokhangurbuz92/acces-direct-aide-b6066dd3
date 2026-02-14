
import prisma from '../../_utils/prisma.js';
import { hash, encrypt, decrypt, generateAttachmentToken } from '../../lib/crypto.js';
/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */

export default async function handler(req, res) {
    try {
        const { token, page = 1, pageSize = 50 } = req.query;
        if (!token) return res.status(401).json({ error: "Unauthorized" });

        const tokenHash = hash(token);

        // Fetch Appointment
        const appointment = await prisma.appointment.findFirst({
            where: {
                OR: [
                    { access_token_hash: tokenHash },
                    { cancel_token_hash: tokenHash }
                ]
            }
        });

        if (!appointment) return res.status(401).json({ error: "Invalid token" });

        // GET: List messages
        if (req.method === 'GET') {
            const pageInt = Math.max(1, parseInt(page));
            const limitInt = Math.min(100, Math.max(1, parseInt(pageSize)));

            const [messages, total] = await Promise.all([
                prisma.message.findMany({
                    where: { appointmentId: appointment.id },
                    orderBy: { createdAt: 'desc' },
                    skip: (pageInt - 1) * limitInt,
                    take: limitInt,
                    include: { attachments: true }
                }),
                prisma.message.count({ where: { appointmentId: appointment.id } })
            ]);

            const mapped = messages.map(m => ({
                id: m.id,
                sender: m.sender,
                content: decrypt(m.content_encrypted), // Decrypt for transport
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

            // Return appointmentId for linking uploads
            return res.status(200).json({
                appointmentId: appointment.id,
                messages: mapped,
                pagination: {
                    page: pageInt,
                    pageSize: limitInt,
                    total,
                    totalPages: Math.ceil(total / limitInt)
                }
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
                    content_encrypted: encrypted,
                    read_at: null
                }
            });

            return res.status(201).json({ success: true, messageId: msg.id });
        }

        if (req.method === 'PATCH') {
            const { action } = req.body;
            if (action === 'read_all') {
                await prisma.message.updateMany({
                    where: {
                        appointmentId: appointment.id,
                        sender: 'PRO', // Mark messages from PRO as read
                        read_at: null
                    },
                    data: { read_at: new Date() }
                });
                return res.status(200).json({ success: true });
            }
            return res.status(400).json({ error: "Invalid action" });
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (error) {
        console.error("Public Message Error:", error);
        return res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
}
