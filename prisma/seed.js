import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding...');

  // Create minimal taxonomy
  const category = await prisma.aidCategory.upsert({
    where: { slug: 'aide-financiere' },
    update: {},
    create: {
      slug: 'aide-financiere',
      label: 'Aide Financière',
    },
  });

  const situation = await prisma.lifeSituation.upsert({
    where: { slug: 'je-suis-etudiant' },
    update: {},
    create: {
      slug: 'je-suis-etudiant',
      label: 'Je suis étudiant',
    },
  });

  console.log('Taxonomy seeded.');

  // Aides
  for (let i = 1; i <= 10; i++) {
    const slug = `aide-test-${i}`;
    await prisma.aide.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        titre: `Aide Test ${i}`,
        statut: 'publie',
        published_at: new Date(),
        categoryId: category.id,
        cest_quoi: `Description pour aide test ${i}. C'est une aide importante.`,
        pour_qui: 'Tout le monde',
      },
    });
  }
  console.log('Aides seeded.');

  // Demarches
  for (let i = 1; i <= 10; i++) {
    const slug = `demarche-test-${i}`;
    await prisma.demarche.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        titre: `Démarche Test ${i}`,
        statut: 'publie',
        published_at: new Date(),
        categoryId: category.id,
        description_courte: `Courte description de la démarche ${i}`,
      },
    });
  }
  console.log('Demarches seeded.');

  // Structures
  for (let i = 1; i <= 20; i++) {
    const siret = `000000000000${i.toString().padStart(2, '0')}`;
    await prisma.structure.upsert({
      where: { siret },
      update: {},
      create: {
        nom: `Structure Test ${i}`,
        siret,
        statut: 'actif', // Visible status
        status: 'actif', // Internal status
        ville: 'Paris',
        departement: '75',
        type_structure: 'Association',
        email: `contact@structure${i}.test`,
      },
    });
  }
  console.log('Structures seeded.');

  // Actualites
  for (let i = 1; i <= 10; i++) {
    const slug = `actu-test-${i}`;
    await prisma.actualite.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        titre: `Actualité Test ${i}`,
        statut: 'publie',
        published_at: new Date(),
        date_publication: new Date(),
        contenu: 'Ceci est une actualité de test.',
        type_actu: 'info',
        source_name: 'Test Source',
      },
    });
  }
  console.log('Actualites seeded.');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
