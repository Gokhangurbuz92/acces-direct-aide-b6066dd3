import logger from '../../../_utils/logger.js';
// @ts-nocheck
import prisma from '../../../_utils/prisma.js';
import { requireProAuth, requireProStructureContext } from '../../../_utils/auth.js';
import { logProAudit } from '../../../lib/pro-auth.js';
/**
 * Secure File Upload Handler (Pro-only)
 *
 * POST /api/pro/dossier/upload-secure
 *
 * Stores encrypted file metadata in DB. The actual encrypted blob
 * would be stored in Cloudflare R2 or equivalent object storage.
 * For now, we store metadata + mark the upload in AuditLog.
 *
 * Body (multipart/form-data):
 * - file: encrypted blob
 * - shareId: dossier share ID
 * - originalName: original filename
 * - mimeType: original MIME type
 */
async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const proCtx = requireProStructureContext(req, res);
    if (!proCtx) return;

    try {
        const { shareId, originalName, mimeType } = req.body || {};

        if (!shareId || !originalName) {
            return res.status(400).json({ error: 'shareId et originalName requis.' });
        }

        // Verify the shared diagnostic exists
        const shared = await prisma.sharedDiagnostic.findUnique({
            where: { id: shareId },
        });

        if (!shared) {
            return res.status(404).json({ error: 'Dossier introuvable.' });
        }

        if (new Date() > new Date(shared.expiresAt)) {
            return res.status(410).json({ error: 'Ce dossier a expiré.' });
        }

        // Store file metadata in the results JSON
        const currentResults = shared.results || {};
        const existingFiles = currentResults._files || [];

        const fileEntry = {
            id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            originalName,
            mimeType: mimeType || 'application/octet-stream',
            uploadedAt: new Date().toISOString(),
            sizeHint: req.headers?.['content-length'] || null,
            encrypted: true,
        };

        existingFiles.push(fileEntry);

        await prisma.sharedDiagnostic.update({
            where: { id: shareId },
            data: {
                results: {
                    ...currentResults,
                    _files: existingFiles,
                },
            },
        });

        // Audit log
        const ip = req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
        await logProAudit('FILE_UPLOADED', proCtx.userId, proCtx.structureId, {
            shareId,
            fileName: originalName,
            encrypted: true,
        }, ip).catch(() => { });

        return res.status(200).json({
            ok: true,
            fileId: fileEntry.id,
            message: 'Fichier chiffré reçu et enregistré.',
        });
    } catch (error) {
        logger.error({ err: error }, '[Upload Secure] Erreur');
        return res.status(500).json({ error: 'Erreur lors de l\'envoi.' });
    }
}

export default requireProAuth(handler);
