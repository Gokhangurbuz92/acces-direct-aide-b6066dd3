import prisma from '../../_utils/prisma.js';
import { verifyAdmin } from '../../_utils/auth.js';
import { validateForPublication } from '../../lib/quality-gate.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!verifyAdmin(req)) {
        return res.status(401).json({ error: 'Unauthorized: Admin Token Required' });
    }

    const { action, ids, entityType } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Invalid IDs' });
    }

    try {
        let updateData = {};

        switch (action) {
            case 'PUBLISH': {
                // P0-5: Quality gate — validate before publishing
                if (entityType === 'aide' || entityType === 'Aide') {
                    const items = await prisma.aide.findMany({ where: { id: { in: ids } } });
                    const blocked = [];
                    const allWarnings = [];
                    for (const item of items) {
                        const result = validateForPublication('aide', item);
                        if (!result.valid) {
                            blocked.push({ id: item.id, titre: item.titre, errors: result.errors });
                        }
                        if (result.warnings.length > 0) {
                            allWarnings.push({ id: item.id, titre: item.titre, warnings: result.warnings });
                        }
                    }
                    if (blocked.length > 0) {
                        return res.status(422).json({
                            error: 'Publication bloquée — critères qualité non remplis',
                            blocked,
                            warnings: allWarnings,
                        });
                    }
                }

                if (entityType === 'demarche' || entityType === 'Demarche') {
                    const items = await prisma.demarche.findMany({ where: { id: { in: ids } } });
                    const blocked = [];
                    for (const item of items) {
                        const result = validateForPublication('demarche', item);
                        if (!result.valid) {
                            blocked.push({ id: item.id, titre: item.titre, errors: result.errors });
                        }
                    }
                    if (blocked.length > 0) {
                        return res.status(422).json({
                            error: 'Publication bloquée — critères qualité non remplis',
                            blocked,
                        });
                    }
                }

                updateData = {
                    statut: 'actif',
                    published_at: new Date()
                };
                break;
            }
            case 'REJECT':
                updateData = {
                    statut: 'rejected'
                };
                break;
            case 'RETRY_FALC':
                updateData = {
                    falc_status: 'pending' // Pipeline will pick it up
                };
                break;
            default:
                return res.status(400).json({ error: 'Invalid Action' });
        }

        const result = await prisma.actualite.updateMany({
            where: { id: { in: ids } },
            data: updateData
        });

        // Audit Log
        await prisma.auditLog.create({
            data: {
                action: `ADMIN_BULK_${action}`,
                details: { count: result.count, ids },
                timestamp: new Date()
            }
        });

        return res.status(200).json({ success: true, count: result.count });

    } catch (error) {
        console.error('Admin Action Error:', error);
        return res.status(500).json({ error: 'Database Error' });
    }
}
