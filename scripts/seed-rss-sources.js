
import prisma from '../api/_utils/prisma.js';


const sources = [
    {
        name: "Service-Public - Particuliers",
        feed_url: "https://www.service-public.fr/abonnements/rss/actu-actualites-particuliers.rss",
        domain: "service-public.fr",
        trust_level: "OFFICIAL",
        enabled: true
    },
    {
        name: "Info.gouv - Actualités",
        feed_url: "https://www.info.gouv.fr/actualites.rss",
        domain: "info.gouv.fr",
        trust_level: "OFFICIAL",
        enabled: true
    },
    {
        name: "Service-Public - Pro",
        feed_url: "https://www.service-public.fr/abonnements/rss/actu-actu-pro.rss",
        domain: "service-public.fr",
        trust_level: "OFFICIAL",
        enabled: true
    }
];

async function main() {
    console.log('Seeding corrected RSS sources...');
    // Clear old ones to be safe
    await prisma.rssSource.deleteMany({});

    for (const source of sources) {
        await prisma.rssSource.create({
            data: source,
        });
    }
    console.log('RSS sources seeded.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
