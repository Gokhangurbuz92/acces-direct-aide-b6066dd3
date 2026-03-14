import { checkRateLimit, getClientIp, getRateLimitStatus } from '../../../_utils/rateLimit.js';
import { db } from '../../../../src/db/index.js';
import { ProUser, Invitation } from '../../../../src/db/schema.js';
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

    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!verifyAdmin(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const email = req.body?.email || req.query?.email;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const hashedEmail = hash(email);

        // 1. ProUser
        const proUser = await db.query.ProUser.findFirst({
            where: eq(ProUser.email, email),
            columns: {
                id: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
            },
            with: {
                structure: { columns: { nom: true, siret: true } }
            }
        });

        // 2. Beneficiary (via Hash)
        const beneficiaries = await db.query.Beneficiary.findMany({
            where: eq(Beneficiary.contact_hash, hashedEmail),
            with: {
                appointments: {
                    columns: {
                        start_at: true,
                        end_at: true,
                        status: true,
                    },
                    with: { structure: { columns: { nom: true } } }
                }
            }
        });

        // 3. Invitations
        const invitations = await db.query.Invitation.findMany({
            where: eq(Invitation.email, email),
            columns: {
                id: true,
                role: true,
                expires_at: true,
            },
            with: { structure: { columns: { nom: true } } }
        });

        logger.info(`GDPR Export requested for ${email}`, {
            foundPro: !!proUser,
            foundBeneficiaries: beneficiaries.length,
            foundInvitations: invitations.length
        });

        return res.status(200).json({
            request_date: new Date(),
            subject: email,
            data: {
                pro_account: proUser || null,
                beneficiary_records: beneficiaries,
                invitations: invitations
            }
        });

    } catch (e) {
        logger.error('GDPR Export Error', e);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
