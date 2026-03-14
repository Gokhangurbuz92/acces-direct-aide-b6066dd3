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

import { db } from '../src/db/index.js';
import { Aide } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';

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

    const dreesAides = await db.query.Aide.findMany({
        where: eq(Aide.providerName, 'drees'),
        columns: {
            id: true,
            slug: true,
            titre: true,
            updatedAt: true,
            content_hash: true,
        },
        orderBy: (t, { desc }) => [desc(t.updatedAt)],
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
                await db.delete(Aide).where(eq(Aide.id, d.id));
            }
            deletedCount++;
        }
    }

    console.log(`\n🏁 ${DRY_RUN ? 'Would delete' : 'Deleted'}: ${deletedCount} duplicate(s)`);
}

main().catch((e) => {
    console.error('Error:', e);
    process.exit(1);
});
