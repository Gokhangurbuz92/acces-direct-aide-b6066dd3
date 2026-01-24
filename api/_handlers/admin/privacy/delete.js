
import { PrismaClient } from '@prisma/client';
import { verifyAdmin } from '../../../_utils/auth.js';
import { hash } from '../../../lib/crypto.js';
import { logger } from '../../../lib/logger.js';

const prisma = new PrismaClient();

export default async function handler(req, res) {
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
        // Use deleteMany to be safe if multiple (though email should be unique per structure usually, but schema says unique [structureId, email])
        const proDelete = await prisma.proUser.deleteMany({
            where: { email }
        });
        stats.proUserDeleted = proDelete.count > 0;

        // 2. Anonymize Beneficiaries
        const benUpdate = await prisma.beneficiary.updateMany({
            where: { contact_hash: hashedEmail },
            data: {
                contact_encrypted: "ANONYMIZED",
                contact_hash: "ANONYMIZED",
                first_name_encrypted: null
            }
        });
        stats.beneficiariesAnonymized = benUpdate.count;

        // 3. Delete Invitations
        const invDelete = await prisma.invitation.deleteMany({
            where: { email }
        });
        stats.invitationsDeleted = invDelete.count;

        // 4. Audit Log
        await prisma.auditLog.create({
            data: {
                action: 'GDPR_DELETE',
                actor: 'admin',
                target: email, // This will be masked in logs, but stored here. Should we store it?
                               // GDPR says we should keep proof of deletion. Storing the email as "target" of deletion is usually acceptable for the register.
                               // But maybe we should hash it or mask it?
                               // "Target" field is likely for search.
                               // Let's store it as is, access is restricted to admin.
                details: stats,
                ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
            }
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
