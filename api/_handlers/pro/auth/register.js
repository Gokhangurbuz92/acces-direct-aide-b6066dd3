import bcrypt from 'bcryptjs';
import logger from '../../../_utils/logger.js';
import { signProToken, checkRateLimit, logProAudit } from '../../../lib/pro-auth.js';
import prisma from '../../../_utils/prisma.js';

function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w-]+/g, '')       // Remove all non-word chars
        .replace(/--+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start
        .replace(/-+$/, '');            // Trim - from end
}
/**
 * @param {import('../../../_utils/http-types').ApiRequest} req
 * @param {import('../../../_utils/http-types').ApiResponse} res
 */

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { email, password, structureName } = req.body;
    // Handle IP for rate limiting - support Vercel/Standard headers
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const ip = rawIp ? String(rawIp).split(',')[0].trim() : 'unknown';

    if (!email || !password || !structureName) {
        return res.status(400).json({ error: "Tous les champs sont requis" });
    }

    // Rate Limit
    const ipLimit = await checkRateLimit(`ip:${ip}`);
    if (!ipLimit.allowed) {
        return res.status(429).json({ error: "Trop de tentatives. Réessayez plus tard." });
    }

    try {
        // Check if email exists
        const existingUser = await prisma.proUser.findFirst({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({ error: "Cet email est déjà utilisé." });
        }

        // Create Structure
        let slug = slugify(structureName);
        if (!slug) slug = `structure-${Date.now()}`;

        // Ensure slug uniqueness
        const existingStructure = await prisma.structure.findUnique({ where: { slug } });
        if (existingStructure) {
            slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Transaction to ensure atomicity
        const result = await prisma.$transaction(async (prisma) => {
            const structure = await prisma.structure.create({
                data: {
                    nom: structureName,
                    slug: slug,
                    status: 'actif',
                    statut: 'brouillon',
                    is_pro_enabled: true // Enable pro module immediately
                }
            });

            const user = await prisma.proUser.create({
                data: {
                    email,
                    password_hash: hashedPassword,
                    role: 'STRUCTURE_ADMIN',
                    status: 'active',
                    structureId: structure.id
                }
            });

            return { structure, user };
        });

        const token = signProToken(result.user);

        await logProAudit('REGISTER_SUCCESS', result.user.id, result.structure.id, {}, ip);

        return res.status(200).json({
            token,
            user: {
                id: result.user.id,
                email: result.user.email,
                role: result.user.role,
                structureId: result.structure.id,
                structureName: result.structure.nom
            }
        });

    } catch (e) {
        logger.error("Register error", e);
        return res.status(500).json({ error: "Erreur lors de l'inscription" });
    }
}
