import logger from '../../../_utils/logger.js';
// @ts-nocheck
import prisma from '../../../_utils/prisma.js';
import { requireProAuth, requireProStructureContext } from '../../../_utils/auth.js';
import { logProAudit } from '../../../lib/pro-auth.js';
/**
 * Dossier Export API (Pro-only, RGPD)
 *
 * GET /api/pro/dossier/export?shareId=xxx&format=json|csv
 *
 * Exports a dossier's data in JSON or CSV format (RGPD data portability).
 * Also logs the export action for audit compliance.
 */
async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const proCtx = requireProStructureContext(req, res);
    if (!proCtx) return;

    const { userId, structureId } = proCtx;

    const url = new URL(req.url || '/', `https://${req.headers?.host || 'localhost'}`);
    const shareId = url.searchParams.get('shareId');
    const format = url.searchParams.get('format') || 'json';

    if (!shareId) {
        return res.status(400).json({ error: 'shareId requis.' });
    }

    try {
        const shared = await prisma.sharedDiagnostic.findUnique({
            where: { id: shareId },
        });

        if (!shared) {
            return res.status(404).json({ error: 'Dossier introuvable.' });
        }

        // Safe results (strip internal fields)
        const safeResults = { ...(shared.results || {}) };
        delete safeResults._files;
        delete safeResults._consent;

        const exportData = {
            reference: shareId.slice(0, 8).toUpperCase(),
            createdAt: shared.createdAt,
            expiresAt: shared.expiresAt,
            situation: shared.situation || {},
            results: safeResults,
            viewCount: shared.viewCount,
            exportedAt: new Date().toISOString(),
            exportedBy: userId,
        };

        // Audit
        await logProAudit('DOSSIER_EXPORTED', userId, structureId, {
            shareId,
            format,
        }, req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown');

        // CSV format
        if (format === 'csv') {
            const situation = exportData.situation || {};
            const rights = safeResults.rights || [];

            const csvLines = [
                'Champ,Valeur',
                `Référence,${exportData.reference}`,
                `Créé le,"${exportData.createdAt}"`,
                `Expire le,"${exportData.expiresAt}"`,
                `Vues,${exportData.viewCount}`,
                '',
                'Droits identifiés',
                'Nom,Éligible,Montant estimé',
            ];

            for (const right of rights) {
                csvLines.push(
                    `"${(right.name || '').replace(/"/g, '""')}",${right.eligible ? 'Oui' : 'Non'},"${right.amount || 'N/A'}"`
                );
            }

            csvLines.push('');
            csvLines.push('Situation');
            csvLines.push('Clé,Valeur');
            for (const [key, value] of Object.entries(situation)) {
                csvLines.push(`"${key}","${String(value).replace(/"/g, '""')}"`);
            }

            const csv = csvLines.join('\n');
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="dossier-${exportData.reference}.csv"`);
            return res.status(200).send(csv);
        }

        // JSON format (default)
        res.setHeader('Content-Disposition', `attachment; filename="dossier-${exportData.reference}.json"`);
        return res.status(200).json({
            ok: true,
            export: exportData,
        });
    } catch (error) {
        logger.error({ err: error }, '[DossierExport] Erreur');
        return res.status(500).json({ error: 'Erreur export.' });
    }
}

export default requireProAuth(handler);
