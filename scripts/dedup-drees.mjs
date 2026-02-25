/**
 * DREES Deduplication Script
 *
 * Usage:
 *   DRY_RUN=true node scripts/dedup-drees.mjs     # Preview only (default)
 *   DRY_RUN=false node scripts/dedup-drees.mjs    # Actually delete duplicates
 *
 * Finds duplicate aides by normalized title + providerName='drees'.
 * Keeps the one with the "clean" slug (no hash suffix), deletes others.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DRY_RUN = process.env.DRY_RUN !== 'false';

function normalizeTitle(title) {
    return String(title || '')
        .toLowerCase()
        .replace(/[^a-zàâçéèêëïîôùûüÿœæ0-9\s]/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

async function main() {
    console.log(`\n🔍 DREES Deduplication — DRY_RUN=${DRY_RUN}\n`);

    const dreesAides = await prisma.aide.findMany({
        where: { providerName: 'drees' },
        select: {
            id: true,
            slug: true,
            titre: true,
            updatedAt: true,
            content_hash: true,
        },
        orderBy: { updatedAt: 'desc' },
    });

    console.log(`Found ${dreesAides.length} DREES aides total`);

    // Group by normalized title
    const groups = new Map();
    for (const aide of dreesAides) {
        const key = normalizeTitle(aide.titre);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(aide);
    }

    const duplicates = [...groups.entries()].filter(([, items]) => items.length > 1);
    console.log(`Found ${duplicates.length} groups with duplicates\n`);

    let deletedCount = 0;

    for (const [normalizedTitle, items] of duplicates) {
        console.log(`\n📋 "${normalizedTitle}" — ${items.length} items:`);

        // Sort: prefer clean slug (no hash suffix), then most recent
        const sorted = items.sort((a, b) => {
            const aClean = a.slug && !/-[a-f0-9]{6}$/.test(a.slug);
            const bClean = b.slug && !/-[a-f0-9]{6}$/.test(b.slug);
            if (aClean && !bClean) return -1;
            if (!aClean && bClean) return 1;
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });

        const keep = sorted[0];
        const toDelete = sorted.slice(1);

        console.log(`  ✅ KEEP: ${keep.slug} (id: ${keep.id.slice(0, 8)}...)`);
        for (const d of toDelete) {
            console.log(`  ❌ DELETE: ${d.slug} (id: ${d.id.slice(0, 8)}...)`);
            if (!DRY_RUN) {
                await prisma.aide.delete({ where: { id: d.id } });
            }
            deletedCount++;
        }
    }

    console.log(`\n🏁 ${DRY_RUN ? 'Would delete' : 'Deleted'}: ${deletedCount} duplicate(s)`);
    await prisma.$disconnect();
}

main().catch((e) => {
    console.error('Error:', e);
    prisma.$disconnect();
    process.exit(1);
});
