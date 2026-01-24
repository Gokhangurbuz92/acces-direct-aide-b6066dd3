
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { checkRateLimit } from '../api/_utils/rateLimit.js';

// We cannot mock ES modules imports easily without a loader or framework.
// However, rateLimit defaults to allowing in non-prod or if KV fails, usually.
// Or we can rely on the fact that rateLimit.checkRateLimit is what's called.
// Since we can't overwrite it easily, let's just ensure we don't hit the limit
// by using different identifiers if needed, or relying on dev env behavior (Memory Store).

import handler from '../api/_handlers/booking/create.js';

// Mock request/response
const mockRes = () => {
    const res = {};
    res.statusCode = 200; // Default
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

async function run() {
    // Generate a valid encryption key if not set (for crypto lib)
    if (!process.env.ENCRYPTION_KEY) {
        process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
    }

    const prisma = new PrismaClient();
    console.log("Starting Double Booking Test...");

    try {
        // Cleanup first to avoid noise
        await prisma.appointment.deleteMany({ where: { proId: 'TEST-PRO-DB' } });

        // Mock data
        const TEST_DATA = {
            structureId: 'TEST-STRUCT-DB',
            serviceId: 'TEST-SERVICE-DB',
            proId: 'TEST-PRO-DB',
            startAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            contact: 'test@example.com',
            firstName: 'Test'
        };

        const req1 = {
            method: 'POST',
            headers: { 'x-forwarded-for': '127.0.0.1' },
            body: TEST_DATA
        };

        // First Request - Should Succeed
        const res1 = mockRes();
        await handler(req1, res1);

        if (res1.statusCode !== 200) {
            throw new Error(`First booking failed: ${res1.statusCode} ${JSON.stringify(res1.data)}`);
        }
        console.log("✅ First booking created:", res1.data.id);

        // Second Request - Should Fail (409)
        const res2 = mockRes();
        // Use same req object or new one with same body
        const req2 = { ...req1, headers: { 'x-forwarded-for': '127.0.0.2' } }; // Different IP to avoid rate limit hitting 429 instead of 409

        await handler(req2, res2);

        if (res2.statusCode === 409) {
            console.log("✅ Double booking correctly rejected (409):", res2.data.error);
        } else {
            console.error("❌ Double booking failed detection:", res2.statusCode, res2.data);
            process.exit(1);
        }

    } catch (e) {
        console.error("Test Error:", e);
        process.exit(1);
    } finally {
        // Cleanup
        await prisma.appointment.deleteMany({ where: { proId: 'TEST-PRO-DB' } });
        // Clean beneficiary if needed?
        // await prisma.beneficiary.deleteMany({ where: { contact_hash: { not: null } } });
        await prisma.$disconnect();
    }
}

run();
