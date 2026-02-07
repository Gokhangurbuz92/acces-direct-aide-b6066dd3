import prisma from '../api/_utils/prisma.js';



// Category mapping from legacy strings to slugs
const CATEGORY_MAP = {
    'Logement': 'logement',
    'Santé': 'sante',
    'Famille': 'famille',
    'Handicap': 'handicap',
    'Emploi': 'emploi',
    'Budget/Dettes': 'budget-dettes',
    'Retraite/Seniors': 'sante', // Map to sante or create specific category
    'Urgence': 'social',
    'Etrangers/Administratif': 'etrangers',
    'Mobilite/Transport': 'mobilite',
};

// Function to map category string to category ID
async function getCategoryId(categorie) {
    if (!categorie) return null;

    const slug = CATEGORY_MAP[categorie] || categorie.toLowerCase().replace(/[\/\s]+/g, '-');
    const category = await prisma.aidCategory.findUnique({ where: { slug } });
    return category?.id || null;
}

// Function to ensure published_at is set
function ensurePublished(aideData) {
    if (aideData.statut === 'publie' && !aideData.published_at) {
        return { ...aideData, published_at: new Date() };
    }
    return aideData;
}

async function main() {
    console.log('🌱 Starting aides seed with taxonomy linking...');

    // Import the aides data
    const { default: aidesModule } = await import('./seed-minimum-aides-data.js');
    const aides = aidesModule || [];

    console.log(`📦 Processing ${aides.length} aides...`);

    let created = 0;
    let updated = 0;

    for (const aideData of aides) {
        // Get category ID from taxonomy
        const categoryId = await getCategoryId(aideData.categorie);

        // Prepare data with taxonomy link
        const data = ensurePublished({
            ...aideData,
            categoryId,
            // Keep legacy categorie for backwards compatibility
        });

        // Upsert the aide
        const existing = await prisma.aide.findUnique({ where: { slug: aideData.slug } });

        await prisma.aide.upsert({
            where: { slug: aideData.slug },
            update: data,
            create: data,
        });

        if (existing) {
            updated++;
        } else {
            created++;
        }
    }

    console.log(`✅ Aides seed complete: ${created} created, ${updated} updated`);

    // Verify published count
    const publishedCount = await prisma.aide.count({ where: { statut: 'publie' } });
    console.log(`📊 Published aides: ${publishedCount}`);
}

main()
    .catch((e) => {
        console.error('❌ Error seeding aides:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
