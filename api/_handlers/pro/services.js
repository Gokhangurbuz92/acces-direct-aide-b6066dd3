
import prisma from '../../_utils/prisma.js';
import { logProAudit } from '../../lib/pro-auth.js';
import { AUTH_ROLE, requireProAuth, requireProStructureContext } from '../../_utils/auth.js';
import slugify from '@sindresorhus/slugify';
/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */

async function handler(req, res) {
    const proCtx = requireProStructureContext(req, res);
    if (!proCtx) return;

    const { structureId, role, userId } = proCtx;
    // Basic RBAC
    const canWrite = role === AUTH_ROLE.STRUCTURE_ADMIN || role === AUTH_ROLE.SUPERADMIN;

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
            const existing = await prisma.service.findUnique({ where: { id: String(id) } });
            if (!existing) return res.status(404).json({ error: "Service not found" });
            if (existing.structureId !== structureId) return res.status(403).json({ error: "Forbidden" });

            const updated = await prisma.service.update({
                where: { id: String(id) },
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
            const existing = await prisma.service.findUnique({ where: { id: String(id) } });
            if (!existing) return res.status(404).json({ error: "Service not found" });
            if (existing.structureId !== structureId) return res.status(403).json({ error: "Forbidden" });

            await prisma.service.delete({ where: { id: String(id) } });
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

export default requireProAuth(handler);
