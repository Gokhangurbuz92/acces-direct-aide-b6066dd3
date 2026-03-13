import { db } from '../../../../src/db/index.js';
import { Beneficiary, Service, Appointment } from '../../../../src/db/schema.js';
import { eq, and, lt, gt, inArray } from 'drizzle-orm';
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
    let beneficiary = await db.query.Beneficiary.findFirst({
        where: eq(Beneficiary.contact_hash, contactHash)
    });

    if (!beneficiary) {
        const [newBeneficiary] = await db.insert(Beneficiary).values({
                contact_encrypted: encrypt(email),
                contact_hash: contactHash,
                first_name_encrypted: name ? encrypt(name) : null
        }).returning();
        beneficiary = newBeneficiary;
    }

    // 2. Find Service
    let service = await db.query.Service.findFirst({
        where: eq(Service.structureId, structureId)
    });

    let serviceId;
    if (!service) {
        // Create default service if missing
        const [newService] = await db.insert(Service).values({
                structureId,
                slug: 'rdv-generique',
                name: 'Rendez-vous',
                duration_minutes: 60
        }).returning();
        service = newService;
    }
    serviceId = service.id;

    // 3. Create Appointment with Double-Booking Check
    const start = new Date(startAt);
    const duration = service.duration_minutes || 60;
    const end = new Date(start.getTime() + duration * 60000);

    try {
        const result = await db.transaction(async (tx) => {
            // Check for overlaps
            const conflict = await tx.query.Appointment.findFirst({
                where: and(
                    eq(Appointment.structureId, structureId),
                    inArray(Appointment.status, ['confirmed', 'locked']),
                    lt(Appointment.start_at, end),
                    gt(Appointment.end_at, start)
                )
            });

            if (conflict) {
                throw new Error('SLOT_TAKEN');
            }

            const cancelToken = crypto.randomBytes(32).toString('hex');
            const accessToken = crypto.randomBytes(32).toString('hex');

            const [appointment] = await tx.insert(Appointment).values({
                    structureId,
                    serviceId,
                    beneficiaryId: beneficiary.id,
                    start_at: start,
                    end_at: end,
                    mode: 'presentiel',
                    status: 'confirmed',
                    cancel_token_hash: hash(cancelToken),
                    access_token_hash: hash(accessToken)
            }).returning();

            return {
                appointment,
                cancelToken
            };
        }, {
            isolationLevel: 'serializable'
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
