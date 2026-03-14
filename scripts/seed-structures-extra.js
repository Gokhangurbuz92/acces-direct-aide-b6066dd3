import { db } from '../src/db/index.js';
import { Structure } from '../src/db/schema.js';

const extraStructures = [
    {
        nom: "CCAS Strasbourg",
        ville: "Strasbourg",
        code_postal: "67000",
        type_structure: "mairie",
        services: ["Aide sociale", "Logement", "Secours d'urgence"],
        mots_cles: ["CCAS", "Social", "Strasbourg"]
    },
    {
        nom: "CPAM du Bas-Rhin",
        ville: "Strasbourg",
        code_postal: "67000",
        type_structure: "cpam",
        services: ["Assurance maladie", "Santé", "Remboursements"],
        mots_cles: ["CPAM", "Santé", "Ameli"]
    },
    {
        nom: "CAF du Bas-Rhin",
        ville: "Strasbourg",
        code_postal: "67000",
        type_structure: "caf",
        services: ["Allocations familiales", "APL", "Prime d'activité"],
        mots_cles: ["CAF", "Allocations", "Famille"]
    },
    {
        nom: "MDPH 67",
        ville: "Strasbourg",
        code_postal: "67000",
        type_structure: "mdph",
        services: ["Handicap", "AAH", "PCH"],
        mots_cles: ["Handicap", "MDPH", "Accessibilité"]
    },
    {
        nom: "Pôle Emploi - Strasbourg Hautepierre",
        ville: "Strasbourg",
        code_postal: "67200",
        type_structure: "france_travail",
        services: ["Emploi", "Chômage", "Formation"],
        mots_cles: ["Emploi", "Travail", "Pôle Emploi"]
    },
    {
        nom: "PIMMS Médiation Strasbourg",
        ville: "Strasbourg",
        code_postal: "67000",
        type_structure: "association",
        services: ["Médiation", "Accès aux droits", "Energie"],
        mots_cles: ["PIMMS", "Accompagnement", "Droits"]
    },
    {
        nom: "Restos du Coeur - Strasbourg",
        ville: "Strasbourg",
        code_postal: "67000",
        type_structure: "association",
        services: ["Alimentation", "Colis alimentaires"],
        mots_cles: ["Restos", "Alimentation", "Solidarité"]
    },
    {
        nom: "Croix-Rouge Française - Mulhouse",
        ville: "Mulhouse",
        code_postal: "68100",
        type_structure: "association",
        services: ["Urgence sociale", "Secours"],
        mots_cles: ["Croix-Rouge", "Urgence"]
    },
];

async function main() {
    console.log('Seeding extra structures...');

    for (const s of extraStructures) {
        const data = { ...s, statut: 'actif', published_at: new Date() };
        await db.insert(Structure).values(data).onConflictDoUpdate({
            target: [Structure.nom],
            set: data,
        });
    }

    console.log('Extra structures seeded.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
