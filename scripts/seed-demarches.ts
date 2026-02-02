import prisma from '../api/_utils/prisma.js';



function slugify(text: string) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

const demarchesData = [
    { titre: "Demande d'ALS (Allocation de Logement Sociale)", cat: "logement", sit: ["je-cherche-un-logement"] },
    { titre: "S'inscrire à Pôle Emploi", cat: "emploi", sit: ["je-suis-au-chomage"] },
    { titre: "Demande de RSA", cat: "budget-impots", sit: ["j-ai-des-difficultes-financieres"] },
    { titre: "Déclarer ses impôts en ligne", cat: "budget-impots", sit: [] },
    { titre: "Demande d'AAH (Allocation aux Adultes Handicapés)", cat: "handicap", sit: ["je-suis-en-situation-de-handicap"] },
    { titre: "Renouvellement de carte d'identité", cat: "justice", sit: [] },
    { titre: "Demande de Passeport", cat: "justice", sit: [] },
    { titre: "Inscription scolaire", cat: "famille", sit: ["je-suis-parent"] },
    { titre: "Demande de Prime d'Activité", cat: "budget-impots", sit: ["j-ai-des-difficultes-financieres", "je-suis-au-chomage"] },
    { titre: "Demande de Carte Vitale", cat: "sante", sit: ["je-cherche-des-soins"] },
    { titre: "Ouverture de compte Ameli", cat: "sante", sit: ["je-cherche-des-soins"] },
    { titre: "Inscription sur les listes électorales", cat: "justice", sit: [] },
    { titre: "Demande de logement social (HLM)", cat: "logement", sit: ["je-cherche-un-logement"] },
    { titre: "Changement d'adresse en ligne", cat: "logement", sit: [] },
    { titre: "Demande de Bourse Crous", cat: "etudes-formation", sit: ["je-suis-etudiant"] },
    { titre: "Inscription à l'Université", cat: "etudes-formation", sit: ["je-suis-etudiant"] },
    { titre: "Demande de Titre de Séjour", cat: "immigration-integration", sit: ["je-suis-etranger"] },
    { titre: "Demande d'Asile", cat: "immigration-integration", sit: ["je-suis-etranger"] },
    { titre: "Demande de Retraite", cat: "retraite", sit: ["je-suis-senior"] },
    { titre: "Demande d'APA (Allocation Personnalisée d'Autonomie)", cat: "retraite", sit: ["je-suis-senior"] },
    { titre: "Demande de Chèque Énergie", cat: "energie", sit: ["j-ai-des-difficultes-financieres"] },
    { titre: "Résiliation de bail", cat: "logement", sit: [] },
    { titre: "Demande d'aide juridictionnelle", cat: "justice", sit: ["j-ai-des-difficultes-financieres"] },
    { titre: "Paiement d'amende en ligne", cat: "justice", sit: [] },
    { titre: "Certificat de situation administrative (non-gage)", cat: "mobilite-transport", sit: [] },
    { titre: "Demande de Carte Grise", cat: "mobilite-transport", sit: [] },
    { titre: "Résilier un contrat d'assurance", cat: "budget-impots", sit: [] },
    { titre: "Demande d'extrait de naissance", cat: "justice", sit: [] },
    { titre: "Déclaration de grossesse", cat: "famille", sit: ["je-suis-parent"] },
    { titre: "Demande de congé maternité", cat: "famille", sit: ["je-suis-parent"] },
    { titre: "Demande de congé paternité", cat: "famille", sit: ["je-suis-parent"] },
    { titre: "Demande de complémentaire santé solidaire (CSS)", cat: "sante", sit: ["je-cherche-des-soins", "j-ai-des-difficultes-financieres"] },
];

// Add more to reach ~80
for (let i = 1; i <= 50; i++) {
    demarchesData.push({
        titre: `Démarche administrative ${i} - ${i % 2 === 0 ? 'Préfecture' : 'Mairie'}`,
        cat: i % 3 === 0 ? "justice" : (i % 3 === 1 ? "logement" : "famille"),
        sit: i % 4 === 0 ? ["je-suis-senior"] : []
    });
}

async function main() {
    console.log('Seeding démarches...');

    // Cache taxonomies
    const categories = await prisma.aidCategory.findMany();
    const situations = await prisma.lifeSituation.findMany();

    const categoryMap = new Map(categories.map(c => [c.slug, c.id]));
    const situationMap = new Map(situations.map(s => [s.slug, s.id]));

    for (const d of demarchesData) {
        const slug = slugify(d.titre);
        const categoryId = categoryMap.get(d.cat);
        const situationIds = d.sit.map(s => situationMap.get(s)).filter(Boolean) as string[];

        await prisma.demarche.upsert({
            where: { slug },
            update: {
                titre: d.titre,
                categoryId: categoryId,
                situations: {
                    set: situationIds.map(id => ({ id }))
                },
                statut: "publie",
                published_at: new Date()
            },
            create: {
                titre: d.titre,
                slug,
                categoryId: categoryId,
                situations: {
                    connect: situationIds.map(id => ({ id }))
                },
                statut: "publie",
                published_at: new Date()
            },
        });
    }

    console.log('Démarches seeded.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
