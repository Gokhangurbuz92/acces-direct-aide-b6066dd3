import { ScanManager } from '../../../src/lib/ai/ScanManager';
import { verifyAdminToken } from '../../../lib/admin-auth';

/**
 * api/admin/system/trigger-scan.js
 * Déclenche manuellement le scan national souverain.
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    // 1. Sécurité Admin
    const isAdmin = await verifyAdminToken(req);
    if (!isAdmin) return res.status(401).json({ error: "Non autorisé" });

    try {
        // 2. Déclenchement asynchrone (pour ne pas bloquer la requête HTTP)
        const report = await ScanManager.runNationalAudit();

        return res.status(200).json({
            success: true,
            report
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
