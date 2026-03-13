import logger from '../../../_utils/logger.js';
import { hashPassword } from '../../../_utils/user-auth.js';
import { signProToken, logProAudit } from '../../../_utils/auth.js';
import { checkRateLimit, getClientIp } from '../../../_utils/rateLimit.js';
import { db } from '../../../src/db/index.js';
import { Structure, ProUser } from '../../../src/db/schema.js';
import { eq } from 'drizzle-orm';

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
    const ip = getClientIp(req);

    if (!email || !password || !structureName) {
        return res.status(400).json({ error: "Tous les champs sont requis" });
    }

    // Rate Limit
    const ipLimit = await checkRateLimit('REGISTER_PRO', `ip:${ip}`);
    if (!ipLimit.allowed) {
        return res.status(429).json(ipLimit.error || { error: 'Trop de tentatives. Réessayez plus tard.' });
    }

    try {
        // Check if email exists
        const existingUser = await db.query.ProUser.findFirst({
            where: (u, { eq }) => eq(u.email, email)
        });

        if (existingUser) {
            return res.status(400).json({ error: "Cet email est déjà utilisé." });
        }

        // Create Structure
        let slug = slugify(structureName);
        if (!slug) slug = `structure-${Date.now()}`;

        // Ensure slug uniqueness
        const existingStructure = await db.query.Structure.findFirst({ where: (s, { eq }) => eq(s.slug, slug) });
        if (existingStructure) {
            slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
        }

        const hashedPassword = await hashPassword(password);

        // Transaction to ensure atomicity
        const result = await db.transaction(async (tx) => {
            const [structure] = await tx.insert(Structure).values({
                nom: structureName,
                slug: slug,
                status: 'actif',
                statut: 'brouillon',
                is_pro_enabled: true // Enable pro module immediately
            }).returning();

            const [user] = await tx.insert(ProUser).values({
                email,
                password_hash: hashedPassword,
                role: 'STRUCTURE_ADMIN',
                status: 'active',
                structureId: structure.id
            }).returning();

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
