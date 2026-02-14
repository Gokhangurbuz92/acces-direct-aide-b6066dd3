import { verifyAdmin } from './auth.js';
import { ZodError } from 'zod';

/** @typedef {import('./http-types').ApiRequest} ApiRequest */
/** @typedef {import('./http-types').ApiResponse} ApiResponse */

/**
 * Standardized CRUD operations for Admin.
 * Handles:
 * - Admin Verification
 * - Input Validation (Zod)
 * - Prisma Operations
 * - Standard Responses
 */

/** @param {any} d */
function identity(d) {
    return d;
}

/**
 * @param {ApiRequest} req
 * @param {ApiResponse} res
 * @param {any} prismaDelegate
 * @param {any=} schema
 * @param {(d: any) => any=} transformData
 */
export async function handleAdminCreate(req, res, prismaDelegate, schema, transformData = identity) {
    if (!verifyAdmin(req)) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const body = schema ? schema.parse(req.body) : req.body;
        const data = transformData(body);

        // Handle Slug generation if not present?
        // For now, assume transformData handles it or it's in body.

        const item = await prismaDelegate.create({ data });
        return res.status(201).json(item);
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ error: "Validation Error", details: error.errors });
        }
        throw error; // Let wrapper handle 500/Prisma errors
    }
}

/**
 * @param {ApiRequest} req
 * @param {ApiResponse} res
 * @param {any} prismaDelegate
 * @param {string} id
 * @param {any=} schema
 * @param {(d: any) => any=} transformData
 */
export async function handleAdminUpdate(req, res, prismaDelegate, id, schema, transformData = identity) {
    if (!verifyAdmin(req)) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    if (!id) return res.status(400).json({ error: "Missing ID" });

    try {
        const body = schema ? schema.parse(req.body) : req.body;
        const data = transformData(body);

        const item = await prismaDelegate.update({
            where: { id },
            data
        });
        return res.status(200).json(item);
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ error: "Validation Error", details: error.errors });
        }
        // Prisma P2025 (Not Found) handled by wrapper usually, but good to catch here?
        throw error;
    }
}

/**
 * @param {ApiRequest} req
 * @param {ApiResponse} res
 * @param {any} prismaDelegate
 * @param {string} id
 */
export async function handleAdminDelete(req, res, prismaDelegate, id) {
    if (!verifyAdmin(req)) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    if (!id) return res.status(400).json({ error: "Missing ID" });

    await prismaDelegate.delete({ where: { id } });
    return res.status(200).json({ success: true });
}
