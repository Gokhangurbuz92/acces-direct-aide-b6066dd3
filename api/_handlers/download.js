
import { PrismaClient } from '@prisma/client';
import { hash, decrypt, decryptBuffer } from '../lib/crypto.js';
import { storage } from '../lib/storage.js';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: "Method not allowed" });

    try {
        const { id, token } = req.query; // Attachment ID and Token
        if (!id) return res.status(400).json({ error: "Missing attachment ID" });

        // Fetch attachment meta
        const attachment = await prisma.attachment.findUnique({
            where: { id },
            include: { message: { include: { appointment: true } } }
        });

        if (!attachment) return res.status(404).json({ error: "Attachment not found" });

        // Access Control
        // 1. If Token provided -> Check Beneficiary Access
        // 2. If No Token -> Check Pro Session (TODO: Implement real session check, for now allow if role=PRO upstream)
        // For MVP: We require token for Public.
        // For Pro: We assume "Authorization" header is checked by middleware or we check it here?
        // Let's implement basics: Secure Token check for Beneficiary.

        let authorized = false;

        const appointment = attachment.message.appointment;

        if (token) {
            const tokenHash = hash(token);
            if (appointment.access_token_hash === tokenHash || appointment.cancel_token_hash === tokenHash) {
                authorized = true;
            }
        } else {
            // Check Pro Headers?
            // If request comes from Pro dashboard, it should have Auth.
            // Simplified: If no token, return 401 for now. Pro authentication to be added in Lot 5/Integration.
            // Or we can check a simple "pro_token" query param if we had one.
            // Let's stick to Beneficiary Token access for Verification logic.
        }

        if (!authorized) return res.status(403).json({ error: "Forbidden" });

        // Download from Storage
        // Storage returns Buffer (Local Mock)
        const encryptedBuffer = await storage.download(attachment.storage_key);

        // Decrypt
        const fileBuffer = decryptBuffer(encryptedBuffer);
        if (!fileBuffer) return res.status(500).json({ error: "Decryption Failed" });

        // Serve
        const filename = decrypt(attachment.filename_encrypted) || "document";

        res.setHeader('Content-Type', attachment.mime_type);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', fileBuffer.length);

        res.end(fileBuffer);

    } catch (e) {
        console.error("Download Error:", e);
        res.status(500).json({ error: "Internal Server Error" });
    }
}
