import prisma from '../../_utils/prisma.js';
import { requireProAuth } from '../../_utils/auth.js';
import { logProAudit } from '../../_utils/auth.js';
import { generateSecret, verifyCode, buildOtpauthUrl } from '../../lib/totp.js';

/**
 * MFA Setup handler (Pro-only)
 *
 * GET  → Generate secret + otpauth URL (does NOT enable MFA yet)
 * POST → Verify initial code → enable MFA
 * DELETE → Disable MFA (requires valid code as confirmation)
 */
async function handler(req, res) {
    const { userId, email, structureId } = req.user;

    // --- GET: Generate new secret ---
    if (req.method === 'GET') {
        const secret = generateSecret();
        const otpauthUrl = buildOtpauthUrl(secret, email);

        // Save secret but keep mfa_enabled = false until verified
        await prisma.proUser.update({
            where: { id: userId },
            data: { mfa_secret: secret, mfa_enabled: false },
        });

        return res.status(200).json({ ok: true, secret, otpauthUrl });
    }

    // --- POST: Verify code and enable MFA ---
    if (req.method === 'POST') {
        const { code } = req.body || {};
        if (!code || String(code).length !== 6) {
            return res.status(400).json({ error: 'Code à 6 chiffres requis' });
        }

        const user = await prisma.proUser.findUnique({ where: { id: userId } });
        if (!user?.mfa_secret) {
            return res.status(400).json({ error: 'Aucun secret MFA configuré. Lancez d\'abord GET /api/pro/mfa-setup.' });
        }

        const valid = verifyCode(user.mfa_secret, String(code));
        if (!valid) {
            return res.status(400).json({ error: 'Code de vérification incorrect' });
        }

        await prisma.proUser.update({
            where: { id: userId },
            data: { mfa_enabled: true },
        });

        await logProAudit('MFA_ENABLED', userId, structureId, {}, null);

        return res.status(200).json({ ok: true, message: 'MFA activé avec succès' });
    }

    // --- DELETE: Disable MFA (requires valid code) ---
    if (req.method === 'DELETE') {
        const { code } = req.body || {};
        if (!code || String(code).length !== 6) {
            return res.status(400).json({ error: 'Code à 6 chiffres requis pour désactiver le MFA' });
        }

        const user = await prisma.proUser.findUnique({ where: { id: userId } });
        if (!user?.mfa_secret || !user.mfa_enabled) {
            return res.status(400).json({ error: 'MFA non activé' });
        }

        const valid = verifyCode(user.mfa_secret, String(code));
        if (!valid) {
            return res.status(400).json({ error: 'Code incorrect' });
        }

        await prisma.proUser.update({
            where: { id: userId },
            data: { mfa_enabled: false, mfa_secret: null },
        });

        await logProAudit('MFA_DISABLED', userId, structureId, {}, null);

        return res.status(200).json({ ok: true, message: 'MFA désactivé' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

// Strict pro-only auth (not generic requireAuth)
export default requireProAuth(handler);
