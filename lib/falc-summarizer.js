import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'sk-mock-key',
    // Allow running without a key if we are just testing logic without actual calls
    dangerouslyAllowBrowser: true // Not recommended for prod but useful if code runs in mixed contexts, though this is server side.
});

/**
 * Summarizes text into FALC (Facile à Lire et à Comprendre) format.
 * @param {string} text - The raw text content to summarize.
 * @param {string} [context] - Optional context about the content (e.g., "Aide financière").
 * @returns {Promise<{summary: string, key_points: string[]}>}
 */
export async function summarizeToFalc(text, context = '') {
    if (!process.env.OPENAI_API_KEY) {
        console.warn("OPENAI_API_KEY is not set. Returning mock FALC summary.");
        return {
            summary: "Ceci est un résumé FALC simulé car la clé API n'est pas configurée. Le texte parle de : " + text.substring(0, 50) + "...",
            key_points: ["Point important 1 simulé", "Point important 2 simulé", "Point important 3 simulé"]
        };
    }

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Cost effective
            messages: [
                {
                    role: "system",
                    content: `Tu es un expert en méthode FALC (Facile à Lire et à Comprendre). 
Ton objectif est de résumer des textes administratifs ou d'actualité pour des personnes ayant une déficience intellectuelle.
Règles à suivre :
- Utilise des phrases courtes et simples (sujet + verbe + complément).
- Utilise le présent de l'indicatif.
- Évite les métaphores et le jargon.
- Explique les sigles si nécessaire.
- Ton résumé doit être neutre et factuel.
- NE PAS inventer d'informations (anti-hallucination). Si le texte ne contient pas l'info, ne l'ajoute pas.
- Réponds au format JSON avec deux champs : "summary" (le texte FALC) et "key_points" (tableau de 3 à 5 points clés).`
                },
                {
                    role: "user",
                    content: `Contexte: ${context}\n\nTexte à simplifier :\n${text.substring(0, 3000)}` // Limit input size
                }
            ],
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(response.choices[0].message.content);
        return {
            summary: result.summary,
            key_points: result.key_points || []
        };

    } catch (error) {
        console.error("Error generating FALC summary:", error);
        return {
            summary: "Le résumé automatique n'a pas pu être généré. Veuillez consulter le texte original.",
            key_points: []
        };
    }
}
