import prisma from '../_utils/prisma.js';
import { hash, encrypt } from '../lib/crypto.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { env } from '../_utils/env.js';
import { logger } from '../lib/logger.js';
/**
 * @param {import('../_utils/http-types').ApiRequest} req
 * @param {import('../_utils/http-types').ApiResponse} res
 */

export default async function handler(req, res) {
    const isDev = env.runtime.nodeEnv === 'development' || env.flags.devLoginEnabled;
    if (!isDev && !env.flags.allowDevTools) {
        return res.status(404).json({ error: "Not Found" });
    }

    if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const email = 'pro-turnkey@test.com';
        const passwordText = 'DevPass123!';
        const passwordHash = bcrypt.hashSync(passwordText, 10);

        // Structure
        const STRUCTURE_SLUG = "structure-turnkey-demo";
        const structure = await prisma.structure.upsert({
            where: { slug: STRUCTURE_SLUG },
            update: {},
            create: {
                slug: STRUCTURE_SLUG,
                nom: 'Structure Turnkey Demo',
                email: 'structure-turnkey@test.com',
                adresse: '1 rue de la Démo',
                code_postal: '67000',
                ville: 'Strasbourg',
                departement: '67',
                telephone: '0102030405',
                statut: 'publie',
                is_pro_enabled: true
            }
        });

        // Pro
        const pro = await prisma.proUser.upsert({
            where: {
                structureId_email: {
                    structureId: structure.id,
                    email: email
                }
            },
            update: {
                password_hash: passwordHash,
                role: 'STRUCTURE_ADMIN',
                status: 'active'
            },
            create: {
                email,
                role: 'STRUCTURE_ADMIN',
                structureId: structure.id,
                password_hash: passwordHash,
                status: 'active'
            }
        });

        // Service
        const SERVICE_SLUG = "demarrage-demo";
        const service = await prisma.service.upsert({
            where: {
                structureId_slug: {
                    structureId: structure.id,
                    slug: SERVICE_SLUG
                }
            },
            update: {},
            create: {
                name: 'Démarrage',
                slug: SERVICE_SLUG,
                structureId: structure.id,
                duration_minutes: 30, // Correct field name
                modes: ["presentiel"]
            }
        });

        // Token
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = hash(token);

        // Encrypt beneficiary
        const contactEncrypted = encrypt('alice@test.com');
        const nameEncrypted = encrypt('Alice');

        // Create Appointment using CONNECT
        const appointment = await prisma.appointment.create({
            data: {
                start_at: new Date(Date.now() + 3600000),
                end_at: new Date(Date.now() + 7200000),
                status: 'confirmed',
                access_token_hash: tokenHash,
                mode: 'presentiel',

                // Relations via connect
                structure: { connect: { id: structure.id } },
                pro: { connect: { id: pro.id } },
                service: { connect: { id: service.id } },

                beneficiary: {
                    create: {
                        first_name_encrypted: nameEncrypted,
                        contact_encrypted: contactEncrypted,
                        contact_hash: hash('alice@test.com')
                    }
                }
            }
        });

        res.json({
            proEmail: email,
            proPassword: passwordText,
            beneficiaryUrl: `http://localhost:5173/r/${token}/messages`,
            appointmentId: appointment.id,
            status: "Success"
        });

    } catch (e) {
        logger.error('Failed to create test appointment', e);
        res.status(500).json({ error: e.message });
    }
}
