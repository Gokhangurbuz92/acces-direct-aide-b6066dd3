
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    const proofDir = path.join(process.cwd(), 'release/v1.0.0/proofs/01-nav');
    if (!fs.existsSync(proofDir)) fs.mkdirSync(proofDir, { recursive: true });

    try {
        console.log("Checking slugs...");

        // Aide
        const aideCount = await prisma.aide.count({
            where: {
                OR: [
                    { slug: null },
                    { slug: '' }
                ]
            }
        });
        fs.writeFileSync(path.join(proofDir, 'aide-slug-null-count.txt'), `SELECT count(*) FROM "Aide" WHERE slug IS NULL OR slug=''; -> ${aideCount}\n`);
        console.log(`Aide null slugs: ${aideCount}`);

        // Demarche
        const demarcheCount = await prisma.demarche.count({
            where: {
                OR: [
                    { slug: null },
                    { slug: '' }
                ]
            }
        });
        fs.writeFileSync(path.join(proofDir, 'demarche-slug-null-count.txt'), `SELECT count(*) FROM "Demarche" WHERE slug IS NULL OR slug=''; -> ${demarcheCount}\n`);
        console.log(`Demarche null slugs: ${demarcheCount}`);

        // Structure
        const structureCount = await prisma.structure.count({
            where: {
                OR: [
                    { slug: null },
                    { slug: '' }
                ]
            }
        });
        fs.writeFileSync(path.join(proofDir, 'structure-slug-null-count.txt'), `SELECT count(*) FROM "Structure" WHERE slug IS NULL OR slug=''; -> ${structureCount}\n`);
        console.log(`Structure null slugs: ${structureCount}`);

    } catch (e) {
        console.error("Error checking slugs:", e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
