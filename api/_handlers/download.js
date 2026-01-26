
/* eslint-env node */
import { PrismaClient } from '@prisma/client';
import { verifyAttachmentToken, decrypt, decryptBuffer } from '../lib/crypto.js';
import { storage } from '../lib/storage.js';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: "Method not allowed" });

    const { token } = req.query;
    if (!token) return res.status(401).json({ error: "Missing token" });

    const attachmentId = verifyAttachmentToken(token);
    if (!attachmentId) return res.status(403).json({ error: "Invalid or expired token" });

    try {
        const attachment = await prisma.attachment.findUnique({
            where: { id: attachmentId }
        });

        if (!attachment) return res.status(404).json({ error: "Attachment not found" });

        // Fetch from storage
        const encryptedBuffer = await storage.download(attachment.storage_key);

        // Decrypt
        const fileBuffer = decryptBuffer(encryptedBuffer);
        if (!fileBuffer) return res.status(500).json({ error: "Decryption failed" });

        const filename = decrypt(attachment.filename_encrypted) || 'file';

        res.setHeader('Content-Type', attachment.mime_type);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', fileBuffer.length);

        return res.send(fileBuffer);

    } catch (e) {
        console.error("Download Error:", e);
        // Don't leak internal errors to user, but 404/500 is fine
        if (e.message.includes('File not found')) return res.status(404).json({ error: "File not found on server" });
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
