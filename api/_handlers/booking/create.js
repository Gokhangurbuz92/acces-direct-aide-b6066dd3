import { PrismaClient } from '@prisma/client';
import { checkRateLimit } from '../../_utils/rateLimit.js';
import { encrypt, hash } from '../../lib/crypto.js';
import crypto from 'crypto';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const identifier = req.headers['x-forwarded-for'] || '127.0.0.1';
    const limit = checkRateLimit('BOOK', identifier);

    if (!limit.allowed) {
        return res.status(429).json(limit.error);
    }

    const { structureId, serviceId, proId, startAt, contact, firstName } = req.body;

    if (!structureId || !serviceId || !startAt || !contact) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        // 1. Handle Beneficiary (Dedupe by hash)
        const contactHash = hash(contact);
        let beneficiary = await prisma.beneficiary.findFirst({
            where: { contact_hash: contactHash }
        });

        if (!beneficiary) {
            beneficiary = await prisma.beneficiary.create({
                data: {
                    contact_encrypted: encrypt(contact),
                    contact_hash: contactHash,
                    first_name_encrypted: encrypt(firstName)
                }
            });
        }

        // 2. Check Availability (Prevent Double Booking)
        const start = new Date(startAt);
        const end = new Date(start.getTime() + 30 * 60000); // 30 mins default

        const existing = await prisma.appointment.findFirst({
            where: {
                proId: proId,
                status: { notIn: ['cancelled', 'rejected'] }, // Active appointments only
                OR: [
                    { start_at: { lte: start }, end_at: { gt: start } }, // Starts during existing
                    { start_at: { lt: end }, end_at: { gte: end } }      // Ends during existing
                ]
            }
        });

        if (existing) {
            return res.status(409).json({ error: "Ce créneau n'est plus disponible." });
        }

        // 3. Create Appointment
        const cancelToken = crypto.randomBytes(32).toString('hex');
        const accessToken = crypto.randomBytes(32).toString('hex');

        const appointment = await prisma.appointment.create({
            data: {
                structureId,
                serviceId,
                proId,
                beneficiaryId: beneficiary.id,
                start_at: start,
                end_at: end,
                mode: 'presentiel', // Default
                status: 'requested',
                cancel_token_hash: hash(cancelToken),
                access_token_hash: hash(accessToken)
            }
        });

        return res.status(200).json({
            success: true,
            id: appointment.id,
            tokens: {
                cancel: cancelToken,
                access: accessToken
            }
        });

    } catch (e) {
        console.error('Booking creation error:', e);
        return res.status(500).json({ error: e.message });
    }
}
