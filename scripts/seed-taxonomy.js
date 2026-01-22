import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  { slug: 'logement', label: 'Logement' },
  { slug: 'sante', label: 'Santé' },
  { slug: 'famille', label: 'Famille' },
  { slug: 'handicap', label: 'Handicap' },
  { slug: 'emploi', label: 'Emploi' },
  { slug: 'finances', label: 'Finances' },
  { slug: 'budget-dettes', label: 'Budget/Dettes' },
  { slug: 'justice', label: 'Justice' },
  { slug: 'mobilite', label: 'Mobilité' },
  { slug: 'etrangers', label: 'Étrangers' },
  { slug: 'identite', label: 'Identité' },
  { slug: 'citoyennete', label: 'Citoyenneté' },
  { slug: 'social', label: 'Social' },
  { slug: 'transport', label: 'Transport' },
  { slug: 'energie', label: 'Énergie' },
  { slug: 'travail', label: 'Travail' },
  { slug: 'droit', label: 'Droit' },
  { slug: 'etudes', label: 'Études' },
  { slug: 'scolarite', label: 'Scolarité' },
];

const situations = [
  { slug: 'etudiant', label: 'Étudiant' },
  { slug: 'senior', label: 'Senior' },
  { slug: 'chomage', label: 'Au chômage' },
  { slug: 'handicap', label: 'En situation de handicap' },
  { slug: 'famille-monoparentale', label: 'Famille monoparentale' },
  { slug: 'isolement', label: 'Isolement social' },
  { slug: 'etranger', label: 'Étranger' },
  { slug: 'jeune', label: 'Jeune (16-25 ans)' },
  { slug: 'travailleur', label: 'Travailleur' },
  { slug: 'retraite', label: 'Retraité' },
  { slug: 'precarite', label: 'Précarité' },
  { slug: 'parent', label: 'Parent' },
  { slug: 'aidant', label: 'Aidant familial' },
  { slug: 'refugie', label: 'Réfugié' },
  { slug: 'sdf', label: 'Sans domicile fixe' },
];

async function main() {
  console.log('🌱 Seeding taxonomy...');

  // Seed categories
  console.log('📦 Creating categories...');
  for (const cat of categories) {
    await prisma.aidCategory.upsert({
      where: { slug: cat.slug },
      update: { label: cat.label },
      create: cat,
    });
  }
  console.log(`✅ Created ${categories.length} categories`);

  // Seed life situations
  console.log('👥 Creating life situations...');
  for (const sit of situations) {
    await prisma.lifeSituation.upsert({
      where: { slug: sit.slug },
      update: { label: sit.label },
      create: sit,
    });
  }
  console.log(`✅ Created ${situations.length} life situations`);

  console.log('✨ Taxonomy seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding taxonomy:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
