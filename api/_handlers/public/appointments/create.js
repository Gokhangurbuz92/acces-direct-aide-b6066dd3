import prisma from '../../../_utils/prisma.js';
import { z } from 'zod';
import { createHandler } from '../../../_utils/wrapper.js';
import { encrypt, hash } from '../../../lib/crypto.js';
import crypto from 'crypto';
import { createError, errorCodes } from '../../../_utils/errors.js';

const bodySchema = z.object({
    structureId: z.string().min(1),
    startAt: z.string().datetime(),
    email: z.string().email(),
    name: z.string().optional()
});

const handler = async (req) => {
    if (req.method !== 'POST') {
        throw createError(405, errorCodes.BAD_REQUEST, 'Method not allowed');
    }

    const { structureId, startAt, email, name } = req.validated.body;

    // 1. Handle Beneficiary
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

    // 2. Find Service
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

    // 3. Create Appointment with Double-Booking Check
    const start = new Date(startAt);
    const duration = service.duration_minutes || 60;
    const end = new Date(start.getTime() + duration * 60000);

    try {
        const result = await prisma.$transaction(async (tx) => {
            // Check for overlaps
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
                    mode: 'presentiel',
                    status: 'confirmed',
                    cancel_token_hash: hash(cancelToken),
                    access_token_hash: hash(accessToken)
                }
            });

            return {
                appointment,
                cancelToken
            };
        }, {
            isolationLevel: 'Serializable',
            maxWait: 5000, // 5s timeout pour éviter les deadlocks bloquants
            timeout: 10000
        });

        return {
            success: true,
            id: result.appointment.id,
            tokens: {
                cancel: result.cancelToken
            }
        };

    } catch (e) {
        if (e.message === 'SLOT_TAKEN') {
            throw createError(409, errorCodes.CONFLICT, 'Ce créneau n\'est plus disponible.');
        }
        throw e;
    }
};

export default createHandler(handler, { body: bodySchema });
