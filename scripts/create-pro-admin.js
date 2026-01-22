
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
    console.log("--- Create Pro Admin User ---");

    const email = await question("Email: ");
    const structureSlug = await question("Structure Slug (e.g. structure-pro-test): ");

    // Find Structure
    const structure = await prisma.structure.findUnique({ where: { slug: structureSlug } });
    if (!structure) {
        console.error(`Structure '${structureSlug}' not found.`);
        process.exit(1);
    }

    const password = await question("Password: ");
    if (password.length < 8) {
        console.error("Password too short (8 chars min).");
        process.exit(1);
    }

    const password_hash = await bcrypt.hash(password, 10);

    const user = await prisma.proUser.upsert({
        where: { structureId_email: { structureId: structure.id, email } },
        update: { password_hash, role: 'STRUCTURE_ADMIN', status: 'active' },
        create: {
            structureId: structure.id,
            email,
            password_hash,
            role: 'STRUCTURE_ADMIN',
            status: 'active'
        }
    });

    console.log(`\nUser ${user.email} created as STRUCTURE_ADMIN for ${structure.nom}.`);
    console.log("Details:", user.id);
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
        rl.close();
    });
