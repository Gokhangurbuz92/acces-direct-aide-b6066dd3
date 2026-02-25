import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const AID_CATEGORY_TAXONOMY = [
  { code: 'LOGEMENT', slug: 'logement', label: 'Logement' },
  { code: 'SANTE', slug: 'sante', label: 'Santé' },
  { code: 'HANDICAP', slug: 'handicap', label: 'Handicap' },
  { code: 'EMPLOI', slug: 'emploi', label: 'Emploi' },
  { code: 'FAMILLE', slug: 'famille', label: 'Famille' },
  { code: 'ETUDES', slug: 'etudes', label: 'Études' },
  { code: 'MOBILITE', slug: 'mobilite', label: 'Mobilité' },
  { code: 'ENERGIE', slug: 'energie', label: 'Énergie' },
  { code: 'ALIMENTATION', slug: 'alimentation', label: 'Alimentation' },
  { code: 'JUSTICE', slug: 'justice', label: 'Justice' },
  { code: 'NUMERIQUE', slug: 'numerique', label: 'Numérique' },
  { code: 'AUTRE', slug: 'autre', label: 'Autre' },
];

const SITUATIONS = [
  { code: 'etudiant', label: 'Étudiant' },
  { code: 'demandeur_emploi', label: "Demandeur d'emploi" },
  { code: 'handicap', label: 'Situation de handicap' },
  { code: 'parent_isole', label: 'Parent isolé' },
  { code: 'jeune_actif', label: 'Jeune actif' },
  { code: 'senior', label: 'Senior' },
  { code: 'faibles_revenus', label: 'Faibles revenus' },
  { code: 'aidant', label: 'Aidant familial' },
  { code: 'sans_domicile', label: 'Sans domicile' },
  { code: 'resident_alsace', label: 'Résident Alsace' },
];

