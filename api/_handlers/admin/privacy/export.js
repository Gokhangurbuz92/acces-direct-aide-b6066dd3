import prisma from '../../../_utils/prisma.js';
import { verifyAdmin } from '../../../_utils/auth.js';
import { hash } from '../../../lib/crypto.js';
import { logger } from '../../../lib/logger.js';
/**
 * @param {import('../../../_utils/http-types').ApiRequest} req
 * @param {import('../../../_utils/http-types').ApiResponse} res
 */

export default async function handler(req, res) {
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
        const proUser = await prisma.proUser.findFirst({
            where: { email },
            select: {
                id: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
                structure: { select: { nom: true, siret: true } }
            }
        });

        // 2. Beneficiary (via Hash)
        const beneficiaries = await prisma.beneficiary.findMany({
            where: { contact_hash: hashedEmail },
            include: {
                appointments: {
                    select: {
                        start_at: true,
                        end_at: true,
                        status: true,
                        structure: { select: { nom: true } }
                    }
                }
            }
        });

        // 3. Invitations
        const invitations = await prisma.invitation.findMany({
            where: { email },
            select: {
                id: true,
                role: true,
                expires_at: true,
                structure: { select: { nom: true } }
            }
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
