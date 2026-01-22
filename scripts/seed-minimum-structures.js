
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const structures = [
    // STRASBOURG & CUS (67)
    {
        nom: "France Services - Strasbourg Gare",
        slug: "france-services-strasbourg-gare",
        type_structure: "France Services",
        adresse: "Place de la Gare",
        code_postal: "67000",
        ville: "Strasbourg",
        departement: "67",
        telephone: "03 88 00 00 00",
        email: "gare@franceservices.gouv.fr",
        site_web: "https://www.france-services.gouv.fr",
        horaires: "Lundi au vendredi : 9h-12h, 14h-17h",
        summary_falc: "Un endroit pour vous aider avec vos papiers sur internet. On peut vous aider pour la CAF, les impôts, ou l'assurance maladie. C'est gratuit et ouvert à tout le monde.",
        services: ["Aide administrative", "Internet gratuit", "Conseil"],
        statut: "publie",
        accessibilite_pmr: true,
        mots_cles: ["aide", "internet", "papiers", "gare"]
    },
    {
        nom: "CCAS de Strasbourg",
        slug: "ccas-strasbourg-centre",
        type_structure: "CCAS",
        adresse: "1 Place de l'Étoile",
        code_postal: "67000",
        ville: "Strasbourg",
        departement: "67",
        telephone: "03 68 98 50 00",
        summary_falc: "Le CCAS aide les personnes de Strasbourg qui ont des difficultés. Ils aident pour manger, pour le logement ou pour les factures. Il faut être Strasbourgeois.",
        services: ["Aide sociale", "Domiciliation", "Aide alimentaire"],
        statut: "publie",
        accessibilite_pmr: true,
        mots_cles: ["mairie", "social", "argent", "aide"]
    },
    {
        nom: "Emmaüs Mundolsheim",
        slug: "emmaus-mundolsheim",
        type_structure: "Association",
        adresse: "4 Rue d'Archiere",
        code_postal: "67450",
        ville: "Mundolsheim",
        departement: "67",
        telephone: "03 88 19 07 20",
        summary_falc: "Un grand magasin où on vend des habits, des meubles et des livres pas chers. L'argent sert à aider les personnes qui n'ont pas de maison.",
        services: ["Vente solidaire", "Don de meubles"],
        statut: "publie",
        accessibilite_pmr: true,
        mots_cles: ["meubles", "habits", "solidaire", "pas cher"]
    },
    {
        nom: "Restos du Coeur - Strasbourg Cronenbourg",
        slug: "restos-du-coeur-cronenbourg",
        type_structure: "Association",
        adresse: "10 Rue de Cronenbourg",
        code_postal: "67200",
        ville: "Strasbourg",
        departement: "67",
        summary_falc: "On donne de la nourriture aux personnes qui n'ont pas assez d'argent pour manger. Il faut s'inscrire avant de venir.",
        services: ["Aide alimentaire", "Café chaud"],
        statut: "publie",
        accessibilite_pmr: false,
        mots_cles: ["manger", "nourriture", "gratuit", "social"]
    },
    {
        nom: "CAF du Bas-Rhin",
        slug: "caf-bas-rhin-strasbourg",
        type_structure: "CAF",
        adresse: "22 Route de l'Hôpital",
        code_postal: "67000",
        ville: "Strasbourg",
        departement: "67",
        telephone: "3230",
        summary_falc: "C'est ici qu'on demande les aides pour les enfants (APL, Prime d'activité). On peut voir un conseiller sur rendez-vous.",
        services: ["Prestations sociales", "Conseil famille"],
        statut: "publie",
        accessibilite_pmr: true,
        mots_cles: ["argent", "apl", "enfant", "declaration"]
    },
    // COLMAR & ALENTOURS (68)
    {
        nom: "France Services - Colmar Europe",
        slug: "france-services-colmar-europe",
        type_structure: "France Services",
        adresse: "Avenue de l'Europe",
        code_postal: "68000",
        ville: "Colmar",
        departement: "68",
        summary_falc: "Une équipe vous aide pour vos démarches en ligne. Près de chez vous à Colmar.",
        services: ["Aide administrative", "Informatique"],
        statut: "publie",
        accessibilite_pmr: true,
        mots_cles: ["aide", "colmar", "pref", "caf"]
    },
    {
        nom: "CCAS de Colmar",
        slug: "ccas-colmar",
        type_structure: "CCAS",
        adresse: "1 Place de la Mairie",
        code_postal: "68000",
        ville: "Colmar",
        departement: "68",
        summary_falc: "L'aide sociale de la ville de Colmar pour les personnes âgées et les familles fragiles.",
        services: ["Social", "Seniors"],
        statut: "publie",
        accessibilite_pmr: true,
        mots_cles: ["mairie", "colmar", "aide"]
    },
    {
        nom: "Secours Populaire - Haut-Rhin",
        slug: "secours-populaire-colmar",
        type_structure: "Association",
        adresse: "Rue de la Baguette",
        code_postal: "68000",
        ville: "Colmar",
        departement: "68",
        summary_falc: "Aide pour les vacances, pour l'école et pour manger. Travaille avec des bénévoles.",
        services: ["Aide alimentaire", "Vacances"],
        statut: "publie",
        accessibilite_pmr: true,
        mots_cles: ["populaire", "aide", "vetements"]
    },
    // MULHOUSE (68)
    {
        nom: "Cité de la Solidarité - Mulhouse",
        slug: "cite-solidarite-mulhouse",
        type_structure: "Hub Social",
        adresse: "40 Rue du Ralliement",
        code_postal: "68100",
        ville: "Mulhouse",
        departement: "68",
        summary_falc: "Plusieurs associations au même endroit pour aider les personnes à Mulhouse. Accueil et conseil.",
        services: ["Orientation", "Accueil"],
        statut: "publie",
        accessibilite_pmr: true,
        mots_cles: ["social", "mulhouse", "accueil"]
    },
    {
        nom: "France Travail Mulhouse Dreyfus",
        slug: "france-travail-mulhouse-dreyfus",
        type_structure: "France Travail",
        adresse: "Rue Dreyfus",
        code_postal: "68100",
        ville: "Mulhouse",
        departement: "68",
        summary_falc: "Pour trouver un travail à Mulhouse. On vous aide pour votre CV et vos recherches.",
        services: ["Emploi", "Formation"],
        statut: "publie",
        accessibilite_pmr: true,
        mots_cles: ["travail", "chomage", "cv"]
    }
];