const GOLDEN_AIDS = [
  {
    slug: 'apl-etudiant-strasbourg',
    title: 'APL étudiant à Strasbourg',
    description: "Aide au logement pour réduire le loyer d'un étudiant à Strasbourg.",
    content:
      "L'APL est une aide versée par la CAF pour aider à payer le loyer étudiant. Vérifiez les plafonds de ressources, le type de bail et la localisation du logement à Strasbourg.",
    categoryCode: 'LOGEMENT',
    geoScope: 'DEPARTMENTAL',
    situations: ['etudiant', 'resident_alsace', 'faibles_revenus'],
    keywords: ['apl', 'caf', 'loyer', 'etudiant', 'strasbourg', 'logement'],
    sourceUrl: 'https://www.caf.fr/',
    sourceOrg: 'CAF',
    financials: { min: 50, max: 320, currency: 'EUR', periodicity: 'MONTH' },
    eligibility: { ageMin: 18, studentStatusRequired: true, residence: 'FR' },
  },
  {
    slug: 'visale-garantie-logement-jeunes',
    title: 'Garantie Visale pour les jeunes',
    description: 'Garantie gratuite pour couvrir les loyers impayés.',
    content:
      'Visale sécurise le bailleur et facilite l’accès au logement des jeunes actifs et étudiants.',
    categoryCode: 'LOGEMENT',
    geoScope: 'NATIONAL',
    situations: ['etudiant', 'jeune_actif'],
    keywords: ['visale', 'garantie', 'loyer', 'logement', 'jeune'],
    sourceUrl: 'https://www.visale.fr/',
    sourceOrg: 'Action Logement',
    financials: { type: 'GARANTIE', cap: 'Selon barème Visale' },
    eligibility: { ageMax: 30, residence: 'FR' },
  },
  {
    slug: 'complementaire-sante-solidaire',
    title: 'Complémentaire santé solidaire',
    description: 'Aide pour réduire les dépenses de santé des ménages modestes.',
    content:
      'La complémentaire santé solidaire prend en charge la part complémentaire des dépenses de santé selon les ressources.',
    categoryCode: 'SANTE',
    geoScope: 'NATIONAL',
    situations: ['faibles_revenus'],
    keywords: ['sante', 'css', 'mutuelle', 'soins'],
    sourceUrl: 'https://www.ameli.fr/',
    sourceOrg: 'Assurance Maladie',
    financials: { copay: '0 à faible', currency: 'EUR' },
    eligibility: { resourceCeiling: 'CSS', residence: 'FR' },
  },
  {
    slug: 'prestation-compensation-handicap',
    title: 'Prestation de compensation du handicap (PCH)',
    description: 'Aide financière liée aux besoins de compensation du handicap.',
    content:
      'La PCH finance certaines dépenses liées au handicap: aide humaine, technique, aménagement du logement ou du véhicule.',
    categoryCode: 'HANDICAP',
    geoScope: 'NATIONAL',
    situations: ['handicap'],
    keywords: ['pch', 'handicap', 'mdph', 'compensation'],
    sourceUrl: 'https://www.service-public.fr/',
    sourceOrg: 'Service Public',
    financials: { type: 'VARIABLE', currency: 'EUR' },
    eligibility: { mdphEvaluation: true },
  },
  {
    slug: 'rsa-parent-isole',
    title: 'RSA pour parent isolé',
    description: 'Revenu minimum pour les parents isolés selon ressources.',
    content:
      'Le RSA parent isolé soutient les personnes assumant seules la charge d’un ou plusieurs enfants.',
    categoryCode: 'FAMILLE',
    geoScope: 'NATIONAL',
    situations: ['parent_isole', 'faibles_revenus'],
    keywords: ['rsa', 'parent', 'isole', 'revenu'],
    sourceUrl: 'https://www.caf.fr/',
    sourceOrg: 'CAF',
    financials: { type: 'MENSUEL', currency: 'EUR' },
    eligibility: { isolatedParent: true, residence: 'FR' },
  },
  {
    slug: 'prime-activite-salarie-modeste',
    title: "Prime d'activité pour salarié modeste",
    description: "Complément de revenu pour travailleurs à revenus modestes.",
    content:
      "La prime d'activité est versée par la CAF ou la MSA selon la situation professionnelle et les ressources du foyer.",
    categoryCode: 'EMPLOI',
    geoScope: 'NATIONAL',
    situations: ['jeune_actif', 'faibles_revenus'],
    keywords: ['prime activite', 'emploi', 'salaire'],
    sourceUrl: 'https://www.caf.fr/',
    sourceOrg: 'CAF',
    financials: { type: 'MENSUEL', currency: 'EUR' },
    eligibility: { activityRequired: true, residence: 'FR' },
  },
  {
    slug: 'bourse-crous-alsace',
    title: "Bourse CROUS d'Alsace",
    description: 'Bourse sur critères sociaux pour les étudiants en Alsace.',
    content:
      "La bourse CROUS dépend des revenus du foyer, de l'éloignement et du nombre d'enfants à charge.",
    categoryCode: 'ETUDES',
    geoScope: 'REGIONAL',
    situations: ['etudiant', 'resident_alsace'],
    keywords: ['bourse', 'crous', 'etudiant', 'alsace'],
    sourceUrl: 'https://www.etudiant.gouv.fr/',
    sourceOrg: 'CROUS',
    financials: { type: 'ECHELONS', currency: 'EUR' },
    eligibility: { enrolledInHigherEducation: true },
  },
  {
    slug: 'aide-mobilite-france-travail',
    title: 'Aide à la mobilité France Travail',
    description: 'Prise en charge de frais de déplacement pour retour à l’emploi.',
    content:
      "France Travail peut prendre en charge certains frais de mobilité pour une reprise d'emploi, formation ou concours.",
    categoryCode: 'MOBILITE',
    geoScope: 'NATIONAL',
    situations: ['demandeur_emploi'],
    keywords: ['mobilite', 'france travail', 'transport'],
    sourceUrl: 'https://www.francetravail.fr/',
    sourceOrg: 'France Travail',
    financials: { type: 'REMBOURSEMENT', currency: 'EUR' },
    eligibility: { registeredJobSeeker: true },
  },
  {
    slug: 'cheque-energie-menages-modestes',
    title: 'Chèque énergie pour ménages modestes',
    description: "Aide au paiement des factures d'énergie.",
    content:
      "Le chèque énergie aide à payer l'électricité, le gaz ou d'autres combustibles selon le revenu fiscal de référence.",
    categoryCode: 'ENERGIE',
    geoScope: 'NATIONAL',
    situations: ['faibles_revenus'],
    keywords: ['cheque energie', 'facture', 'gaz', 'electricite'],
    sourceUrl: 'https://chequeenergie.gouv.fr/',
    sourceOrg: 'Ministère de la Transition écologique',
    financials: { min: 48, max: 277, currency: 'EUR', periodicity: 'YEAR' },
    eligibility: { taxReferenceIncome: true },
  },
  {
    slug: 'pass-numerique-inclusion',
    title: 'Pass numérique inclusion',
    description: "Accompagnement et ateliers pour l'autonomie numérique.",
    content:
      'Le pass numérique finance des ateliers pour apprendre les démarches administratives en ligne.',
    categoryCode: 'NUMERIQUE',
    geoScope: 'NATIONAL',
    situations: ['senior', 'faibles_revenus'],
    keywords: ['numerique', 'inclusion', 'atelier', 'demarches en ligne'],
    sourceUrl: 'https://societenumerique.gouv.fr/',
    sourceOrg: 'Société Numérique',
    financials: { type: 'PRISE_EN_CHARGE_ATELIERS' },
    eligibility: { digitalAutonomySupport: true },
  },
];

