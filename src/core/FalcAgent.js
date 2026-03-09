import { logger } from '../utils/logger.js';

export class FalcAgent {
    constructor() {
        this.name = "Synthèse FALC";
    }

    async simplifyText(input) {
        logger.info(`[${this.name}] Simplification FALC initiée...`);
        // Simulation d'une simplification
        await new Promise((resolve) => setTimeout(resolve, 1200));
        logger.info(`[${this.name}] Simplification terminée.`);
        return { status: 'SUCCESS', type: 'FALC', data: "Explication simplifiée pour: " + input };
    }
}
