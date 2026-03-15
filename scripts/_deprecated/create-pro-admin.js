
import { db } from '../src/db/index.js';
import { Structure, ProUser } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import readline from 'readline';

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
    const structure = await db.query.Structure.findFirst({
        where: eq(Structure.slug, structureSlug),
    });
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

    const [user] = await db.insert(ProUser).values({
        structureId: structure.id,
        email,
        password_hash,
        role: 'STRUCTURE_ADMIN',
        status: 'active',
    }).onConflictDoUpdate({
        target: [ProUser.structureId, ProUser.email],
        set: { password_hash, role: 'STRUCTURE_ADMIN', status: 'active' },
    }).returning();

    console.log(`\nUser ${user.email} created as STRUCTURE_ADMIN for ${structure.nom}.`);
    console.log("Details:", user.id);
}

main()
    .catch(console.error)
    .finally(() => {
        rl.close();
    });
