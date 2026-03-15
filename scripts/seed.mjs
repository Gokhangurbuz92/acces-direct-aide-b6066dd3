import crypto from 'node:crypto';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

/**
 * 🍬 SEED ENGINE — Accès Direct Aide
 *
 * Peuple la DB locale avec des données réalistes pour permettre
 * une navigation browser complète sans erreurs 500.
 *
 * Usage:
 *   node scripts/seed.mjs
 *
 * Requiert:
 *   - PostgreSQL local ou Docker (docker compose up -d)
 *   - DATABASE_URL dans .env.local
 */

const CATEGORIES = ['logement', 'emploi', 'sante', 'famille', 'transport', 'alimentation', 'numerique', 'juridique'];
const VILLES = [
    { ville: 'Paris', cp: '75001', dep: '75' },
    { ville: 'Marseille', cp: '13001', dep: '13' },
    { ville: 'Lyon', cp: '69001', dep: '69' },
    { ville: 'Toulouse', cp: '31000', dep: '31' },
    { ville: 'Bordeaux', cp: '33000', dep: '33' },
    { ville: 'Lille', cp: '59000', dep: '59' },
    { ville: 'Nantes', cp: '44000', dep: '44' },
    { ville: 'Strasbourg', cp: '67000', dep: '67' },
];
const STRUCTURE_TYPES = ['CCAS', 'MDPH', 'CAF', 'Pôle Emploi', 'CPAM', 'Mission Locale', 'Association', 'Mairie'];

