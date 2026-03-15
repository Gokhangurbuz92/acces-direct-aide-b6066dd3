import { db } from '../src/db/index.js';
import { Aide, AidCategory, LifeSituation } from '../src/db/schema.js';
import fs from 'fs';
import path from 'path';

function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/g, '');
}

async function main() {
    const dataPath = path.join(process.cwd(), 'data/seed/aids.initial.json');
    const aids = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    console.log(`Seeding ${aids.length} aids...`);

    const categories = await db.query.AidCategory.findMany();
    const situations = await db.query.LifeSituation.findMany();

    const categoryMap = new Map(categories.map(c => [c.slug, c.id]));
    const situationMap = new Map(situations.map(s => [s.slug, s.id]));

    for (const aid of aids) {
        const slug = slugify(aid.title);
        const categoryId = categoryMap.get(aid.categoryId);

        const data = {
            titre: aid.title,
            slug,
            summary_falc: aid.summary,
            categoryId: categoryId,
            providerName: aid.providerName,
            providerType: aid.providerType,
            statut: 'publie',
            published_at: new Date(aid.published_at),
            departements: aid.geoCodes.filter(g => g.startsWith('FR-')).map(g => g.replace('FR-', '')),
            territoires: aid.geoCodes,
        };

        await db.insert(Aide).values(data).onConflictDoUpdate({
            target: [Aide.slug],
            set: data,
        });
    }

    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
