import { chatWithRulePack } from '../api/lib/gemini.js';
import { env } from '../api/_utils/env.js';
import dotenv from 'dotenv';
dotenv.config();

async function runScenario(name, questions) {
    console.log(`
=== SCÉNARIO : ${name} ===`);
    let history = [];
    
    for (const q of questions) {
        console.log(`User: ${q}`);
        const response = await chatWithRulePack(q, history);
        console.log(`AI: ${response}`);
        history.push({ role: 'user', content: q });
        history.push({ role: 'assistant', content: response });
    }
}

// Note: Requires GEMINI_API_KEY in .env
if (!env.ai.geminiKey) {
    console.error("ERREUR: GEMINI_API_KEY (ou GOOGLE_API_KEY) non trouvée dans .env");
    process.exit(1);
}

const scenario1 = [
    "Bonjour, je suis étudiant français, je loue un studio à Lyon et je voudrais l'APL.",
    "Oui, c'est ma résidence principale en France.",
    "Oui, le propriétaire m'a confirmé que c'est conventionné.",
    "Non, le propriétaire est une agence immobilière, aucun lien de famille."
];

const scenario2 = [
    "Bonjour, je suis étudiant étranger et j'ai trouvé un appartement.",
    "Non, je n'ai pas encore de titre de séjour, je suis en attente."
];

const scenario3 = [
    "Bonjour, j'ai trouvé un super appart qui appartient à mon père, est-ce que j'ai droit à l'APL ?"
];

async function main() {
    await runScenario("Profil A (Étudiant éligible)", scenario1);
    await runScenario("Profil B (Étranger sans titre)", scenario2);
    await runScenario("Profil C (Logement du père)", scenario3);
}

main().catch(console.error);
