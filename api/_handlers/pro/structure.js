import logger from '../../_utils/logger.js';
import { db } from '../../../src/db/index.js';
import { Structure, StructureRdvSettings } from '../../../src/db/schema.js';
import { eq } from 'drizzle-orm';
import { logProAudit } from '../../_utils/auth.js';
import { AUTH_ROLE, requireProRole, requireProStructureContext } from '../../_utils/auth.js';
/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */

async function handler(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const proCtx = requireProStructureContext(req, res);
    if (!proCtx) return;

    const { structureId, userId } = proCtx;

    const { summary_falc, is_pro_enabled } = req.body;

    try {
        const updated = await db.transaction(async (tx) => {
            const [structure] = await tx.update(Structure).set({
                    summary_falc,
                    is_pro_enabled
            }).where(eq(Structure.id, structureId)).returning();

            if (typeof is_pro_enabled === 'boolean') {
                const existing = await tx.query.StructureRdvSettings.findFirst({
                    where: eq(StructureRdvSettings.structureId, structureId),
                    columns: { id: true, publishedAt: true },
                });

                if (existing) {
                    await tx.update(StructureRdvSettings).set({
                            isPublished: is_pro_enabled,
                            publishedAt: is_pro_enabled ? existing.publishedAt || new Date() : existing.publishedAt,
                    }).where(eq(StructureRdvSettings.id, existing.id));
                } else {
                    await tx.insert(StructureRdvSettings).values({
                            structureId,
                            isPublished: is_pro_enabled,
                            bookingMode: 'IN_PERSON',
                            ...(is_pro_enabled ? { publishedAt: new Date() } : {}),
                    });
                }
            }

            return structure;
        });

        await logProAudit('STRUCTURE_UPDATED', userId, structureId, { is_pro_enabled }, req.socket.remoteAddress);
        return res.status(200).json(updated);

    } catch (e) {
        logger.error("Structure Settings API Error", e);
        return res.status(500).json({ error: "Internal Error" });
    }
}

export default requireProRole(handler, [AUTH_ROLE.STRUCTURE_ADMIN, AUTH_ROLE.SUPERADMIN]);
