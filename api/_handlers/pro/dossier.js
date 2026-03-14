import logger from '../../_utils/logger.js';
// @ts-nocheck
import { db } from '../../../src/db/index.js';
import { SharedDiagnostic } from '../../../src/db/schema.js';
import { eq } from 'drizzle-orm';
import { requireProAuth, requireProStructureContext } from '../../_utils/auth.js';
import { logProAudit } from '../../_utils/auth.js';
/**
 * Pro Dossier Handler
 *
 * GET /api/pro/dossier?shareId=...  — Retrieve shared diagnostic
 * PATCH /api/pro/dossier?shareId=... — Update follow-up status
 *
 * Wraps share retrieval with pro-level auth and RGPD audit logging.
 */
async function handler(req, res) {
    const proCtx = requireProStructureContext(req, res);
    if (!proCtx) return;

    const { structureId, userId } = proCtx;

    const url = new URL(req.url || '/', `https://${req.headers?.host || 'localhost'}`);
    const shareId = url.searchParams.get('shareId');

    if (!shareId) {
        return res.status(400).json({ error: 'Le paramètre shareId est requis.' });
    }

    try {
        if (req.method === 'GET') {
            // 1. Retrieve the shared diagnostic
            const shared = await db.query.SharedDiagnostic.findFirst({
                where: eq(SharedDiagnostic.id, shareId)
            });

            if (!shared) {
                return res.status(404).json({ error: 'Dossier introuvable.' });
            }

            // 2. Check expiration
            if (new Date() > new Date(shared.expiresAt)) {
                return res.status(410).json({
                    error: 'Ce dossier a expiré.',
                    message: 'Demandez à l\'usager de générer un nouveau lien de partage.',
                });
            }

            // 3. Increment view count (non-blocking)
            // Need a separate query to fetch current count then increment, or raw SQL.
            db.update(SharedDiagnostic)
                .set({ viewCount: shared.viewCount + 1 })
                .where(eq(SharedDiagnostic.id, shareId))
                .catch(() => { /* non-blocking */ });

            // 4. RGPD audit: log who accessed what
            await logProAudit('DOSSIER_VIEWED', userId, structureId, {
                shareId,
                viewCount: shared.viewCount + 1,
            }, req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown');

            return res.status(200).json({
                ok: true,
                dossier: {
                    id: shared.id,
                    createdAt: shared.createdAt,
                    expiresAt: shared.expiresAt,
                    situation: shared.situation,
                    results: shared.results,
                    viewCount: shared.viewCount + 1,
                },
            });
        }

        if (req.method === 'PATCH') {
            // Update follow-up status (stored as JSON metadata)
            const { status, internalNote } = req.body;

            if (!status) {
                return res.status(400).json({ error: 'Le champ status est requis.' });
            }

            // We store follow-up metadata in the results JSON
            const shared = await db.query.SharedDiagnostic.findFirst({
                where: eq(SharedDiagnostic.id, shareId)
            });

            if (!shared) {
                return res.status(404).json({ error: 'Dossier introuvable.' });
            }

            const currentResults = shared.results || {};
            const updatedResults = {
                ...currentResults,
                _followUp: {
                    status,
                    internalNote: internalNote || null,
                    updatedAt: new Date().toISOString(),
                    updatedBy: userId,
                },
            };

            await db.update(SharedDiagnostic)
                .set({ results: updatedResults })
                .where(eq(SharedDiagnostic.id, shareId));

            await logProAudit('DOSSIER_STATUS_UPDATED', userId, structureId, {
                shareId,
                status,
            }, req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown');

            return res.status(200).json({ ok: true, status });
        }

        return res.status(405).json({ error: 'Méthode non autorisée' });
    } catch (error) {
        logger.error({ err: error }, '[Pro Dossier] Erreur');
        return res.status(500).json({ error: 'Erreur serveur.' });
    }
}

export default requireProAuth(handler);
