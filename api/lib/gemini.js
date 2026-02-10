import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Detects the intent of the message to load the correct RulePack
 */
function detectIntent(message) {
    const text = message.toLowerCase();
    if (text.match(/apl|aide au logement|loyer|caf|appartement|studio|logement/)) {
        return 'apl_v1';
    }
    return null;
}

/**
 * Loads a RulePack JSON from the data directory
 */
function loadRulePack(id) {
    try {
        const path = join(__dirname, '../../src/data/rulepacks', `${id}.json`);
        return JSON.parse(readFileSync(path, 'utf8'));
    } catch (e) {
        console.error(`Failed to load RulePack ${id}:`, e);
        return null;
    }
}

/**
 * Chat with Gemini using RulePack injection
 */
export async function chatWithRulePack(message, history = []) {
    const intent = detectIntent(message);
    const rulePack = intent ? loadRulePack(intent) : null;

    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
            temperature: 0.2, // Strict mode to avoid hallucinations
            topP: 0.8,
            topK: 40,
        }
    });

    let systemInstruction = `Tu es un assistant administratif expert pour AccesDirectAide.
    RÈGLES CRITIQUES :
    1. Utilise UNIQUEMENT les informations du RulePack fourni ci-dessous.
    2. Si une information manque dans le RulePack, réponds : "Je n'ai pas cette information précise dans mes règles métier actuelles."
    3. Pose UNE SEULE question à la fois pour vérifier l'éligibilité.
    4. Ne conclus jamais positivement sans avoir vérifié TOUTES les conditions du RulePack.
    5. Explique toujours le résultat en langage simple (FALC).
    6. Cite toujours la source officielle mentionnée dans le RulePack.`;

    if (rulePack) {
        systemInstruction += `

RULEPACK ACTIF : ${JSON.stringify(rulePack)}`;
    }

    const chat = model.startChat({
        history: history.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }],
        })),
        systemInstruction: {
            parts: [{ text: systemInstruction }]
        }
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
}
