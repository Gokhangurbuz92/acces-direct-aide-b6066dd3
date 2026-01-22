
import { PrismaClient } from '@prisma/client';
import slugify from '@sindresorhus/slugify';

const prisma = new PrismaClient();

async function backfill() {
    console.log("🚀 Starting Slug Backfill...");

    // 1. Aides
    const aides = await prisma.aide.findMany({ where: { slug: null } });
    console.log(`Found ${aides.length} aides to update.`);
    for (const item of aides) {
        let slug = slugify(item.titre || "sans-titre");
        if (!slug || slug.length < 2) slug = `aide-${item.id.slice(0, 8)}`; // Fallback if slugify fails

        // Check collision loop
        let uniqueSlug = slug;
        let counter = 0;
        while (true) {
            const exists = await prisma.aide.findFirst({
                where: { slug: uniqueSlug }
            });
            // If exists is self, it's fine (though we are updating so slug is null before? No where slug: null)
            // Wait, 'exists' finds ANY record with that slug.
            // Since we are iterating, we haven't written it yet to THIS record (it has null).
            // So if exists is found, it must be ANOTHER record.
            if (!exists) break;

            counter++;
            uniqueSlug = `${slug}-${counter}`;
            if (counter > 50) {
                uniqueSlug = `${slug}-${item.id.slice(0, 8)}`; // Fallback to ID
                // Logic to ensure this is unique too?
                // Unlikely to catch 50 dupes of title + id collision.
                break;
            }
        }

        try {
            await prisma.aide.update({
                where: { id: item.id },
                data: {
                    slug: uniqueSlug,
                    mots_cles: [], // Init empty array if null
                    summary_falc: item.cest_quoi || "" // Migrate cest_quoi to summary as default
                }
            });
        } catch (e) {
            console.error(`Failed to update ${item.id} (${uniqueSlug}): ${e.message}`);
        }
    }

    // 2. Structures
    const structures = await prisma.structure.findMany({ where: { slug: null } });
    console.log(`Found ${structures.length} structures to update.`);
    for (const item of structures) {
        let slug = slugify(item.nom);

        let uniqueSlug = slug;
        let counter = 0;
        while (true) {
            const exists = await prisma.structure.findFirst({ where: { slug: uniqueSlug } });
            if (!exists) break;
            counter++;
            uniqueSlug = `${slug}-${counter}`;
            if (counter > 10) {
                uniqueSlug = `${slug}-${item.id.slice(0, 5)}`;
                break;
            }
        }

        await prisma.structure.update({
            where: { id: item.id },
            data: {
                slug: uniqueSlug,
                mots_cles: [],
                summary_falc: item.description_courte || ""
            }
        });
    }

    // 3. Demarches
    const demarches = await prisma.demarche.findMany({ where: { slug: null } });
    console.log(`Found ${demarches.length} demarches to update.`);
    for (const item of demarches) {
        let slug = slugify(item.titre);

        let uniqueSlug = slug;
        let counter = 0;
        while (true) {
            const exists = await prisma.demarche.findFirst({ where: { slug: uniqueSlug } });
            if (!exists) break;
            counter++;
            uniqueSlug = `${slug}-${counter}`;
            if (counter > 10) {
                uniqueSlug = `${slug}-${item.id.slice(0, 5)}`;
                break;
            }
        }

        await prisma.demarche.update({
            where: { id: item.id },
            data: {
                slug: uniqueSlug,
                mots_cles: [],
                summary_falc: item.description_courte || ""
            }
        });
    }

    console.log("✅ Backfill Complete.");
    await prisma.$disconnect();
}

backfill().catch(e => {
    console.error(e);
    process.exit(1);
});
