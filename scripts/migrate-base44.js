
/* eslint-disable no-control-regex */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const APP_ID = "695b4a941214c1e0b6066dd3";
const BASE_URL = "https://base44.app/api";

function sanitize(str) {
    if (typeof str !== 'string') return str;
    // Remove null bytes and other control chars that might upset Postgres
    return str.replace(/\u0000/g, '');
}

async function fetchFromBase44(entityName) {
    console.log(`Fetching ${entityName}...`);
    const url = `${BASE_URL}/apps/${APP_ID}/entities/${entityName}?limit=1000`;
    const response = await fetch(url, {
        headers: {
            "X-App-Id": APP_ID,
            "X-Environment": "prod", // Assuming prod environment
            "Content-Type": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch ${entityName}: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Fetched ${data.length} ${entityName}.`);
    return data;
}

async function migrate() {
    console.log("--- MIGRATING DATA FROM BASE44 TO LOCAL DB (VIA RAW FETCH) ---");

    try {
        // --- AIDES ---
        const aides = await fetchFromBase44("Aide");

        for (const aide of aides) {
            await prisma.aide.upsert({
                where: { id: aide.id },
                update: {
                    titre: aide.titre,
                    categorie: aide.categorie,
                    est_urgent: aide.est_urgent,
                    sources: aide.sources || [],
                    territoires: typeof aide.territoires === 'string' ? JSON.parse(aide.territoires) : (aide.territoires || []),
                    date_verification: aide.date_verification ? new Date(aide.date_verification) : null,
                    delai_indicatif: aide.delai_indicatif,
                    cest_quoi: aide.cest_quoi,
                    pour_qui: aide.pour_qui,
                    ce_que_ca_aide: aide.ce_que_ca_aide,
                    documents_necessaires: aide.documents_necessaires || [],
                    etapes: aide.etapes || [],
                    ou_demander: aide.ou_demander,
                    lien_demande: aide.lien_demande
                },
                create: {
                    id: aide.id,
                    titre: aide.titre || "Sans titre",
                    categorie: aide.categorie,
                    est_urgent: aide.est_urgent || false,
                    sources: aide.sources || [],
                    territoires: typeof aide.territoires === 'string' ? JSON.parse(aide.territoires) : (aide.territoires || []),
                    date_verification: aide.date_verification ? new Date(aide.date_verification) : null,
                    delai_indicatif: aide.delai_indicatif,
                    cest_quoi: aide.cest_quoi,
                    pour_qui: aide.pour_qui,
                    ce_que_ca_aide: aide.ce_que_ca_aide,
                    documents_necessaires: aide.documents_necessaires || [],
                    etapes: aide.etapes || [],
                    ou_demander: aide.ou_demander,
                    lien_demande: aide.lien_demande
                }
            });
        }
        console.log("Aides migrated.");


        // --- STRUCTURES ---
        const structures = await fetchFromBase44("Structure");

        for (const s of structures) {
            await prisma.structure.upsert({
                where: { id: s.id },
                update: {
                    nom: s.nom,
                    type_structure: s.type_structure,
                    accessibilite_pmr: s.accessibilite_pmr,
                    description_courte: s.description_courte,
                    adresse: s.adresse,
                    code_postal: s.code_postal,
                    ville: s.ville,
                    departement: s.departement,
                    telephone: s.telephone,
                    email: s.email,
                    site_web: s.site_web,
                    horaires: s.horaires,
                    services: s.services || [],
                    publics_accueillis: s.publics_accueillis || [],
                    date_verification: s.date_verification ? new Date(s.date_verification) : null,
                    categories_aidees: s.categories_aidees || []
                },
                create: {
                    id: s.id,
                    nom: s.nom || "Sans nom",
                    type_structure: s.type_structure,
                    accessibilite_pmr: s.accessibilite_pmr || false,
                    description_courte: s.description_courte,
                    adresse: s.adresse,
                    code_postal: s.code_postal,
                    ville: s.ville,
                    departement: s.departement,
                    telephone: s.telephone,
                    email: s.email,
                    site_web: s.site_web,
                    horaires: s.horaires,
                    services: s.services || [],
                    publics_accueillis: s.publics_accueillis || [],
                    date_verification: s.date_verification ? new Date(s.date_verification) : null,
                    categories_aidees: s.categories_aidees || []
                }
            });
        }
        console.log("Structures migrated.");

        // --- DEMARCHES ---
        const demarches = await fetchFromBase44("Demarche");

        for (const d of demarches) {
            await prisma.demarche.upsert({
                where: { id: d.id },
                update: {
                    titre: d.titre,
                    categorie: d.categorie,
                    description_courte: d.description_courte,
                    delai: d.delai,
                    cout: d.cout,
                    date_verification: d.date_verification ? new Date(d.date_verification) : null,
                    pour_qui: d.pour_qui,
                    documents_necessaires: d.documents_necessaires || [],
                    etapes: d.etapes || [],
                    ou_faire: d.ou_faire,
                    lien_officiel: d.lien_officiel,
                    sources: d.sources || []
                },
                create: {
                    id: d.id,
                    titre: d.titre || "Sans titre",
                    categorie: d.categorie,
                    description_courte: d.description_courte,
                    delai: d.delai,
                    cout: d.cout,
                    date_verification: d.date_verification ? new Date(d.date_verification) : null,
                    pour_qui: d.pour_qui,
                    documents_necessaires: d.documents_necessaires || [],
                    etapes: d.etapes || [],
                    ou_faire: d.ou_faire,
                    lien_officiel: d.lien_officiel,
                    sources: d.sources || []
                }
            });
        }
        console.log("Demarches migrated.");

        // --- ACTUALITES ---
        const actualites = await fetchFromBase44("Actualite");

        for (const a of actualites) {
            await prisma.actualite.upsert({
                where: { id: a.id },
                update: {
                    titre: sanitize(a.titre),
                    contenu: sanitize(a.contenu),
                    date_publication: a.date_publication ? new Date(a.date_publication) : new Date(),
                    image_url: sanitize(a.image_url),
                    lien_url: sanitize(a.lien_url),
                    source: sanitize(a.source)
                },
                create: {
                    id: a.id,
                    titre: sanitize(a.titre) || "Sans titre",
                    contenu: sanitize(a.contenu),
                    date_publication: a.date_publication ? new Date(a.date_publication) : new Date(),
                    image_url: sanitize(a.image_url),
                    lien_url: sanitize(a.lien_url),
                    source: sanitize(a.source)
                }
            });
        }
        console.log("Actualites migrated.");


    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

migrate();
