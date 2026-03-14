import { checkRateLimit, getClientIp, getRateLimitStatus } from '../../../_utils/rateLimit.js';
import { db } from '../../../../src/db/index.js';
import { ProUser, Invitation, AuditLog } from '../../../../src/db/schema.js';
import { eq } from 'drizzle-orm';
import { verifyAdmin } from '../../../_utils/auth.js';
import { hash } from '../../../lib/crypto.js';
import { logger } from '../../../lib/logger.js';
/**
 * @param {import('../../../_utils/http-types').ApiRequest} req
 * @param {import('../../../_utils/http-types').ApiResponse} res
 */

export default async function handler(req, res) {
    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit('ADMIN_API', ip);
    if (!rateLimit.allowed) {
        return res.status(getRateLimitStatus(rateLimit)).json(rateLimit.error);
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!verifyAdmin(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const hashedEmail = hash(email);
        const stats = {
            proUserDeleted: false,
            beneficiariesAnonymized: 0,
            invitationsDeleted: 0
        };

        // 1. Delete ProUser
        const proDelete = await db.delete(ProUser).where(eq(ProUser.email, email)).returning();
        stats.proUserDeleted = proDelete.length > 0;

        // 2. Anonymize Beneficiaries
        const benUpdate = await db.update(Beneficiary).set({
                contact_encrypted: "ANONYMIZED",
                contact_hash: "ANONYMIZED",
                first_name_encrypted: null
        }).where(eq(Beneficiary.contact_hash, hashedEmail)).returning();
        stats.beneficiariesAnonymized = benUpdate.length;

        // 3. Delete Invitations
        const invDelete = await db.delete(Invitation).where(eq(Invitation.email, email)).returning();
        stats.invitationsDeleted = invDelete.length;

        // 4. Audit Log
        await db.insert(AuditLog).values({
                action: 'GDPR_DELETE',
                actor: 'admin',
                target: email,
                details: stats,
                ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || ''
        });

        logger.info(`GDPR Delete executed for ${email}`, stats);

        return res.status(200).json({
            success: true,
            stats
        });

    } catch (e) {
        logger.error('GDPR Delete Error', e);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
