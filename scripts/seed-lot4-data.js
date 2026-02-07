
import prisma from '../api/_utils/prisma.js';
import bcrypt from 'bcryptjs';



async function main() {
    const isDev = process.env.NODE_ENV === 'development';
    const isSeedDemo = process.env.SEED_DEMO === 'true';

    if (!isDev && !isSeedDemo) {
        console.error("⛔ SECURITY ERROR: Seeding is only allowed in development (NODE_ENV=development) or with SEED_DEMO=true.");
        process.exit(1);
    }

    console.log("Seeding Lot 4 Data...");

    // 1. Create or Update Structure
    const structureData = {
        nom: "Structure Pro Test",
        slug: "structure-pro-test",
        ville: "Paris",
        code_postal: "75001",
        services: ["Aide administrative"],
        is_pro_enabled: true,
        summary_falc: "Une structure de test pour le module Pro."
    };

    const structure = await prisma.structure.upsert({
        where: { slug: structureData.slug },
        update: structureData,
        create: { ...structureData, status: 'publie' }
    });
    console.log(`Structure created/updated: ${structure.id}`);

    // 2. Create Pro User (Admin) - Use `node scripts/create-pro-admin.js` for secure interactive creation.
    console.log("Structure seeded. To create an admin user, run: node scripts/create-pro-admin.js");
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
