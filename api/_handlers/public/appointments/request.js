import logger from '../../../_utils/logger.js';
import { db } from '../../../../src/db/index.js';
import { Structure, ConsentLog, AuditLog } from '../../../../src/db/schema.js';
import { eq, and, lt, gt, inArray } from 'drizzle-orm';
import { addMinutes, parseISO } from 'date-fns';
import { encrypt, hash } from '../../../lib/crypto.js';
import { checkRateLimit } from '../../../_utils/auth.js'; // Reuse or move to shared
/**
 * @param {import('../../../_utils/http-types').ApiRequest} req
 * @param {import('../../../_utils/http-types').ApiResponse} res
 */

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const {
        structure_slug,
        service_slug,
        start_at,
        mode,
        beneficiary // { email, phone, firstName, consent: true }
    } = req.body;

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // 1. Validation
    if (!structure_slug || !service_slug || !start_at || !beneficiary || !beneficiary.consent) {
        return res.status(400).json({ error: "Missing fields" });
    }

    // Contact check
    const contactRaw = beneficiary.email || beneficiary.phone;
    if (!contactRaw) {
        return res.status(400).json({ error: "Contact (email or phone) required" });
    }

    // 2. Rate Limit
    // Limit per IP or Contact Hash
    const contactHash = hash(contactRaw);
    const ipCheck = await checkRateLimit(`booking:${ip}`);
    const contactCheck = await checkRateLimit(`booking:${contactHash}`);

    if (!ipCheck.allowed || !contactCheck.allowed) {
        return res.status(429).json({ error: "Too many requests" });
    }

    try {
        // 3. Fetch Structure & Service
        const structure = await db.query.Structure.findFirst({ where: eq(Structure.slug, structure_slug) });
        if (!structure) return res.status(404).json({ error: "Structure not found" });

        const service = await db.query.Service.findFirst({
            where: and(
                eq(Service.structureId, structure.id),
                eq(Service.slug, service_slug)
            )
        });
        if (!service) return res.status(404).json({ error: "Service not found" });

        const startTime = parseISO(start_at);
        const endTime = addMinutes(startTime, service.duration_minutes || 30);

        // 4. Check Availability & Double Booking (Concurrency)
        // Find existing booking
        await db.query.Appointment.findFirst({
            where: and(
                eq(Appointment.structureId, structure.id),
                // Overlap check
                // (StartA < EndB) and (EndA > StartB)
                lt(Appointment.start_at, endTime),
                gt(Appointment.end_at, startTime),
                inArray(Appointment.status, ['confirmed', 'locked'])
            )
        });

        // We need 1 available pro.
        // If we find existing appointments, we must check if *all* pros are busy?
        // Or did the user select a specific pro? API doesn't specify pro selection.
        // Simplified Logic: 
        // We need to Find an Available Pro (Auto-Assign).
        // Fetch all availabilities for this time slot.
        // Filter out those who have conflict.

        // This is complex for a boolean check.
        // Let's assume we find ONE pro and lock them.

        // Get all pros in structure
        const availabilities = await db.query.Availability.findMany({
            where: eq(Availability.structureId, structure.id)
        });

        let assignedProId = null;

        // Check per pro
        for (const avail of availabilities) {
            // Does this pro work at this time? (Re-run logic from slots.js basically)
            // Simplified: Check exceptions and slot rules.
            // For MVP, trust the frontend sent a valid slot returned by /slots?
            // But we must verify backend side against double booking.

            // Check if THIS pro has conflict
            const conflict = await db.query.Appointment.findFirst({
                where: and(
                    eq(Appointment.proId, avail.proId),
                    lt(Appointment.start_at, endTime),
                    gt(Appointment.end_at, startTime),
                    inArray(Appointment.status, ['confirmed', 'locked'])
                )
            });

            if (!conflict) {
                // Found a free pro!
                assignedProId = avail.proId;
                break;
            }
        }

        if (!assignedProId) {
            return res.status(409).json({ error: "Slot no longer available" });
        }

        // 5. Create Beneficiary
        // Lookup by hash?
        let ben = await db.query.Beneficiary.findFirst({
            where: eq(Beneficiary.contact_hash, contactHash)
        });

        if (!ben) {
            const [newBen] = await db.insert(Beneficiary).values({
                    contact_encrypted: encrypt(contactRaw),
                    contact_hash: contactHash,
                    first_name_encrypted: beneficiary.firstName ? encrypt(beneficiary.firstName) : null
            }).returning();
            ben = newBen;
        }
        // If exists, maybe update encrypted contact if needed? 
        // But hash is same, so contact is same.

        // 6. Create Locked Appointment
        const [appointment] = await db.insert(Appointment).values({
                structureId: structure.id,
                serviceId: service.id,
                proId: assignedProId,
                beneficiaryId: ben.id,
                status: 'locked',
                start_at: startTime,
                end_at: endTime,
                mode: mode || 'presentiel',
                lock_expires_at: addMinutes(new Date(), 10), // 10 min lock
                cancel_token_hash: hash(crypto.randomUUID()) // placeholder, real one in confirm? Or here?
        }).returning();

        // 7. Log Consent
        await db.insert(ConsentLog).values({
                policy_version: 'v1',
                policy_hash: 'hash-of-policy-text',
                subject_type: 'beneficiary',
                subject_id: ben.id
        });

        // 8. Audit Log
        await db.insert(AuditLog).values({
                action: 'BOOK_REQUEST',
                actorId: 'beneficiary', // Ensure mapping schema to actorId
                entityType: 'Appointment',
                entityId: appointment.id,
                ip_hash: hash(ip),
                details: JSON.stringify({ structureId: structure.id }) // Serialize to JSON string
        });

        return res.status(201).json({
            appointmentId: appointment.id,
            status: 'locked',
            lockExpiresAt: appointment.lock_expires_at
        });

    } catch (e) {
        logger.error("Booking Request Error", e);
        return res.status(500).json({ error: "Booking failed" });
    }
}
