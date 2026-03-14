import { db } from '../src/db/index.js';
import { Aide, AidCategory } from '../src/db/schema.js';
import { eq, sql } from 'drizzle-orm';

const CATEGORY_MAP = {
    'Logement': 'logement',
    'Santé': 'sante',
    'Famille': 'famille',
    'Handicap': 'handicap',
    'Emploi': 'emploi',
    'Budget/Dettes': 'budget-dettes',
    'Retraite/Seniors': 'sante',
    'Urgence': 'social',
    'Etrangers/Administratif': 'etrangers',
    'Mobilite/Transport': 'mobilite',
};

async function getCategoryId(categorie) {
    if (!categorie) return null;
    const slug = CATEGORY_MAP[categorie] || categorie.toLowerCase().replace(/[\/\s]+/g, '-');
    const category = await db.query.AidCategory.findFirst({ where: eq(AidCategory.slug, slug) });
    return category?.id || null;
}

function ensurePublished(aideData) {
    if (aideData.statut === 'publie' && !aideData.published_at) {
        return { ...aideData, published_at: new Date() };
    }
    return aideData;
}

async function main() {
    console.log('🌱 Starting aides seed with taxonomy linking...');

    const { default: aidesModule } = await import('./seed-minimum-aides-data.js');
    const aides = aidesModule || [];

    console.log(`📦 Processing ${aides.length} aides...`);

    let created = 0;
    let updated = 0;

    for (const aideData of aides) {
        const categoryId = await getCategoryId(aideData.categorie);
        const data = ensurePublished({ ...aideData, categoryId });

        const existing = await db.query.Aide.findFirst({ where: eq(Aide.slug, aideData.slug) });

        await db.insert(Aide).values(data).onConflictDoUpdate({
            target: [Aide.slug],
            set: data,
        });

        if (existing) { updated++; } else { created++; }
    }

    console.log(`✅ Aides seed complete: ${created} created, ${updated} updated`);

    const [result] = await db.select({ c: sql`count(*)::int` }).from(Aide).where(eq(Aide.statut, 'publie'));
    console.log(`📊 Published aides: ${result?.c ?? 0}`);
}

main()
    .catch((e) => {
        console.error('❌ Error seeding aides:', e);
        process.exit(1);
    });
