
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Connecting to DB...");
        const newsCount = await prisma.actualite.count();
        const aideCount = await prisma.aide.count();

        console.log(`News (Actualite): ${newsCount}`);
        console.log(`Aid (Aide): ${aideCount}`);

        const proofDir = path.join(process.cwd(), 'release/v1.0.0/proofs/00-p0');

        fs.writeFileSync(path.join(proofDir, 'db-news-count.txt'), `SELECT count(*) FROM "Actualite" -> ${newsCount}\n`);
        fs.writeFileSync(path.join(proofDir, 'db-aid-count.txt'), `SELECT count(*) FROM "Aide" -> ${aideCount}\n`);

        console.log("Proofs written.");

    } catch (e) {
        console.error("Error executing DB check:", e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
