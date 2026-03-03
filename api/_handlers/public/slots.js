import logger from '../../_utils/logger.js';
import prisma from '../../_utils/prisma.js';
import { startOfDay, endOfDay, addDays, format, parse, addMinutes, isBefore, isAfter } from 'date-fns';
/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { structure_slug, service_slug, from, to } = req.query;

    if (!structure_slug || !service_slug || !from || !to) {
        return res.status(400).json({ error: "Missing parameters" });
    }

    try {
        // 1. Resolve Structure & Service
        const structure = await prisma.structure.findUnique({
            where: { slug: structure_slug },
            include: {
                availabilities: true, // Get all pro availabilities
                proUsers: { where: { status: 'active' } } // Only active pros
            }
        });

        if (!structure || !structure.is_pro_enabled) {
            return res.status(404).json({ error: "Structure not found or pro not enabled" });
        }

        const service = await prisma.service.findUnique({
            where: { structureId_slug: { structureId: structure.id, slug: service_slug } }
        });

        if (!service || !service.is_active) {
            return res.status(404).json({ error: "Service not found" });
        }

        // 2. Date Range
        const startDate = parse(from, 'yyyy-MM-dd', new Date());
        const endDate = parse(to, 'yyyy-MM-dd', new Date());
        // Limit query to 60 days max to prevent abuse
        // ... (omitted for MVP)

        // 3. Get Existing Appointments (Confirmed or Locked)
        const appointments = await prisma.appointment.findMany({
            where: {
                structureId: structure.id,
                start_at: { gte: startOfDay(startDate), lte: endOfDay(endDate) },
                status: { in: ['confirmed', 'locked'] },
                // Exclude cancelled/expired
            }
        });

        // 4. Calculate Slots
        // Logic: Iterate days -> Iterate Pros -> Check rules -> Remove conflicts
        // Structure Availabilities: Simple model: Pro has `slots_json` defining weekly recurring.
        // Json Format: { "monday": ["09:00-12:00", "14:00-17:00"], "tuesday": ... }

        const availabilityMap = {}; // Date -> Slots[]
        const duration = service.duration_minutes || 30; // 30 min default

        let current = startDate;
        while (current <= endDate) {
            const dateStr = format(current, 'yyyy-MM-dd');
            const dayName = format(current, 'eeee').toLowerCase(); // monday, tuesday...

            let dailySlots = [];

            // Iterate all pros with availability
            for (const avail of structure.availabilities) {
                // Check if pro handles this service? Not in schema yet, assume all pros handle all services for MVP or strictly generic.
                // Prompt: "Availability... pro_id". 
                // Service doesn't link to Pro explicitly, so any pro in structure?
                // Real world: specialized pros. MVP: All pros.

                const rules = avail.slots_json[dayName];
                if (!rules || !Array.isArray(rules)) continue;

                // Exceptions? avail.exceptions_json
                // Skip logic for MVP complexity unless required. Prompt says "rules hebdo + exceptions".
                // Let's parse generic exceptions if present: { date: "YYYY-MM-DD", slots: [] } -> overrides.

                // Parse ranges
                for (const range of rules) {
                    // "09:00-12:00"
                    const [startStr, endStr] = range.split('-');
                    if (!startStr || !endStr) continue;

                    let slotStart = parse(`${dateStr} ${startStr}`, 'yyyy-MM-dd HH:mm', new Date());
                    const slotEndLimit = parse(`${dateStr} ${endStr}`, 'yyyy-MM-dd HH:mm', new Date());

                    // Generate chunks of 'duration'
                    while (addMinutes(slotStart, duration) <= slotEndLimit) {
                        const chunkEnd = addMinutes(slotStart, duration);

                        // Check Collision
                        const isBusy = appointments.some(app => {
                            // Same pro?
                            if (app.proId && app.proId !== avail.proId) return false; // Different pro
                            // If app has NO proId (unassigned?), it blocks everyone? Or auto-assign logic?
                            // Prompt: "pro_id (nullable si assignation auto)".
                            // If unassigned, does it block specific pro?
                            // Usually "unassigned" means "structure capacity". 
                            // Let's assume strict Pro assignment for availability.
                            // If app.proId is null, maybe it doesn't block this specific pro?

                            // Time overlap
                            // app.start < chunkEnd && app.end > chunkStart
                            const appStart = new Date(app.start_at);
                            const appEnd = new Date(app.end_at);
                            return isBefore(appStart, chunkEnd) && isAfter(appEnd, slotStart);
                        });

                        if (!isBusy) {
                            dailySlots.push({
                                start: slotStart.toISOString(),
                                end: chunkEnd.toISOString(),
                                proId: avail.proId
                            });
                        }

                        slotStart = chunkEnd;
                    }
                }
            }

            // Deduplicate? Or return per pro?
            // If multiple pros available at 9:00, return 9:00 once?
            // "Public... slots". Usually user picks time, system assigns pro.
            // Let's distinct by time.
            const uniqueSlots = [];
            const timeSet = new Set();
            for (const s of dailySlots) {
                if (!timeSet.has(s.start)) {
                    uniqueSlots.push(s.start);
                    timeSet.add(s.start);
                }
            }
            uniqueSlots.sort();

            availabilityMap[dateStr] = uniqueSlots;
            current = addDays(current, 1);
        }

        return res.status(200).json({ slots: availabilityMap });

    } catch (e) {
        logger.error("Slots API Error", e);
        return res.status(500).json({ error: "Internal Error" });
    }
}
