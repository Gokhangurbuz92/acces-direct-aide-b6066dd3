import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function slugify(text: string) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

async function main() {
    const dataPath = path.join(process.cwd(), 'data/seed/aids.initial.json');
    const aids = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    console.log(`Seeding ${aids.length} aids...`);

    // Cache taxonomies
    const categories = await prisma.aidCategory.findMany();
    const situations = await prisma.lifeSituation.findMany();

    const categoryMap = new Map(categories.map(c => [c.slug, c.id]));
    const situationMap = new Map(situations.map(s => [s.slug, s.id]));

    for (const aid of aids) {
        const slug = slugify(aid.title);

        // Resolve relations
        const categoryId = categoryMap.get(aid.categoryId);
        const situationIds = aid.situations.map((s: string) => situationMap.get(s)).filter(Boolean);

        await prisma.aide.upsert({
            where: { slug: slug },
            update: {
                titre: aid.title,
                summary_falc: aid.summary,
                categoryId: categoryId,
                situations: {
                    set: situationIds.map((id: string) => ({ id }))
                },
                providerName: aid.providerName,
                providerType: aid.providerType,
                statut: "publie",
                published_at: new Date(aid.published_at),
                departements: aid.geoCodes.filter((g: string) => g.startsWith('FR-')).map((g: string) => g.replace('FR-', '')),
                territoires: aid.geoCodes
            },
            create: {
                titre: aid.title,
                slug: slug,
                summary_falc: aid.summary,
                categoryId: categoryId,
                situations: {
                    connect: situationIds.map((id: string) => ({ id }))
                },
                providerName: aid.providerName,
                providerType: aid.providerType,
                statut: "publie",
                published_at: new Date(aid.published_at),
                departements: aid.geoCodes.filter((g: string) => g.startsWith('FR-')).map((g: string) => g.replace('FR-', '')),
                territoires: aid.geoCodes
            },
        });
    }

    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
