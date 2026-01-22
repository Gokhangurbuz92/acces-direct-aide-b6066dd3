import fs from 'fs';
import path from 'path';

const categories = [
    'logement', 'sante', 'emploi', 'etudes-formation', 'famille', 'handicap', 'budget-impots', 'mobilite-transport', 'justice', 'immigration-integration', 'numerique', 'retraite', 'energie'
];

const situations = [
    'je-cherche-un-logement', 'je-suis-au-chomage', 'je-suis-etudiant', 'je-suis-parent', 'je-suis-en-situation-de-handicap', 'je-suis-etranger', 'je-suis-senior', 'j-ai-des-difficultes-financieres', 'je-cherche-des-soins', 'je-cherche-une-formation', 'j-ai-besoin-daide-numerique'
];

const providers = {
    NATIONAL: ['CAF', 'État', 'Pôle Emploi', 'Assurance Retraite', 'Ameli', 'CNOUS'],
    REGION: ['Région Grand Est', 'SNCF / Grand Est', 'ARTE'],
    DEPARTMENT: ['Collectivité européenne d\'Alsace (CeA)', 'Département du Bas-Rhin', 'Département du Haut-Rhin'],
    CITY: ['Ville de Strasbourg', 'Ville de Mulhouse', 'Ville de Colmar', 'Ville de Haguenau']
};

const templates = [
    {
        title: "Aide au logement {city}",
        summary: "Aide pour payer votre loyer ou vos charges à {city}.",
        cat: "logement"
    },
    {
        title: "Bourse {level} pour les {audience}",
        summary: "Soutien financier pour vos études ou votre formation au niveau {level}.",
        cat: "etudes-formation"
    },
    {
        title: "Aide à la mobilité {city}",
        summary: "Réduction sur les transports en commun ou aide au permis de conduire à {city}.",
        cat: "mobilite-transport"
    },
    {
        title: "Secours financier d'urgence {city}",
        summary: "Une aide exceptionnelle pour faire face à un coup dur financier à {city}.",
        cat: "budget-impots"
    },
    {
        title: "Accompagnement numérique {city}",
        summary: "Des ateliers ou du matériel pour vous aider avec l'informatique à {city}.",
        cat: "numerique"
    }
];

const items: any[] = [];

// 1. National (120)
for (let i = 0; i < 120; i++) {
    const provider = providers.NATIONAL[i % providers.NATIONAL.length];
    items.push({
        title: `Aide Nationale ${i + 1} - ${provider}`,
        summary: `Une aide de niveau national gérée par ${provider} pour soutenir les citoyens dans leurs démarches de ${categories[i % categories.length]}.`,
        providerName: provider,
        providerType: "NATIONAL_BODY",
        geoLevel: "NATIONAL",
        geoCodes: ["FR"],
        statut: "publie",
        categoryId: categories[i % categories.length], // We'll map these slugs to IDs in the seed script
        situations: [situations[i % situations.length]],
        officialUrl: "https://www.service-public.fr",
        published_at: new Date().toISOString()
    });
}

// 2. Region Grand Est (60)
for (let i = 0; i < 60; i++) {
    const provider = providers.REGION[i % providers.REGION.length];
    items.push({
        title: `Aide Régionale Grand Est ${i + 1} - ${provider}`,
        summary: `Soutien de la Région Grand Est pour ${categories[(i + 2) % categories.length]} destiné aux habitants du territoire.`,
        providerName: provider,
        providerType: "REGION",
        geoLevel: "REGION",
        geoCodes: ["FR-GES"],
        statut: "publie",
        categoryId: categories[(i + 2) % categories.length],
        situations: [situations[(i + 1) % situations.length]],
        officialUrl: "https://www.grandest.fr",
        published_at: new Date().toISOString()
    });
}

// 3. Bas-Rhin (40)
for (let i = 0; i < 40; i++) {
    const provider = providers.DEPARTMENT[i % providers.DEPARTMENT.length];
    items.push({
        title: `Aide Départementale Bas-Rhin ${i + 1} - ${provider}`,
        summary: `Dispositif du Bas-Rhin pour aider à ${categories[(i + 4) % categories.length]}.`,
        providerName: provider,
        providerType: "DEPARTMENT",
        geoLevel: "DEPARTMENT",
        geoCodes: ["FR-67"],
        statut: "publie",
        categoryId: categories[(i + 4) % categories.length],
        situations: [situations[(i + 2) % situations.length]],
        officialUrl: "https://www.bas-rhin.fr",
        published_at: new Date().toISOString()
    });
}

// 4. Haut-Rhin (40)
for (let i = 0; i < 40; i++) {
    const provider = providers.DEPARTMENT[i % providers.DEPARTMENT.length];
    items.push({
        title: `Aide Départementale Haut-Rhin ${i + 1} - ${provider}`,
        summary: `Dispositif du Haut-Rhin pour aider à ${categories[(i + 6) % categories.length]}.`,
        providerName: provider,
        providerType: "DEPARTMENT",
        geoLevel: "DEPARTMENT",
        geoCodes: ["FR-68"],
        statut: "publie",
        categoryId: categories[(i + 6) % categories.length],
        situations: [situations[(i + 3) % situations.length]],
        officialUrl: "https://www.haut-rhin.fr",
        published_at: new Date().toISOString()
    });
}

fs.writeFileSync(path.join(process.cwd(), 'data/seed/aids.initial.json'), JSON.stringify(items, null, 2));
console.log(`Generated ${items.length} items in data/seed/aids.initial.json`);
