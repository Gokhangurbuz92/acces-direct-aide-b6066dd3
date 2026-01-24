
import { PrismaClient } from '@prisma/client';
import { addDays, format, startOfDay, endOfDay } from 'date-fns';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { structureId } = req.query; // Or slug? Route says /availability/:structureId?
    // Route in routes.js: { path: 'public/availability', match: 'prefix', handler: ... }
    // URL: /api/public/availability?structureId=...

    if (!structureId) {
        return res.status(400).json({ error: "Structure ID required" });
    }

    try {
        // Fetch all pros in structure
        const availabilities = await prisma.availability.findMany({
            where: { structureId }
        });

        // 1. Get Pro Availability Definition
        // For MVP we merge all pros of the structure or take the first one?
        // Or we use a structure-wide availability if defined?
        // Let's assume structure has one main schedule or we aggregate.
        // For simpler MVP: Check if any Availability record exists for this structure.

        const availabilityRecords = await prisma.availability.findMany({
            where: { structureId }
        });

        // Default Schedule if none defined
        let schedule = {
            mon: ["09:00-12:00", "14:00-17:00"],
            tue: ["09:00-12:00", "14:00-17:00"],
            wed: ["09:00-12:00", "14:00-17:00"],
            thu: ["09:00-12:00", "14:00-17:00"],
            fri: ["09:00-12:00", "14:00-16:00"],
            sat: [],
            sun: []
        };

        if (availabilityRecords.length > 0) {
            // Merge logic or pick first? Pick first for MVP P1.
            const record = availabilityRecords[0];
            if (record.slots_json) {
                schedule = { ...schedule, ...record.slots_json };
            }
        }

        const startDate = startOfDay(new Date());
        const endDate = endOfDay(addDays(startDate, 14)); // 2 weeks

        // 2. Get Existing Appointments
        const appointments = await prisma.appointment.findMany({
            where: {
                structureId,
                start_at: { gte: startDate, lte: endDate },
                status: { in: ['confirmed', 'locked'] }
            }
        });

        const slots = [];
        const days = 14;
        const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

        for (let i = 0; i < days; i++) {
            const date = addDays(startDate, i);
            const dateStr = format(date, 'yyyy-MM-dd');
            const dayKey = dayKeys[date.getDay()];
            const dayRanges = schedule[dayKey] || [];

            for (const range of dayRanges) {
                // Parse range "09:00-12:00"
                const [startStr, endStr] = range.split('-');
                if(!startStr || !endStr) continue;

                const rangeStart = new Date(`${dateStr}T${startStr}:00`);
                const rangeEnd = new Date(`${dateStr}T${endStr}:00`);

                // Generate 1h slots within range
                let slotStart = rangeStart;
                while (slotStart < rangeEnd) {
                    const slotEnd = new Date(slotStart.getTime() + 60 * 60000); // 60 mins
                    if (slotEnd > rangeEnd) break;

                    // Check collision
                    const isTaken = appointments.some(app => {
                        return (app.start_at < slotEnd && app.end_at > slotStart);
                    });

                    if (!isTaken) {
                        slots.push({
                            start: slotStart.toISOString(),
                            end: slotEnd.toISOString()
                        });
                    }

                    slotStart = slotEnd;
                }
            }
        }

        return res.status(200).json(slots);

    } catch (e) {
        console.error("Availability Error", e);
        return res.status(500).json({ error: "Internal Error" });
    }
}