function seedNow() {
  // Make seeds deterministic for test runs (used by CI + local test DB resets).
  if (process.env.NODE_ENV === 'test') return new Date('2025-01-01T00:00:00.000Z');
  return new Date();
}

function citationsFor(aid) {
  return [
    {
      source: aid.sourceOrg,
      url: aid.sourceUrl,
      checkedAt: seedNow().toISOString(),
      note: 'Placeholder citation for initial grounding',
    },
  ];
}

function stableHash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

async function seedTaxonomy() {
  const categoryMap = new Map();

  for (const category of AID_CATEGORY_TAXONOMY) {
    const created = await prisma.aidCategory.upsert({
      where: { slug: category.slug },
      update: { label: category.label },
      create: { slug: category.slug, label: category.label },
    });
    categoryMap.set(category.code, created);
  }

  await prisma.lifeSituation.upsert({
    where: { slug: 'je-suis-etudiant' },
    update: { label: 'Je suis étudiant' },
    create: {
      slug: 'je-suis-etudiant',
      label: 'Je suis étudiant',
    },
  });

  const situationMap = new Map();
  for (const situation of SITUATIONS) {
    const created = await prisma.situation.upsert({
      where: { code: situation.code },
      update: { label: situation.label },
      create: situation,
    });
    situationMap.set(situation.code, created);
  }

  return { categoryMap, situationMap };
}

async function seedGoldenAids(categoryMap, situationMap) {
  for (const aid of GOLDEN_AIDS) {
    const now = seedNow();
    const category = categoryMap.get(aid.categoryCode) || null;
    const sourceHash = stableHash(`${aid.slug}:${aid.sourceUrl}`);

    const created = await prisma.aide.upsert({
      where: { slug: aid.slug },
      update: {
        titre: aid.title,
        title: aid.title,
        description: aid.description,
        content: aid.content,
        category_code: aid.categoryCode,
        status_code: 'PUBLISHED',
        statut: 'publie',
        published_at: now,
        categoryId: category?.id || null,
        cest_quoi: aid.description,
        pour_qui: aid.situations.join(', '),
        source_url: aid.sourceUrl,
        source_name: aid.sourceOrg,
        source_org: aid.sourceOrg,
        source_hash: sourceHash,
        last_checked: now,
        eligibility: aid.eligibility,
        financials: aid.financials,
        citations: citationsFor(aid),
        qa_score: 95,
        qa_report: { status: 'seeded', reviewed: true },
        geo_scope: aid.geoScope,
        summary_falc: aid.description,
        mots_cles: aid.keywords,
        theme: category?.slug || 'autre',
        sub_theme: aid.categoryCode.toLowerCase(),
      },
      create: {
        slug: aid.slug,
        titre: aid.title,
        title: aid.title,
        description: aid.description,
        content: aid.content,
        category_code: aid.categoryCode,
        status_code: 'PUBLISHED',
        statut: 'publie',
        published_at: now,
        categoryId: category?.id || null,
        cest_quoi: aid.description,
        pour_qui: aid.situations.join(', '),
        source_url: aid.sourceUrl,
        source_name: aid.sourceOrg,
        source_org: aid.sourceOrg,
        source_hash: sourceHash,
        last_checked: now,
        eligibility: aid.eligibility,
        financials: aid.financials,
        citations: citationsFor(aid),
        qa_score: 95,
        qa_report: { status: 'seeded', reviewed: true },
        geo_scope: aid.geoScope,
        summary_falc: aid.description,
        mots_cles: aid.keywords,
        theme: category?.slug || 'autre',
        sub_theme: aid.categoryCode.toLowerCase(),
      },
    });

    for (const code of aid.situations) {
      const situation = situationMap.get(code);
      if (!situation) continue;

      await prisma.aidSituation.upsert({
        where: {
          aidId_situationId: {
            aidId: created.id,
            situationId: situation.id,
          },
        },
        update: {},
        create: {
          aidId: created.id,
          situationId: situation.id,
        },
      });
    }
  }
}

