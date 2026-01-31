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

  // Organizations & Establishments
  // France Travail
  const franceTravail = await prisma.organization.upsert({
    where: { slug: 'france-travail' },
    update: {},
    create: {
      slug: 'france-travail',
      nom: 'France Travail',
      description: 'Service public de l\'emploi en France, accompagnement des demandeurs d\'emploi et des entreprises.',
      type_organization: 'service_public',
      site_web_officiel: 'https://www.francetravail.fr',
      territoire_couverture: 'national',
      categories: ['emploi', 'formation'],
      tags: ['pole-emploi', 'service-public', 'emploi'],
      statut: 'publie',
      published_at: new Date(),
    },
  });

  await prisma.establishment.upsert({
    where: { id: 'ft-strasbourg-1' },
    update: {},
    create: {
      id: 'ft-strasbourg-1',
      organizationId: franceTravail.id,
      nom: 'France Travail Strasbourg Centre',
      adresse: '10 Place de la République',
      ville: 'Strasbourg',
      code_postal: '67000',
      departement: '67',
      telephone: '3949',
      email: 'strasbourg.centre@francetravail.fr',
      horaires: 'Lun-Ven: 8h30-12h30, 13h30-16h30',
      services: ['Inscription', 'Accompagnement', 'Ateliers CV'],
      latitude: 48.5839,
      longitude: 7.7455,
      statut: 'actif',
      published_at: new Date(),
    },
  });

  await prisma.establishment.upsert({
    where: { id: 'ft-strasbourg-2' },
    update: {},
    create: {
      id: 'ft-strasbourg-2',
      organizationId: franceTravail.id,
      nom: 'France Travail Strasbourg Neudorf',
      adresse: '15 Rue du Rhin',
      ville: 'Strasbourg',
      code_postal: '67100',
      departement: '67',
      telephone: '3949',
      email: 'strasbourg.neudorf@francetravail.fr',
      horaires: 'Lun-Ven: 9h00-12h00, 14h00-17h00',
      services: ['Inscription', 'Accompagnement', 'Formations'],
      latitude: 48.5734,
      longitude: 7.7621,
      statut: 'actif',
      published_at: new Date(),
    },
  });

  await prisma.establishment.upsert({
    where: { id: 'ft-mulhouse-1' },
    update: {},
    create: {
      id: 'ft-mulhouse-1',
      organizationId: franceTravail.id,
      nom: 'France Travail Mulhouse',
      adresse: '7 Avenue Auguste Wicky',
      ville: 'Mulhouse',
      code_postal: '68100',
      departement: '68',
      telephone: '3949',
      email: 'mulhouse@francetravail.fr',
      horaires: 'Lun-Ven: 8h30-12h30, 13h30-16h30',
      services: ['Inscription', 'Accompagnement', 'Ateliers'],
      latitude: 47.7508,
      longitude: 7.3359,
      statut: 'actif',
      published_at: new Date(),
    },
  });

  // CAF
  const caf = await prisma.organization.upsert({
    where: { slug: 'caf' },
    update: {},
    create: {
      slug: 'caf',
      nom: 'Caisse d\'Allocations Familiales',
      description: 'Organisme de sécurité sociale versant des aides financières aux familles.',
      type_organization: 'service_public',
      site_web_officiel: 'https://www.caf.fr',
      territoire_couverture: 'departmental',
      categories: ['famille', 'logement', 'aide-financiere'],
      tags: ['caf', 'allocations', 'famille'],
      statut: 'publie',
      published_at: new Date(),
    },
  });

  await prisma.establishment.upsert({
    where: { id: 'caf-67-strasbourg' },
    update: {},
    create: {
      id: 'caf-67-strasbourg',
      organizationId: caf.id,
      nom: 'CAF du Bas-Rhin',
      adresse: '5 Rue de Londres',
      ville: 'Strasbourg',
      code_postal: '67000',
      departement: '67',
      telephone: '0810 25 67 10',
      email: 'caf67@caf.fr',
      horaires: 'Lun-Ven: 8h30-16h30 (sur RDV)',
      services: ['Allocations familiales', 'RSA', 'Prime d\'activité', 'APL'],
      latitude: 48.5734,
      longitude: 7.7521,
      statut: 'actif',
      published_at: new Date(),
    },
  });

  await prisma.establishment.upsert({
    where: { id: 'caf-68-mulhouse' },
    update: {},
    create: {
      id: 'caf-68-mulhouse',
      organizationId: caf.id,
      nom: 'CAF du Haut-Rhin',
      adresse: '15 Rue de la Bourse',
      ville: 'Mulhouse',
      code_postal: '68100',
      departement: '68',
      telephone: '0810 25 68 10',
      email: 'caf68@caf.fr',
      horaires: 'Lun-Ven: 8h30-16h30 (sur RDV)',
      services: ['Allocations familiales', 'RSA', 'Prime d\'activité', 'APL'],
      latitude: 47.7467,
      longitude: 7.3389,
      statut: 'actif',
      published_at: new Date(),
    },
  });

  // MDPH
  const mdph = await prisma.organization.upsert({
    where: { slug: 'mdph' },
    update: {},
    create: {
      slug: 'mdph',
      nom: 'Maison Départementale des Personnes Handicapées',
      description: 'Accueil, information et accompagnement des personnes en situation de handicap.',
      type_organization: 'service_public',
      site_web_officiel: 'https://www.mdph.fr',
      territoire_couverture: 'departmental',
      categories: ['handicap', 'aide-sociale'],
      tags: ['mdph', 'handicap', 'accessibilite'],
      statut: 'publie',
      published_at: new Date(),
    },
  });

  await prisma.establishment.upsert({
    where: { id: 'mdph-67' },
    update: {},
    create: {
      id: 'mdph-67',
      organizationId: mdph.id,
      nom: 'MDPH du Bas-Rhin',
      adresse: '6A Rue du Verdon',
      ville: 'Strasbourg',
      code_postal: '67100',
      departement: '67',
      telephone: '0388 76 75 00',
      email: 'accueil@mdph67.fr',
      horaires: 'Lun-Ven: 8h30-12h00, 13h30-17h00',
      services: ['AAH', 'PCH', 'RQTH', 'Carte mobilité inclusion'],
      latitude: 48.5839,
      longitude: 7.7455,
      statut: 'actif',
      published_at: new Date(),
    },
  });

  await prisma.establishment.upsert({
    where: { id: 'mdph-68' },
    update: {},
    create: {
      id: 'mdph-68',
      organizationId: mdph.id,
      nom: 'MDPH du Haut-Rhin',
      adresse: '48 Avenue de la République',
      ville: 'Colmar',
      code_postal: '68000',
      departement: '68',
      telephone: '0389 60 68 10',
      email: 'accueil@mdph68.fr',
      horaires: 'Lun-Ven: 8h30-12h00, 13h30-17h00',
      services: ['AAH', 'PCH', 'RQTH', 'Carte mobilité inclusion'],
      latitude: 48.0779,
      longitude: 7.3584,
      statut: 'actif',
      published_at: new Date(),
    },
  });

  console.log('Organizations & Establishments seeded.');

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