function slugify(text) {
    return text.toLowerCase()
        .replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i')
        .replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u').replace(/[ç]/g, 'c')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const uuid = () => crypto.randomUUID();
const now = new Date();

// ─── SEED DATA ──────────────────────────────────────────────

const aides = [
    { titre: "Aide au Logement (APL)", categorie: "logement", cest_quoi: "L'aide personnalisée au logement (APL) est une aide financière destinée à réduire le montant de votre loyer.", pour_qui: "Locataires, colocataires ou résidents en foyer.", ce_que_ca_aide: "Réduction du loyer mensuel jusqu'à 300€/mois selon la situation.", lien_demande: "https://www.caf.fr/allocataires/droits-et-prestations/s-informer-sur-les-aides/logement-et-cadre-de-vie/les-aides-au-logement" },
    { titre: "RSA (Revenu de Solidarité Active)", categorie: "emploi", cest_quoi: "Le RSA assure un revenu minimum aux personnes sans ressources ou avec des ressources faibles.", pour_qui: "Toute personne de plus de 25 ans (ou parent isolé dès 18 ans).", ce_que_ca_aide: "Montant forfaitaire de 607€/mois pour une personne seule.", lien_demande: "https://www.caf.fr/allocataires/droits-et-prestations/s-informer-sur-les-aides/solidarite-et-insertion/le-rsa" },
    { titre: "Complémentaire Santé Solidaire (C2S)", categorie: "sante", cest_quoi: "La C2S est une aide pour payer vos dépenses de santé sans avance de frais.", pour_qui: "Personnes à revenus modestes.", ce_que_ca_aide: "Prise en charge à 100% des frais de santé (dentaire, optique, auditif inclus).", lien_demande: "https://www.ameli.fr/assure/droits-demarches/difficultes-acces-droits-soins/complementaire-sante-solidaire" },
    { titre: "Allocation de Rentrée Scolaire (ARS)", categorie: "famille", cest_quoi: "L'ARS aide les familles à financer les dépenses de la rentrée scolaire.", pour_qui: "Familles avec enfants scolarisés de 6 à 18 ans.", ce_que_ca_aide: "De 398€ à 434€ par enfant selon l'âge.", lien_demande: "https://www.caf.fr/" },
    { titre: "Prime d'activité", categorie: "emploi", cest_quoi: "La prime d'activité est un complément de revenu pour les travailleurs modestes.", pour_qui: "Salariés ou travailleurs indépendants aux revenus modestes.", ce_que_ca_aide: "Complément de revenu variable selon la situation familiale.", lien_demande: "https://www.caf.fr/" },
    { titre: "Aide Juridictionnelle", categorie: "juridique", cest_quoi: "Prise en charge totale ou partielle des frais de justice.", pour_qui: "Toute personne dont les ressources sont insuffisantes pour faire valoir ses droits.", ce_que_ca_aide: "Prise en charge des honoraires d'avocat et frais de procédure.", lien_demande: "https://www.justice.fr/" },
    { titre: "Pass Navigo Solidaire", categorie: "transport", cest_quoi: "Tarif réduit sur le Pass Navigo pour les personnes à faibles revenus.", pour_qui: "Résidents d'Île-de-France à revenus modestes.", ce_que_ca_aide: "Réduction de 50% à 75% sur le Pass Navigo.", lien_demande: "https://www.solidaritetransport.fr/" },
    { titre: "Aide alimentaire (CCAS)", categorie: "alimentation", cest_quoi: "Distribution de colis alimentaires et accès à des épiceries solidaires.", pour_qui: "Personnes en difficulté financière.", ce_que_ca_aide: "Accès gratuit ou à prix réduit à des denrées alimentaires.", lien_demande: null },
    { titre: "Chèque Énergie", categorie: "logement", cest_quoi: "Le chèque énergie aide à payer les factures d'énergie ou les travaux de rénovation.", pour_qui: "Ménages à revenus modestes.", ce_que_ca_aide: "De 48€ à 277€ par an.", lien_demande: "https://www.chequeenergie.gouv.fr/" },
    { titre: "Pass Numérique", categorie: "numerique", cest_quoi: "Accès à des formations numériques gratuites dans des lieux de médiation.", pour_qui: "Toute personne en difficulté avec le numérique.", ce_que_ca_aide: "Formations gratuites pour apprendre à utiliser internet, les démarches en ligne.", lien_demande: null },
    { titre: "Allocation Adulte Handicapé (AAH)", categorie: "sante", cest_quoi: "Revenu minimum garanti pour les personnes en situation de handicap.", pour_qui: "Personnes avec un taux d'incapacité ≥ 80% (ou 50-79% avec restriction d'accès à l'emploi).", ce_que_ca_aide: "Jusqu'à 971€/mois.", lien_demande: "https://www.service-public.fr/" },
    { titre: "Garantie Jeunes / Contrat d'Engagement Jeune", categorie: "emploi", cest_quoi: "Accompagnement intensif vers l'emploi pour les jeunes.", pour_qui: "Jeunes de 16 à 25 ans ni en emploi, ni en études, ni en formation.", ce_que_ca_aide: "Allocation mensuelle + accompagnement personnalisé.", lien_demande: "https://www.1jeune1solution.gouv.fr/" },
];

const structures = VILLES.flatMap((v, vi) =>
    STRUCTURE_TYPES.slice(0, 3 + (vi % 3)).map((type, ti) => ({
        id: uuid(),
        nom: `${type} de ${v.ville}`,
        type_structure: type,
        adresse: `${10 + ti} rue de la République`,
        code_postal: v.cp,
        ville: v.ville,
        departement: v.dep,
        telephone: `0${1 + vi}${40 + ti}${10 + vi}${20 + ti}${30 + vi}`,
        email: `contact@${type.toLowerCase().replace(/\s/g, '')}-${v.ville.toLowerCase()}.fr`,
        site_web: `https://${type.toLowerCase().replace(/\s/g, '')}-${v.ville.toLowerCase()}.fr`,
        horaires: 'Lundi-Vendredi 9h-12h / 14h-17h',
        services: ['Accueil', 'Orientation', 'Accompagnement'],
        publics_accueillis: ['Tout public'],
        categories_aidees: [CATEGORIES[vi % CATEGORIES.length]],
        statut: 'publie',
        status: 'actif',
        slug: slugify(`${type}-${v.ville}`),
        description_courte: `${type} situé au cœur de ${v.ville}, accueillant tout public pour l'accompagnement aux droits sociaux.`,
        mots_cles: [type.toLowerCase(), v.ville.toLowerCase(), 'aide sociale'],
        updatedAt: now,
    }))
);

const demarches = [
    { titre: "Demander le RSA", categorie: "emploi", description_courte: "Faire une demande de Revenu de Solidarité Active auprès de la CAF.", pour_qui: "Personnes sans emploi ou à très faibles revenus.", lien_officiel: "https://www.caf.fr/" },
    { titre: "Inscription à Pôle Emploi", categorie: "emploi", description_courte: "S'inscrire comme demandeur d'emploi pour bénéficier de l'ARE.", pour_qui: "Toute personne ayant perdu un emploi.", lien_officiel: "https://www.pole-emploi.fr/" },
    { titre: "Demander la CMU-C / C2S", categorie: "sante", description_courte: "Obtenir la Complémentaire Santé Solidaire pour couvrir vos frais médicaux.", pour_qui: "Personnes à faibles revenus.", lien_officiel: "https://www.ameli.fr/" },
    { titre: "Renouveler sa carte d'identité", categorie: "juridique", description_courte: "Procédure pour obtenir ou renouveler une carte nationale d'identité.", pour_qui: "Tout citoyen français.", lien_officiel: "https://www.service-public.fr/" },
    { titre: "Déclarer un changement de situation", categorie: "famille", description_courte: "Informer la CAF d'un changement de situation familiale ou professionnelle.", pour_qui: "Allocataires CAF.", lien_officiel: "https://www.caf.fr/" },
    { titre: "Demander un logement social", categorie: "logement", description_courte: "Faire une demande de logement social (HLM) en ligne.", pour_qui: "Personnes à revenus modestes.", lien_officiel: "https://www.demande-logement-social.gouv.fr/" },
    { titre: "Obtenir un titre de séjour", categorie: "juridique", description_courte: "Démarche pour demander ou renouveler un titre de séjour.", pour_qui: "Ressortissants étrangers résidant en France.", lien_officiel: "https://www.service-public.fr/" },
    { titre: "Demander l'AAH", categorie: "sante", description_courte: "Constituer un dossier auprès de la MDPH pour l'Allocation Adulte Handicapé.", pour_qui: "Personnes en situation de handicap.", lien_officiel: "https://www.service-public.fr/" },
];

const actualites = [
    { titre: "Revalorisation des aides sociales en 2026", contenu: "Le gouvernement a annoncé une revalorisation de 3,5% des principales prestations sociales à partir du 1er avril 2026. Cette mesure concerne le RSA, l'AAH, les allocations familiales et l'ASS.", source: "service-public.fr" },
    { titre: "Nouveau guichet unique pour les démarches en ligne", contenu: "Un portail unifié simplifiera l'accès aux démarches administratives dès juillet 2026. Les usagers pourront y suivre l'avancement de leurs dossiers en temps réel.", source: "gouvernement.fr" },
    { titre: "Plan Grand Froid : les dispositifs d'hébergement mobilisés", contenu: "Face aux températures glaciales, les préfectures activent le plan Grand Froid. Des places d'hébergement supplémentaires sont ouvertes dans toutes les grandes villes.", source: "solidarites.gouv.fr" },
    { titre: "L'aide au permis de conduire élargie aux plus de 25 ans", contenu: "Jusqu'ici réservée aux 18-25 ans, l'aide financière pour le permis B est désormais accessible à tous les demandeurs d'emploi sans condition d'âge.", source: "pole-emploi.fr" },
    { titre: "MaPrimeRénov' 2026 : les nouveautés", contenu: "Les plafonds de MaPrimeRénov' sont rehaussés pour encourager la rénovation énergétique des logements les plus énergivores. Les copropriétés sont désormais éligibles.", source: "ecologie.gouv.fr" },
];

const guides = [
    { titre: "Comment demander le RSA : guide pas à pas", categorie: "emploi", resume_falc: "Ce guide explique simplement comment faire une demande de RSA étape par étape." },
    { titre: "Comprendre ses droits au logement", categorie: "logement", resume_falc: "Ce guide aide à comprendre les aides au logement et comment en bénéficier." },
    { titre: "S'orienter dans le système de santé", categorie: "sante", resume_falc: "Ce guide explique comment accéder aux soins quand on a de faibles revenus." },
];

const outils = [
    { titre: "Simulateur RSA", type: "simulateur", categorie: "emploi", resume_falc: "Un outil pour estimer le montant de votre RSA." },
    { titre: "Calculatrice d'APL", type: "simulateur", categorie: "logement", resume_falc: "Estimez le montant de votre aide au logement." },
    { titre: "Modèle de lettre de recours", type: "modele", categorie: "juridique", resume_falc: "Un modèle prêt à l'emploi pour contester une décision administrative." },
];

const dispositifs = [
    { titre: "Contrat d'Engagement Jeune (CEJ)", description_falc: "Un accompagnement intensif pour les jeunes sans emploi avec une allocation mensuelle.", public: ['16-25 ans'], montant: "Jusqu'à 520€/mois" },
    { titre: "Plan 1 Logement pour Tous", description_falc: "Programme national pour augmenter l'offre de logements accessibles.", public: ['Tout public'], montant: "Variable" },
    { titre: "France Travail", description_falc: "L'opérateur public de l'emploi, nouveau nom de Pôle Emploi.", public: ["Demandeurs d'emploi"], montant: "ARE variable" },
];

async function main() {
    // Dynamic import for ESM compatibility with Drizzle
    const { db } = await import('../src/db/index.js');
    const schema = await import('../src/db/schema.js');

    console.log('🍬 SEED ENGINE — Accès Direct Aide');
    console.log('⏳ Peuplement de la base de données...\n');

    // 1. Aides
    console.log(`  📝 Insertion de ${aides.length} aides...`);
    for (const aide of aides) {
        await db.insert(schema.Aide).values({
            id: uuid(),
            slug: slugify(aide.titre),
            titre: aide.titre,
            categorie: aide.categorie,
            cest_quoi: aide.cest_quoi,
            pour_qui: aide.pour_qui,
            ce_que_ca_aide: aide.ce_que_ca_aide,
            lien_demande: aide.lien_demande,
            statut: 'publie',
            published_at: now,
            quality_score: 80 + Math.floor(Math.random() * 20),
            mots_cles: [aide.categorie, aide.titre.split(' ')[0].toLowerCase()],
            audiences: ['tout-public'],
            documents_necessaires: [],
            territoires: [],
            updatedAt: now,
        }).onConflictDoNothing();
    }

    // 2. Structures
    console.log(`  🏢 Insertion de ${structures.length} structures...`);
    for (const s of structures) {
        await db.insert(schema.Structure).values(s).onConflictDoNothing();
    }

    // 3. Démarches
    console.log(`  📋 Insertion de ${demarches.length} démarches...`);
    for (const d of demarches) {
        await db.insert(schema.Demarche).values({
            id: uuid(),
            titre: d.titre,
            categorie: d.categorie,
            description_courte: d.description_courte,
            pour_qui: d.pour_qui,
            lien_officiel: d.lien_officiel,
            statut: 'publie',
            published_at: now,
            quality_score: 85,
            documents_necessaires: [],
            mots_cles: [d.categorie],
            updatedAt: now,
        }).onConflictDoNothing();
    }

    // 4. Actualités
    console.log(`  📰 Insertion de ${actualites.length} actualités...`);
    for (const a of actualites) {
        await db.insert(schema.Actualite).values({
            id: uuid(),
            titre: a.titre,
            contenu: a.contenu,
            source: a.source,
            slug: slugify(a.titre),
            statut: 'publie',
            published_at: now,
            date_publication: now,
            key_points_falc: [],
            departements: [],
            tags: [a.source],
            score_fiabilite: 90,
            updatedAt: now,
        }).onConflictDoNothing();
    }

    // 5. Guides
    console.log(`  📖 Insertion de ${guides.length} guides...`);
    for (const g of guides) {
        await db.insert(schema.Guide).values({
            id: uuid(),
            slug: slugify(g.titre),
            titre: g.titre,
            categorie: g.categorie,
            resume_falc: g.resume_falc,
            statut: 'publie',
            published_at: now,
            publics: ['tout-public'],
            contexte: [g.categorie],
            mots_cles: [g.categorie],
            sources_urls: [],
            updatedAt: now,
        }).onConflictDoNothing();
    }

    // 6. Outils (ToolboxItem)
    console.log(`  🧰 Insertion de ${outils.length} outils...`);
    for (const o of outils) {
        await db.insert(schema.ToolboxItem).values({
            id: uuid(),
            slug: slugify(o.titre),
            titre: o.titre,
            type: o.type,
            categorie: o.categorie,
            resume_falc: o.resume_falc,
            statut: 'publie',
            published_at: now,
            publics: ['tout-public'],
            updatedAt: now,
        }).onConflictDoNothing();
    }

    // 7. Dispositifs
    console.log(`  🎯 Insertion de ${dispositifs.length} dispositifs...`);
    for (const d of dispositifs) {
        await db.insert(schema.Dispositif).values({
            id: uuid(),
            slug: slugify(d.titre),
            titre: d.titre,
            description_falc: d.description_falc,
            public: d.public,
            montant: d.montant,
            statut: 'publie',
            status: 'actif',
            published_at: now,
            updatedAt: now,
        }).onConflictDoNothing();
    }

    console.log('\n✅ Base de données peuplée avec succès !');
    console.log(`   ${aides.length} aides, ${structures.length} structures, ${demarches.length} démarches`);
    console.log(`   ${actualites.length} actualités, ${guides.length} guides, ${outils.length} outils, ${dispositifs.length} dispositifs`);
    console.log('\n🎉 Ouvrez http://localhost:5173/aides pour vérifier.');

    process.exit(0);
}

main().catch(err => {
    console.error('❌ Erreur de seed :', err);
    process.exit(1);
});