async function seedDemarches(categoryId) {
  const demarchesCatalogue = [
    { slug: 'demander-le-rsa', titre: 'Demander le RSA', description: 'Guide pour ouvrir vos droits au RSA et preparer les justificatifs.' },
    { slug: 'renouveler-cni-passeport', titre: 'Renouveler sa CNI ou son passeport', description: 'Etapes pour prendre rendez-vous et finaliser votre dossier en mairie.' },
    { slug: 'demande-apl', titre: 'Faire une demande d APL', description: 'Parcours pour declarer votre logement et transmettre les pieces utiles.' },
    { slug: 'changement-situation-caf', titre: 'Declarer un changement de situation CAF', description: 'Marche a suivre pour signaler un demenagement, une naissance ou une reprise d emploi.' },
    { slug: 'inscription-france-travail', titre: 'Inscription France Travail', description: 'Comment creer votre espace et valider votre inscription demandeur d emploi.' },
    { slug: 'dossier-mdph', titre: 'Constituer un dossier MDPH', description: 'Checklist des formulaires et certificats pour une demande MDPH complete.' },
    { slug: 'ouvrir-droits-css', titre: 'Ouvrir ses droits a la CSS', description: 'Procedure pour verifier votre eligibilite et envoyer votre dossier CSS.' },
    { slug: 'aide-alimentaire-locale', titre: 'Demander une aide alimentaire locale', description: 'Orientation vers les structures locales et documents a fournir.' },
    { slug: 'logement-social-mise-a-jour', titre: 'Mettre a jour son dossier logement social', description: 'Actions a faire pour renouveler votre demande logement social a temps.' },
    { slug: 'aide-mobilite', titre: 'Demander une aide mobilite', description: 'Etapes pour solliciter un soutien transport ou permis selon votre situation.' },
  ];

  for (const entry of demarchesCatalogue) {
    const now = seedNow();
    await prisma.demarche.upsert({
      where: { slug: entry.slug },
      update: {
        titre: entry.titre,
        statut: 'publie',
        published_at: now,
        categoryId,
        description_courte: entry.description,
      },
      create: {
        slug: entry.slug,
        titre: entry.titre,
        statut: 'publie',
        published_at: now,
        categoryId,
        description_courte: entry.description,
      },
    });
  }
}

async function seedStructures() {
  for (let i = 1; i <= 20; i += 1) {
    const siret = `000000000000${i.toString().padStart(2, '0')}`;
    const slug = `structure-test-${i}`;
    await prisma.structure.upsert({
      where: { siret },
      update: {
        nom: `Structure Test ${i}`,
        slug,
        statut: 'actif',
        status: 'actif',
        ville: 'Paris',
        code_postal: '75001',
        adresse: `${i} rue de Test`,
        departement: '75',
        type_structure: 'association',
        description_courte: `Structure de test ${i} (seed).`,
        accessibilite_pmr: i % 2 === 0,
        horaires: 'Lun-Ven 09:00-17:00',
        telephone: '0102030405',
        email: `contact@structure${i}.test`,
      },
      create: {
        nom: `Structure Test ${i}`,
        slug,
        siret,
        statut: 'actif',
        status: 'actif',
        ville: 'Paris',
        code_postal: '75001',
        adresse: `${i} rue de Test`,
        departement: '75',
        type_structure: 'association',
        description_courte: `Structure de test ${i} (seed).`,
        accessibilite_pmr: i % 2 === 0,
        horaires: 'Lun-Ven 09:00-17:00',
        telephone: '0102030405',
        email: `contact@structure${i}.test`,
      },
    });
  }
}

async function seedActualites() {
  for (let i = 1; i <= 10; i += 1) {
    const slug = `actu-test-${i}`;
    const now = seedNow();
    await prisma.actualite.upsert({
      where: { slug },
      update: {
        titre: `Actualité Test ${i}`,
        statut: 'publie',
        published_at: now,
        date_publication: now,
        contenu: 'Ceci est une actualité de test.',
        resume: 'Résumé: ceci est une actualité de test.',
        type_actu: 'info',
        source_name: 'Test Source',
      },
      create: {
        slug,
        titre: `Actualité Test ${i}`,
        statut: 'publie',
        published_at: now,
        date_publication: now,
        contenu: 'Ceci est une actualité de test.',
        resume: 'Résumé: ceci est une actualité de test.',
        type_actu: 'info',
        source_name: 'Test Source',
      },
    });
  }
}

async function main() {
  const isProduction = process.env.NODE_ENV === 'production' && !process.env.ALLOW_TEST_SEEDS;
  console.log(`Seeding... (env: ${process.env.NODE_ENV || 'development'}, prod guard: ${isProduction ? 'ON' : 'OFF'})`);

  // Taxonomy is always seeded — these are real categories, not test data
  const { categoryMap, situationMap } = await seedTaxonomy();
  console.log(`Taxonomy seeded (${categoryMap.size} categories, ${situationMap.size} situations).`);

  if (isProduction) {
    console.log('⚠️  Production mode — skipping test data (golden aids, test structures, test actualités).');
    console.log('    Set ALLOW_TEST_SEEDS=true to override this guard.');
    console.log('Seeding finished (taxonomy only).');
    return;
  }

  await seedGoldenAids(categoryMap, situationMap);
  console.log(`Golden aids seeded (${GOLDEN_AIDS.length}).`);

  await seedDemarches(categoryMap.get('AUTRE')?.id || null);
  console.log('Demarches seeded.');

  await seedStructures();
  console.log('Structures seeded.');

  await seedActualites();
  console.log('Actualites seeded.');

  console.log('Seeding finished.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
