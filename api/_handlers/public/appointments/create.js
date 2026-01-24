
import { PrismaClient } from '@prisma/client';
import { checkRateLimit } from '../../../lib/pro-auth.js';
import { encrypt, hash } from '../../../lib/crypto.js';
import crypto from 'crypto';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Rate Limit (Basic)
    const identifier = req.headers['x-forwarded-for'] || '127.0.0.1';
    // const limit = await checkRateLimit(`BOOK:${identifier}`); // Uncomment when Redis/KV is ready

    const { structureId, startAt, email, name } = req.body;

    if (!structureId || !startAt || !email) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        // 1. Handle Beneficiary (Dedupe by hash)
        // Done outside transaction for simplicity (less locking), assumes eventual consistency is fine for users
        const contactHash = hash(email);
        let beneficiary = await prisma.beneficiary.findFirst({
            where: { contact_hash: contactHash }
        });

        if (!beneficiary) {
            beneficiary = await prisma.beneficiary.create({
                data: {
                    contact_encrypted: encrypt(email),
                    contact_hash: contactHash,
                    first_name_encrypted: name ? encrypt(name) : null
                }
            });
        }

        // 2. Find Service (Use first one for MVP)
        let service = await prisma.service.findFirst({
            where: { structureId }
        });

        let serviceId;
        if (!service) {
             // Create default service if missing
             service = await prisma.service.create({
                 data: {
                     structureId,
                     slug: 'rdv-generique',
                     name: 'Rendez-vous',
                     duration_minutes: 60
                 }
             });
        }
        serviceId = service.id;

        // 3. Create Appointment with Double-Booking Check (Interactive Transaction)
        const start = new Date(startAt);
        const duration = service.duration_minutes || 60;
        const end = new Date(start.getTime() + duration * 60000);

        const result = await prisma.$transaction(async (tx) => {
            // Check for overlaps
            // Overlap condition: (StartA < EndB) and (EndA > StartB)
            const conflict = await tx.appointment.findFirst({
                where: {
                    structureId,
                    status: { in: ['confirmed', 'locked'] },
                    AND: [
                        { start_at: { lt: end } },
                        { end_at: { gt: start } }
                    ]
                }
            });

            if (conflict) {
                throw new Error('SLOT_TAKEN');
            }

            const cancelToken = crypto.randomBytes(32).toString('hex');
            const accessToken = crypto.randomBytes(32).toString('hex');

            const appointment = await tx.appointment.create({
                data: {
                    structureId,
                    serviceId,
                    beneficiaryId: beneficiary.id,
                    start_at: start,
                    end_at: end,
                    mode: 'presentiel', // Default
                    status: 'confirmed', // Auto-confirm for MVP
                    cancel_token_hash: hash(cancelToken),
                    access_token_hash: hash(accessToken)
                }
            });

            return {
                appointment,
                cancelToken
            };
        });

        return res.status(200).json({
            success: true,
            id: result.appointment.id,
            tokens: {
                cancel: result.cancelToken
            }
        });

    } catch (e) {
        if (e.message === 'SLOT_TAKEN') {
            return res.status(409).json({ error: 'Ce créneau n\'est plus disponible.' });
        }
        console.error('Booking creation error:', e);
        return res.status(500).json({ error: e.message });
    }
}
