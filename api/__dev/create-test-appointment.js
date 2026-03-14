import { db } from '../../src/db/index.js';
import { Structure, ProUser, Service, Appointment, Beneficiary } from '../../src/db/schema.js';
import { eq } from 'drizzle-orm';
import { hash, encrypt } from '../lib/crypto.js';
import crypto from 'crypto';
import { hashPasswordSync } from '../_utils/user-auth.js';
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
        const passwordHash = hashPasswordSync(passwordText);

        // Structure
        const STRUCTURE_SLUG = "structure-turnkey-demo";
        const [structure] = await db.insert(Structure).values({
            id: crypto.randomUUID(),
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
        }).onConflictDoUpdate({ target: Structure.slug, set: { slug: STRUCTURE_SLUG } }).returning();

        // Pro
        const [pro] = await db.insert(ProUser).values({
            id: crypto.randomUUID(),
            email,
            role: 'STRUCTURE_ADMIN',
            structureId: structure.id,
            password_hash: passwordHash,
            status: 'active'
        }).onConflictDoUpdate({ 
            target: [ProUser.structureId, ProUser.email], 
            set: { password_hash: passwordHash, role: 'STRUCTURE_ADMIN', status: 'active' } 
        }).returning();

        // Service
        const SERVICE_SLUG = "demarrage-demo";
        const [service] = await db.insert(Service).values({
            id: crypto.randomUUID(),
            name: 'Démarrage',
            slug: SERVICE_SLUG,
            structureId: structure.id,
            duration_minutes: 30, // Correct field name
            modes: ["presentiel"]
        }).onConflictDoUpdate({ 
            target: [Service.structureId, Service.slug], 
            set: { duration_minutes: 30 } 
        }).returning();

        // Token
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = hash(token);

        // Encrypt beneficiary
        const contactEncrypted = encrypt('alice@test.com');
        const nameEncrypted = encrypt('Alice');

        // Create Beneficiary
        const [beneficiary] = await db.insert(Beneficiary).values({
            id: crypto.randomUUID(),
            first_name_encrypted: nameEncrypted,
            contact_encrypted: contactEncrypted,
            contact_hash: hash('alice@test.com')
        }).returning();

        // Create Appointment using explicit IDs
        const [appointment] = await db.insert(Appointment).values({
            id: crypto.randomUUID(),
            start_at: new Date(Date.now() + 3600000),
            end_at: new Date(Date.now() + 7200000),
            status: 'confirmed',
            access_token_hash: tokenHash,
            mode: 'presentiel',
            structureId: structure.id,
            proId: pro.id,
            serviceId: service.id,
            beneficiaryId: beneficiary.id
        }).returning();

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
