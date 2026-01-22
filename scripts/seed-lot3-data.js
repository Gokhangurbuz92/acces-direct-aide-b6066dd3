
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
    console.log("🌱 Seeding Test Data...");

    // Create/Update a published aide about Logement
    await prisma.aide.upsert({
        where: { slug: 'aide-au-logement-test' },
        update: {
            statut: 'publie',
            titre: 'Aide Spéciale Logement',
            cest_quoi: 'Une aide pour payer le loyer (logement).',
            summary_falc: 'Aide logement simple.',
            slug: 'aide-au-logement-test',
            published_at: new Date()
        },
        create: {
            titre: 'Aide Spéciale Logement',
            slug: 'aide-au-logement-test',
            statut: 'publie',
            cest_quoi: 'Une aide pour payer le loyer (logement).',
            summary_falc: 'Aide logement simple.',
            published_at: new Date(),
            categorie: 'logement'
        }
    });

    // Demarche
    await prisma.demarche.upsert({
        where: { slug: 'demande-logement-social' },
        update: {
            statut: 'publie',
            titre: 'Demande de logement social',
            slug: 'demande-logement-social',
            summary_falc: 'Faire une demande HLM.',
            published_at: new Date()
        },
        create: {
            titre: 'Demande de logement social',
            slug: 'demande-logement-social',
            statut: 'publie',
            summary_falc: 'Faire une demande HLM.',
            published_at: new Date()
        }
    });

    // Structure
    await prisma.structure.upsert({
        where: { slug: 'maison-logement' },
        update: {
            statut: 'publie',
            status: 'actif',
            nom: 'Maison du Logement',
            slug: 'maison-logement',
            summary_falc: 'Association pour le logement.',
            published_at: new Date()
        },
        create: {
            nom: 'Maison du Logement',
            slug: 'maison-logement',
            statut: 'publie',
            status: 'actif',
            summary_falc: 'Association pour le logement.',
            published_at: new Date()
        }
    });

    console.log("✅ Seed complete.");
    await prisma.$disconnect();
}

seed().catch(e => console.error(e));
