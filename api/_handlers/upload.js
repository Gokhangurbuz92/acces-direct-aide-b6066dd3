import logger from '../_utils/logger.js';
import busboy from 'busboy';
import { encryptBuffer, encrypt, hash } from '../lib/crypto.js';
import { storage } from '../lib/storage.js';
import prisma from '../_utils/prisma.js';
import { verifyProToken } from '../lib/pro-auth.js';

export const config = {
    api: {
        bodyParser: false,
    },
};
/**
 * @param {import('../_utils/http-types').ApiRequest} req
 * @param {import('../_utils/http-types').ApiResponse} res
 */

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

    const bb = busboy({ headers: req.headers, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

    const fields = {};
    let fileBuffer = null;
    let fileName = null;
    let mimeType = null;

    return new Promise((resolve) => {
        bb.on('field', (name, val) => {
            fields[name] = val;
        });

        bb.on('file', (name, file, info) => {
            const { filename, mimeType: mime } = info;

            // Allow only specific types
            const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            if (!allowed.includes(mime)) {
                file.resume();
                mimeType = 'INVALID';
            } else {
                fileName = filename;
                mimeType = mime;
            }

            const chunks = [];
            file.on('data', c => chunks.push(c));
            file.on('end', () => {
                if (mimeType !== 'INVALID') {
                    fileBuffer = Buffer.concat(chunks);
                }
            });
        });

        bb.on('close', async () => {
            try {
                if (mimeType === 'INVALID') return resolve(res.status(400).json({ error: "Invalid file type. Only PDF/JPG/PNG allowed." }));
                if (!fileBuffer) return resolve(res.status(400).json({ error: "No file provided" }));
                if (!fields.appointmentId) return resolve(res.status(400).json({ error: "Missing appointmentId" }));

                const { appointmentId, access_token } = fields;

                // Fetch Appointment first to check logic
                const appointment = await prisma.appointment.findUnique({
                    where: { id: appointmentId }
                });

                if (!appointment) return resolve(res.status(404).json({ error: "Appointment not found" }));

                let senderRole = null;

                // 1. Try Pro Auth
                const authHeader = req.headers?.authorization || req.headers?.Authorization || '';
                const match = String(authHeader || '').match(/^Bearer\s+(.+)$/i);
                const token = match ? match[1] : null;
                const proAuth = token ? verifyProToken(token) : null;
                if (proAuth) {
                    if (appointment.structureId !== proAuth.structureId) {
                        return resolve(res.status(403).json({ error: "Forbidden: Different Structure" }));
                    }
                    senderRole = 'PRO';
                }

                // 2. Try Beneficiary Auth if not Pro
                if (!senderRole) {
                    if (!access_token) return resolve(res.status(401).json({ error: "Unauthorized" }));
                    const tokenHash = hash(access_token);
                    if (appointment.access_token_hash !== tokenHash) {
                        return resolve(res.status(401).json({ error: "Invalid token" }));
                    }
                    senderRole = 'BENEFICIARY';
                }

                // Encrypt File
                const encryptedBuffer = encryptBuffer(fileBuffer);

                // Store Blob
                const storageKey = await storage.upload(encryptedBuffer, mimeType);

                // Create Message + Attachment
                const message = await prisma.message.create({
                    data: {
                        appointmentId: appointment.id,
                        sender: senderRole,
                        content_encrypted: encrypt("[Pièce jointe]"),
                        read_at: null, // Unread by default
                        attachments: {
                            create: {
                                filename_encrypted: encrypt(fileName),
                                mime_type: mimeType,
                                size_bytes: fileBuffer.length,
                                storage_key: storageKey
                            }
                        }
                    },
                    include: { attachments: true }
                });

                return resolve(res.status(201).json({ success: true, messageId: message.id, attachment: message.attachments[0] }));

            } catch (e) {
                logger.error("Upload Error:", e);
                return resolve(res.status(500).json({ error: "Server Error" }));
            }
        });

        req.pipe(bb);
    });
}
