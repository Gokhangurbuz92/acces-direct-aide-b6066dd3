import logger from '../../_utils/logger.js';

/**
 * Agent FALC Writer
 *
 * Mission : Simplifier les textes en FALC
 * (Facile à Lire et à Comprendre)
 */

export const FALC_SYSTEM_PROMPT = `Tu es un expert en rédaction FALC (Facile à Lire et à Comprendre).

RÈGLES STRICTES :
1. Phrases courtes : maximum 15 mots par phrase
2. Mots simples : pas de jargon administratif
3. Une seule idée par phrase
4. Utilise la voix active
5. Pas de double négation
6. Explique chaque acronyme la première fois
7. Utilise des exemples concrets
8. Structure avec des listes à puces
9. Commence par l'information la plus importante
10. Termine par "Comment faire" (les étapes)

FORMAT DE SORTIE JSON :
{
  "titre_falc": "Titre simplifié",
  "description_falc": "Description en 3-5 phrases FALC",
  "pour_qui": ["Liste des personnes concernées"],
  "comment_faire": ["Étape 1", "Étape 2", "..."],
  "montant": "En chiffres simples"
}

EXEMPLE :
{
  "titre_falc": "Aide au logement",
  "description_falc": "Cette aide vous donne de l'argent pour payer votre loyer. Elle est pour les personnes qui ont peu de revenus. Vous pouvez la demander sur le site de la CAF.",
  "pour_qui": ["Les locataires", "Les personnes avec peu de revenus"],
  "comment_faire": ["Allez sur caf.fr", "Créez un compte", "Remplissez le formulaire", "Envoyez vos documents"],
  "montant": "entre 50€ et 300€ par mois"
}`;

export class FalcWriter {
    constructor(geminiClient) {
        this.gemini = geminiClient;
        this.name = 'falc-writer';
    }

    async simplify(aide) {
        const prompt = `Simplifie cette aide en FALC :

Titre : ${String(aide.titre || '').slice(0, 255)}
Description : ${String(aide.description || '').slice(0, 2000)}
Organisme : ${String(aide.organisme || 'Non précisé').slice(0, 100)}
Montant : ${String(aide.montant || 'Non précisé').slice(0, 100)}
Conditions : ${String(aide.conditions || 'Non précisé').slice(0, 500)}`;

        try {
            const result = await this.gemini.generateContent({
                systemInstruction: FALC_SYSTEM_PROMPT,
                prompt,
            });

            logger.info({
                msg: 'agent.falc-writer.success',
                aideId: aide.id,
                inputLength: aide.description?.length || 0,
                outputLength: result?.length || 0,
            });

            return { ok: true, falcText: result, aideId: aide.id };
        } catch (error) {
            logger.error({
                msg: 'agent.falc-writer.error',
                aideId: aide.id,
                error: error.message,
            });
            return { ok: false, error: error.message };
        }
    }
}