// Generation function for France Services (often one per canton)
const villesBasRhin = ["Haguenau", "Sélestat", "Molsheim", "Saverne", "Wissembourg", "Illkirch", "Schiltigheim", "Bischwiller", "Obernai", "Bischheim", "Erstein", "Brumath", "Lingolsheim", "Hoenheim"];
const villesHautRhin = ["Altkirch", "Thann", "Guebwiller", "Rixheim", "Wittenheim", "Kingersheim", "Saint-Louis", "Ensisheim", "Cernay", "Huningue", "Sainte-Marie-aux-Mines"];

for (const ville of villesBasRhin) {
    structures.push({
        nom: `France Services - ${ville}`,
        slug: `france-services-${ville.toLowerCase().replace(/\s/g, '-')}`,
        type_structure: "France Services",
        ville: ville,
        departement: "67",
        code_postal: "67" + Math.floor(Math.random() * 900 + 100),
        summary_falc: `Un accueil pour vous aider dans vos démarches administratives à ${ville}.`,
        services: ["Aide administrative", "Numérique"],
        statut: "publie",
        accessibilite_pmr: true,
        mots_cles: ["proximite", "service public", ville]
    });
    structures.push({
        nom: `CCAS de ${ville}`,
        slug: `ccas-${ville.toLowerCase().replace(/\s/g, '-')}`,
        type_structure: "CCAS",
        ville: ville,
        departement: "67",
        summary_falc: `Le service social de la ville de ${ville}.`,
        services: ["Solidarité", "Social"],
        statut: "publie",
        accessibilite_pmr: true,
        mots_cles: ["mairie", ville]
    });
}

for (const ville of villesHautRhin) {
    structures.push({
        nom: `France Services - ${ville}`,
        slug: `france-services-${ville.toLowerCase().replace(/\s/g, '-')}`,
        type_structure: "France Services",
        ville: ville,
        departement: "68",
        summary_falc: `Accès aux services publics à ${ville}.`,
        services: ["Aide administrative", "Numérique"],
        statut: "publie",
        accessibilite_pmr: true,
        mots_cles: ["proximite", "service public", ville]
    });
}

// Add more variety to reach 80
const extraTypes = ["Point Conseil Budget", "Maison de Région", "Mission Locale", "Antenne CPAM", "Épicerie Sociale", "Centre Social", "Maison de la Justice", "Bureau de Poste", "Point Justice"];
for (let i = 0; i < 40; i++) {
    const type = extraTypes[i % extraTypes.length];
    const dept = i % 2 === 0 ? "67" : "68";
    const ville = dept === "67" ? villesBasRhin[i % villesBasRhin.length] : villesHautRhin[i % villesHautRhin.length];
    structures.push({
        nom: `${type} de ${ville}`,
        slug: `${type.toLowerCase().replace(/\s/g, '-')}-${ville.toLowerCase().replace(/\s/g, '-')}-${i}`,
        type_structure: type,
        ville: ville,
        departement: dept,
        summary_falc: `Une aide spécialisée (${type}) pour les habitants de ${ville}.`,
        services: ["Conseil", "Aide"],
        statut: "publie",
        accessibilite_pmr: true,
        mots_cles: [type.toLowerCase(), ville.toLowerCase()]
    });
}

// Ensure unique slugs if any collisions
const uniqueStructures = [];
const slugs = new Set();
for (const s of structures) {
    if (!slugs.has(s.slug)) {
        slugs.add(s.slug);
        uniqueStructures.push(s);
    }
}

async function main() {
    console.log('Seeding ' + uniqueStructures.length + ' structures...');
    for (const sData of uniqueStructures) {
        await prisma.structure.upsert({
            where: { slug: sData.slug },
            update: sData,
            create: sData,
        });
    }
    console.log('Seeding structures complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
