
import prisma from '../../../_utils/prisma.js';
import { verifyProToken, ROLE } from '../../../lib/pro-auth.js';
import { decrypt, hash } from '../../../lib/crypto.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Missing token" });
    }

    const decoded = verifyProToken(authHeader.split(' ')[1]);
    if (!decoded) {
        return res.status(401).json({ error: "Invalid token" });
    }

    const { structureId, role, userId } = decoded;

    // Filters
    const { start_date, end_date, search_hash, id, limit, page } = req.query;

    // Pagination
    const rawLimit = limit && !isNaN(Number(limit)) ? Number(limit) : 100;
    const take = Math.min(Math.max(1, rawLimit), 100);
    const rawPage = page && !isNaN(Number(page)) ? Number(page) : 1;
    const pageNum = Math.max(1, rawPage);
    const skip = (pageNum - 1) * take;

    try {
        const where = {
            structureId: structureId // Tenant Isolation
        };

        if (role === ROLE.PRO) {
            // Can PRO see all structure appointments? 
            // Usually yes if they are admin, but role=PRO might be restrictive.
            // Prompt: "RBAC server-side strict."
            // "Pro cannot see other structure appointments" (verified).
            // But can Pro A see Pro B's appointments in SAME structure?
            // "Tenant isolation strict (structure_id)" implies structure wide.
            // But typical "Pro" access in a structure: shared calendar or personal?
            // Let's assume shared for MVP unless specified "personal only".
            // "Pro UI: Inbox... Availability page set weekly schedule".
            // If availability is personal, maybe Inbox is personal?
            // Prompt (A.2): "Availability / Schedule - pro_id". Availability is linked to pro.
            // Prompt (A.1): "Appointment - pro_id (nullable)".
            // Let's assume default is: see ALL for structure IF role=STRUCTURE_ADMIN.
            // IF role=PRO, maybe only their own?
            // Let's start with Structure-Wide visibility for simplicity, as they are a "Team".
            // But usually privacy implies only admin see all.
            // I will restrict PRO to own unless structure config says otherwise.
            // BUT, `pro_id` is nullable. Who sees unassigned?
            // Let's allow PRO to see unassigned + their own.

            // Actually, prompt doesn't specify intra-structure privacy.
            // "Pro cannot see other structure appointments".
            // I'll stick to structure-level isolation.
        }

        if (start_date && end_date) {
            where.start_at = {
                gte: new Date(start_date),
                lte: new Date(end_date)
            };
        }

        // Search by hash (Blinded lookup)
        if (search_hash) {
            where.beneficiary = {
                contact_hash: search_hash // Exact match on hash
            };
        }

        if (id) {
            where.id = id;
        }

        const appointments = await prisma.appointment.findMany({
            where,
            take,
            skip,
            include: {
                beneficiary: true,
                service: true,
                pro: { select: { email: true, id: true } }
            },
            orderBy: { start_at: 'asc' }
        });

        // Decrypt on the fly
        const sanitized = appointments.map(app => {
            const emailOrPhone = decrypt(app.beneficiary.contact_encrypted);
            const name = app.beneficiary.first_name_encrypted ? decrypt(app.beneficiary.first_name_encrypted) : "";

            let contactMasked = "Hidden";
            if (emailOrPhone && emailOrPhone.includes('@')) {
                const [local, domain] = emailOrPhone.split('@');
                contactMasked = `${local.substring(0, 1)}***@${domain}`;
            } else if (emailOrPhone) {
                contactMasked = `${emailOrPhone.substring(0, 2)}...${emailOrPhone.substring(emailOrPhone.length - 2)}`;
            }

            return {
                id: app.id,
                start_at: app.start_at,
                end_at: app.end_at,
                status: app.status,
                mode: app.mode,
                serviceName: app.service.name,
                proEmail: app.pro ? app.pro.email : null,
                beneficiary: {
                    id: app.beneficiary.id,
                    contactMasked,
                    firstName: name
                }
            };
        });

        return res.status(200).json(sanitized);

    } catch (e) {
        console.error("Pro Inbox Error", e);
        return res.status(500).json({ error: "Internal Error" });
    }
}
