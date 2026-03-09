import { AgentChef } from '../../core/AgentChef';
import { logger } from '../../utils/logger';

/**
 * ScanManager
 * Orchestre le premier scan national souverain.
 */
export const ScanManager = {
    /**
     * Lance le processus complet d'ingestion et de normalisation
     */
    async runNationalAudit() {
        const chef = new AgentChef();

        logger.info("[SCAN_MANAGER] Déclenchement du scan national...");

        const sources = [
            'Aides-Territoires',
            'DREES',
            'Service-Public',
            'Agefiph'
        ];

        const results = [];

        for (const source of sources) {
            // Étape 1 : Ingestion brute
            const rawData = await chef.orchestrate(`Ingérer les données de la source ${source}`);

            // Étape 2 : Normalisation FALC
            const simplifiedData = await chef.orchestrate(`Traduire en FALC les nouvelles aides de ${source}`);

            results.push({ source, count: rawData.impact, simplified: simplifiedData.impact });
        }

        return {
            status: 'completed',
            totalAids: results.reduce((acc, curr) => acc + curr.count, 0),
            totalFalc: results.reduce((acc, curr) => acc + curr.simplified, 0),
            timestamp: new Date().toISOString()
        };
    }
};
