import logger from '../../_utils/logger.js';
import prisma from '../../_utils/prisma.js';
/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { type, version, metadata } = req.body;
    // type: 'cookies', 'terms', 'privacy'
    // version: e.g. '2024-01-20'

    if (!type || !version) {
        return res.status(400).json({ error: "Missing type or version" });
    }

    try {
        // We use AuditLog to record public consent for now as it's built-in
        // Or we could have a dedicated Consent table.
        // The objective says "GDPR (Purge à 90j + API de log de consentement simple)".
        // I'll check if AuditLog is appropriate or use a generic Log entry.

        await prisma.updateLog.create({
            data: {
                source_name: 'USER_CONSENT',
                status: 'success',
                raw_payload_json: {
                    type,
                    version,
                    userAgent: req.headers['user-agent'],
                    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                    metadata
                }
            }
        });

        return res.status(200).json({ success: true, message: "Consent logged" });
    } catch (e) {
        logger.error('Consent Log Error:', e);
        return res.status(500).json({ error: "Internal Error" });
    }
}
