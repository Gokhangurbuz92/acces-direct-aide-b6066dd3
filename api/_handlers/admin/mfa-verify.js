import { verify as verifyTotp } from 'otplib';
import prisma from '../../_utils/prisma.js';
import { decryptToken } from '../../_utils/vault.js';
import logger from '../../_utils/logger.js';
import { requireAdminAuth, signAdminSessionToken } from '../../_utils/auth.js';

/**
 * POST /api/admin/mfa-verify
 *
 * Validates the 6-digit TOTP code and elevates session privileges.
 *
 * Flow:
 * 1. Admin submits 6-digit code from authenticator app
 * 2. Server decrypts TOTP secret from DB
 * 3. Validates code with 1-step time drift window (RFC 6238 §5)
 * 4. On first verification: activates MFA permanently
 * 5. Re-issues JWT with mfa_verified: true claim
 */
async function verifyHandler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const { code } = req.body || {};

    if (!code || typeof code !== 'string' || !/^\d{6}$/.test(code)) {
        return res.status(400).json({ error: 'Invalid code format. Expected 6 digits.' });
    }

    const adminEmail = req.auth?.email;
    if (!adminEmail) {
        return res.status(401).json({ error: 'Admin identity not found' });
    }

    try {
        // 1. Find admin with MFA secret
        const admin = await prisma.adminUser.findUnique({ where: { email: adminEmail } });
        if (!admin || !admin.mfaSecret || !admin.mfaIv) {
            return res.status(404).json({ error: 'MFA not configured. Run setup first.' });
        }

        // 2. Decrypt TOTP seed from Vault
        const secret = decryptToken(admin.mfaSecret, admin.mfaIv);

        // 3. Verify with 1-step time drift window (RFC 6238 §5)
        // otplib v13 verify() is async, returns { valid, delta, epoch }
        const result = await verifyTotp({ token: code, secret, window: 1 });

        if (!result || !result.valid) {
            logger.info(
                { msg: 'admin.mfa.verify_failed', email: adminEmail },
                '[Admin MFA] Invalid code attempt',
            );
            return res.status(403).json({ error: 'Invalid or expired code' });
        }

        // 4. First-time activation
        if (!admin.mfaEnabled) {
            await prisma.adminUser.update({
                where: { id: admin.id },
                data: { mfaEnabled: true },
            });
            logger.info(
                { msg: 'admin.mfa.activated', email: adminEmail },
                '[Admin MFA] MFA activated for admin',
            );
        }

        // 5. Re-issue JWT with mfa_verified: true claim
        const token = signAdminSessionToken({
            email: adminEmail,
            role: admin.role || 'admin',
            mfa_verified: true,
        });

        logger.info(
            { msg: 'admin.mfa.verified', email: adminEmail },
            '[Admin MFA] Code verified, elevated session issued',
        );

        return res.status(200).json({
            success: true,
            token,
            mfa_verified: true,
        });
    } catch (error) {
        logger.error({ err: error, msg: 'admin.mfa.verify_error' }, '[Admin MFA] Verification error');
        return res.status(500).json({ error: 'MFA verification failed' });
    }
}

export default requireAdminAuth(verifyHandler);
