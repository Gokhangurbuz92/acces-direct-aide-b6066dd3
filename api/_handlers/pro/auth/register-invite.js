// @ts-nocheck
import logger from '../../../_utils/logger.js';
import bcrypt from 'bcryptjs';
import { signProToken, logProAudit } from '../../../lib/pro-auth.js';
import prisma from '../../../_utils/prisma.js';

/**
 * Register via Invitation Token
 *
 * POST /api/pro/auth/register-invite
 * Body: { token, password }
 *
 * 1. Validates the invitation token (not expired, not used)
 * 2. Creates the ProUser linked to the invitation's structure
 * 3. Marks the invitation as used
 * 4. Returns a JWT for immediate login
 */

export default async function handler(req, res) {
    if (req.method === 'GET') {
        // GET: Validate token only (for the registration form)
        const url = new URL(req.url || '/', `https://${req.headers?.host || 'localhost'}`);
        const token = url.searchParams.get('token');

        if (!token) {
            return res.status(400).json({ error: 'Token manquant' });
        }

        const invitation = await prisma.invitation.findUnique({
            where: { token },
            include: { structure: { select: { id: true, nom: true } } },
        });

        if (!invitation) {
            return res.status(404).json({ error: 'Invitation introuvable' });
        }

        if (invitation.used_at) {
            return res.status(410).json({ error: 'Cette invitation a déjà été utilisée.' });
        }

        if (new Date() > new Date(invitation.expires_at)) {
            return res.status(410).json({ error: 'Cette invitation a expiré. Demandez un nouveau lien.' });
        }

        return res.status(200).json({
            ok: true,
            email: invitation.email,
            role: invitation.role,
            structureName: invitation.structure.nom,
        });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ error: 'Token et mot de passe requis' });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' });
    }

    try {
        // 1. Find and validate invitation
        const invitation = await prisma.invitation.findUnique({
            where: { token },
            include: { structure: { select: { id: true, nom: true } } },
        });

        if (!invitation) {
            return res.status(404).json({ error: 'Invitation introuvable' });
        }

        if (invitation.used_at) {
            return res.status(410).json({ error: 'Cette invitation a déjà été utilisée.' });
        }

        if (new Date() > new Date(invitation.expires_at)) {
            return res.status(410).json({ error: 'Cette invitation a expiré.' });
        }

        // 2. Check if email already exists in this structure
        const existingUser = await prisma.proUser.findFirst({
            where: { email: invitation.email, structureId: invitation.structureId },
        });

        if (existingUser) {
            // Mark invitation as used to avoid confusion
            await prisma.invitation.update({
                where: { id: invitation.id },
                data: { used_at: new Date() },
            });
            return res.status(409).json({ error: 'Un compte existe déjà avec cet email.' });
        }

        // 3. Create user + mark invitation in a transaction
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.proUser.create({
                data: {
                    email: invitation.email,
                    password_hash: hashedPassword,
                    role: invitation.role || 'PRO',
                    status: 'active',
                    structureId: invitation.structureId,
                },
            });

            await tx.invitation.update({
                where: { id: invitation.id },
                data: { used_at: new Date() },
            });

            return user;
        });

        // 4. Sign JWT
        const jwt = signProToken(result);

        const rawIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
        const ip = String(rawIp).split(',')[0].trim();
        await logProAudit('REGISTER_VIA_INVITE', result.id, invitation.structureId, {
            invitationId: invitation.id,
        }, ip);

        return res.status(201).json({
            token: jwt,
            user: {
                id: result.id,
                email: result.email,
                role: result.role,
                structureId: invitation.structureId,
                structureName: invitation.structure.nom,
            },
        });
    } catch (error) {
        logger.error('[Register Invite] Erreur:', error.message);
        return res.status(500).json({ error: "Erreur lors de l'inscription." });
    }
}
