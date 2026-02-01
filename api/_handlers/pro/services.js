
import prisma from '../../_utils/prisma.js';
import { verifyProToken, ROLE, logProAudit } from '../../lib/pro-auth.js';
import slugify from '@sindresorhus/slugify';

export default async function handler(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Missing token" });
    }

    const decoded = verifyProToken(authHeader.split(' ')[1]);
    if (!decoded) {
        return res.status(401).json({ error: "Invalid token" });
    }

    const { structureId, role, userId } = decoded;
    // Basic RBAC
    const canWrite = role === ROLE.STRUCTURE_ADMIN || role === ROLE.SUPERADMIN;

    try {
        if (req.method === 'GET') {
            // LIST
            const services = await prisma.service.findMany({
                where: { structureId },
                orderBy: { createdAt: 'desc' }
            });
            return res.status(200).json(services);

        } else if (req.method === 'POST') {
            // CREATE
            if (!canWrite) return res.status(403).json({ error: "Forbidden: Admins only" });

            const { name, description_falc, duration_minutes, modes, audiences } = req.body;
            if (!name) return res.status(400).json({ error: "Name is required" });

            const baseSlug = slugify(name);
            let slug = baseSlug;
            // Simple uniqueness check/retry loop or suffix
            let count = 0;
            while (await prisma.service.findUnique({ where: { structureId_slug: { structureId, slug } } })) {
                count++;
                slug = `${baseSlug}-${count}`;
            }

            const service = await prisma.service.create({
                data: {
                    structureId,
                    name,
                    slug,
                    description_falc,
                    duration_minutes: duration_minutes ? parseInt(duration_minutes) : null,
                    modes: modes || [],
                    audiences: audiences || [],
                    required_docs: []
                }
            });

            await logProAudit('SERVICE_CREATED', userId, structureId, { serviceId: service.id }, req.socket.remoteAddress);
            return res.status(201).json(service);

        } else if (req.method === 'PUT') {
            // UPDATE
            if (!canWrite) return res.status(403).json({ error: "Forbidden: Admins only" });
            const { id } = req.query;
            const { name, description_falc, duration_minutes, modes, audiences, is_active } = req.body;

            // Ensure ownership
            const existing = await prisma.service.findFirst({ where: { id, structureId } });
            if (!existing) return res.status(404).json({ error: "Service not found" });

            const updated = await prisma.service.update({
                where: { id },
                data: {
                    name,
                    description_falc,
                    duration_minutes,
                    modes,
                    audiences,
                    is_active
                }
            });

            await logProAudit('SERVICE_UPDATED', userId, structureId, { serviceId: id }, req.socket.remoteAddress);
            return res.status(200).json(updated);

        } else if (req.method === 'DELETE') {
            // DELETE
            if (!canWrite) return res.status(403).json({ error: "Forbidden: Admins only" });
            const { id } = req.query;

            // Ensure ownership
            const existing = await prisma.service.findFirst({ where: { id, structureId } });
            if (!existing) return res.status(404).json({ error: "Service not found" });

            await prisma.service.delete({ where: { id } });
            await logProAudit('SERVICE_DELETED', userId, structureId, { serviceId: id }, req.socket.remoteAddress);
            return res.status(200).json({ success: true });
        } else {
            return res.status(405).json({ error: "Method not allowed" });
        }

    } catch (e) {
        console.error("Services API Error", e);
        return res.status(500).json({ error: "Internal Error" });
    }
}
