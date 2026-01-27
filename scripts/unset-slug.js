
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    // Find first aide
    const aide = await prisma.aide.findFirst();
    if (!aide) {
        console.log('No aide found');
        return;
    }
    console.log(`Unsetting slug for Aide: ${aide.id} (${aide.slug})`);
    await prisma.aide.update({
        where: { id: aide.id },
        data: { slug: null }
    });
    console.log('Done. Slug is now null.');
}

main().finally(() => prisma.$disconnect());
