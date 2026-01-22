
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Enabling 'unaccent' extension...");
    try {
        await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS unaccent;`;
        console.log("✅ Extension 'unaccent' enabled.");
    } catch (e) {
        console.error("❌ Failed to enable extension:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
