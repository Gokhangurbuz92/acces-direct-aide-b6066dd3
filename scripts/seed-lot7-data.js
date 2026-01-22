
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("Seeding Lot 7 Data (Guides & Tools)...");

    const categories = ['accueil', 'communication', 'document', 'numerique'];
    const publics = ['seniors', 'handicap', 'allophone', 'illettrisme', 'pro'];
    const contexts = ['physique', 'telephone', 'web'];

    // 1. Guides
    for (let i = 1; i <= 20; i++) {
        const cat = categories[i % categories.length];
        const ctx = contexts[i % contexts.length];

        await prisma.guide.upsert({
            where: { slug: `guide-${i}-bonnes-pratiques` },
            update: {},
            create: {
                slug: `guide-${i}-bonnes-pratiques`,
                titre: `Guide ${i}: Optimiser l'${cat} en situation ${ctx}`,
                resume_falc: `Ceci est un résumé facile à lire : Pour bien accueillir, il faut parler lentement et sourire. (Guide ${i})`,
                contenu_json: JSON.stringify([
                    { titre: "Étape 1: Préparation", texte: "Préparez votre bureau. Enlevez le bruit." },
                    { titre: "Étape 2: L'échange", texte: "Regardez la personne. Utilisez des phrases courtes." },
                    { titre: "Conseil Pro", texte: "Vérifiez que la personne a compris." },
                ]),
                categorie: cat,
                publics: [publics[i % publics.length], publics[(i + 1) % publics.length]],
                contexte: [ctx],
                mots_cles: ['falc', 'accueil', cat],
                statut: 'publie',
                published_at: new Date()
            }
        });
    }
    console.log("✅ 20 Guides seeded.");

    const types = ['methode', 'numerique', 'modele', 'ressource'];

    // 2. Tools
    for (let i = 1; i <= 20; i++) {
        const type = types[i % types.length];
        await prisma.toolboxItem.upsert({
            where: { slug: `outil-${i}-nom-outil` },
            update: {},
            create: {
                slug: `outil-${i}-nom-outil`,
                titre: `Outil ${i}: ${type.toUpperCase()} pour simplification`,
                resume_falc: `Cet outil vous aide à rendre vos documents plus simples. (Outil ${i})`,
                type: type,
                categorie: categories[i % categories.length],
                publics: ['pro'],
                contenu_html: `<p>Utilisez cet outil pour <strong>vérifier</strong> votre niveau de langage.</p><ul><li>Critère 1...</li><li>Critère 2...</li></ul>`,
                url_download: i % 2 === 0 ? 'https://example.com/download.pdf' : null,
                statut: 'publie',
                published_at: new Date()
            }
        });
    }
    console.log("✅ 20 Tools seeded.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
