import logger from '../../_utils/logger.js';
import prisma from '../../_utils/prisma.js';
import crypto from 'crypto';

// In-memory rate limiter (for demo/MVP, usually Redis/KV)
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 5;
const requestLog = new Map();

function cleanUpRateLimit() {
    const now = Date.now();
    for (const [ip, log] of requestLog.entries()) {
        if (now - log.firstRequest > RATE_LIMIT_WINDOW) {
            requestLog.delete(ip);
        }
    }
}
setInterval(cleanUpRateLimit, RATE_LIMIT_WINDOW);
/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    // Rate Limit Check
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    if (!requestLog.has(ip)) {
        requestLog.set(ip, { count: 1, firstRequest: now });
    } else {
        const log = requestLog.get(ip);
        if (now - log.firstRequest > RATE_LIMIT_WINDOW) {
            requestLog.set(ip, { count: 1, firstRequest: now });
        } else {
            log.count++;
            if (log.count > MAX_REQUESTS) {
                return res.status(429).json({ error: "Too many requests. Please try again later." });
            }
        }
    }

    const { structureName, city, type, website, email, message, consent, honeypot } = req.body;

    // Honeypot Check
    if (honeypot) {
        // Silently fail (pretend success)
        return res.status(200).json({ success: true, message: "Request received" });
    }

    // Basic Validation
    if (!structureName || !email || !website || !consent) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

        const request = await prisma.partnershipRequest.create({
            data: {
                structureName,
                city,
                type,
                website,
                email,
                message,
                consent: Boolean(consent),
                ip_hash: ipHash,
                status: 'pending'
            }
        });

        return res.status(200).json({ success: true, id: request.id });
    } catch (e) {
        logger.error("Error creating partnership request", e);
        return res.status(500).json({ error: "Internal server error" });
    }
}
