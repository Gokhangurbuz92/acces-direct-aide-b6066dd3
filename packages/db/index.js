/**
 * @ada/db — Prisma Client Singleton
 *
 * Usage (from api/ or packages/):
 *   import { prisma } from '@ada/db';
 *
 * This is a LIGHTWEIGHT re-export. The full sophisticated singleton
 * (with env loading, placeholder detection) remains in api/_utils/prisma.js
 * for backward compatibility. This export is for NEW code in packages/.
 *
 * For existing code in api/, keep using: import prisma from '../_utils/prisma.js'
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = /** @type {any} */ (globalThis);

/**
 * Prisma Client singleton instance.
 * In development, the client is cached on globalThis to survive HMR.
 */
export const prisma =
    globalForPrisma.__ada_prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.__ada_prisma = prisma;
}

// Re-export Prisma types and enums for convenience
export { PrismaClient } from '@prisma/client';

export default prisma;
