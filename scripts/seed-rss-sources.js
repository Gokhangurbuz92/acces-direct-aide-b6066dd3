import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const sources = [
    {
        name: "Service-Public - Particuliers",
        feed_url: "https://www.service-public.fr/particuliers/actualites.rss",
        domain: "service-public.fr",
        trust_level: "OFFICIAL",
        enabled: true
    },
    {
        name: "Gouvernement - Actualités",
        feed_url: "https://www.gouvernement.fr/rss",
        domain: "gouvernement.fr",
        trust_level: "OFFICIAL",
        enabled: true
    },
    {
        name: "Service-Public - Professionnels",
        feed_url: "https://www.service-public.fr/professionnels-entreprises/actualites.rss",
        domain: "service-public.fr",
        trust_level: "OFFICIAL",
        enabled: true
    },
    {
        name: "CAF - Actualités",
        feed_url: "https://www.caf.fr/rss/actualites",
        domain: "caf.fr",
        trust_level: "OFFICIAL",
        enabled: true
    },
    {
        name: "Pôle Emploi - Actualités",
        feed_url: "https://www.pole-emploi.fr/rss/actualites.rss",
        domain: "pole-emploi.fr",
        trust_level: "OFFICIAL",
        enabled: false // Disabled by default - verify URL first
    }
];

async function main() {
    console.log('🌱 Seeding RSS sources...');
    
    // Upsert sources (don't delete existing to preserve last_run_at)
    for (const source of sources) {
        const existing = await prisma.rssSource.findUnique({
            where: { feed_url: source.feed_url }
        });

        if (existing) {
            console.log(`  ↻ Updating: ${source.name}`);
            await prisma.rssSource.update({
                where: { feed_url: source.feed_url },
                data: {
                    name: source.name,
                    domain: source.domain,
                    trust_level: source.trust_level,
                    enabled: source.enabled,
                }
            });
        } else {
            console.log(`  ✓ Creating: ${source.name}`);
            await prisma.rssSource.create({
                data: source,
            });
        }
    }
    
    const total = await prisma.rssSource.count();
    const enabled = await prisma.rssSource.count({ where: { enabled: true } });
    
    console.log(`✅ RSS sources seeded: ${total} total, ${enabled} enabled`);
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
