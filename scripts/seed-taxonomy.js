import prisma from '../api/_utils/prisma.js';

/**
 * Canonical categories matching api/data/taxonomy.json.
 * This script seeds the AidCategory table with the 13 standard categories.
 */
const categories = [
  { slug: 'papiers-citoyennete', label: 'Papiers - Citoyenneté' },
  { slug: 'famille', label: 'Famille' },
  { slug: 'social-sante', label: 'Social - Santé' },
  { slug: 'personnes-agees', label: 'Personnes âgées' },
  { slug: 'handicap', label: 'Handicap' },
  { slug: 'travail-formation', label: 'Travail - Formation' },
  { slug: 'logement', label: 'Logement' },
  { slug: 'transports', label: 'Transports' },
  { slug: 'argent', label: 'Argent - Impôts' },
  { slug: 'justice', label: 'Justice' },
  { slug: 'etranger', label: 'Étranger' },
  { slug: 'loisirs', label: 'Loisirs - Sport - Culture' },
  { slug: 'lgbtqi-plus', label: 'LGBTQI+' },
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
  { slug: 'lgbtqi', label: 'LGBTQI+' },
];

async function main() {
  console.log('🌱 Seeding taxonomy (canonical slugs)...');

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
