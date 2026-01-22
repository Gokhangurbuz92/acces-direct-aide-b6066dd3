import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
    { slug: 'logement', label: 'Logement' },
    { slug: 'sante', label: 'Santé' },
    { slug: 'emploi', label: 'Emploi' },
    { slug: 'etudes-formation', label: 'Études & Formation' },
    { slug: 'famille', label: 'Famille' },
    { slug: 'handicap', label: 'Handicap' },
    { slug: 'budget-impots', label: 'Budget & Impôts' },
    { slug: 'mobilite-transport', label: 'Mobilité & Transport' },
    { slug: 'justice', label: 'Justice' },
    { slug: 'immigration-integration', label: 'Immigration & Intégration' },
    { slug: 'numerique', label: 'Numérique' },
    { slug: 'retraite', label: 'Retraite' },
    { slug: 'energie', label: 'Énergie' }
];

const situations = [
    { slug: 'je-cherche-un-logement', label: 'Je cherche un logement' },
    { slug: 'je-suis-au-chomage', label: 'Je suis au chômage' },
    { slug: 'je-suis-etudiant', label: 'Je suis étudiant' },
    { slug: 'je-suis-parent', label: 'Je suis parent' },
    { slug: 'je-suis-en-situation-de-handicap', label: 'Je suis en situation de handicap' },
    { slug: 'je-suis-etranger', label: 'Je suis étranger' },
    { slug: 'je-suis-senior', label: 'Je suis senior' },
    { slug: 'j-ai-des-difficultes-financieres', label: "J'ai des difficultés financières" },
    { slug: 'je-cherche-des-soins', label: 'Je cherche des soins' },
    { slug: 'je-cherche-une-formation', label: 'Je cherche une formation' },
    { slug: 'j-ai-besoin-daide-numerique', label: "J'ai besoin d'aide numérique" }
];

async function main() {
    console.log('Seeding taxonomy...');

    for (const cat of categories) {
        await prisma.aidCategory.upsert({
            where: { slug: cat.slug },
            update: { label: cat.label },
            create: cat,
        });
    }

    for (const sit of situations) {
        await prisma.lifeSituation.upsert({
            where: { slug: sit.slug },
            update: { label: sit.label },
            create: sit,
        });
    }

    console.log('Taxonomy seeded successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
