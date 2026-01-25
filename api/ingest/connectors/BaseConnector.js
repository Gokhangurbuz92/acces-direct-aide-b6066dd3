// api/ingest/connectors/BaseConnector.js
import { IngestionMode } from '../Policy.js';

/**
 * Abstract Base Strategy for Data Ingestion Connectors.
 * All specific source connectors must extend this class.
 */
export default class BaseConnector {
    constructor(sourceConfig) {
        if (!sourceConfig || !sourceConfig.name) {
            throw new Error("BaseConnector: sourceConfig with 'name' is required.");
        }
        this.config = sourceConfig;
        this.name = sourceConfig.name;
        this.mode = sourceConfig.mode || IngestionMode.SCRAPE;
    }

    /**
     * @returns {string} The unique identifier of the source.
     */
    getName() {
        return this.name;
    }

    /**
     * @returns {object} The policy/mode for this connector.
     */
    getPolicy() {
        return {
            mode: this.mode,
            canCopyContent: this.mode !== IngestionMode.REFERENCE_ONLY
        };
    }

    /**
     * Main execution method. Must be implemented by subclasses.
     * @returns {Promise<Array>} List of standardized items (Aide, Structure, etc.)
     */
    async fetchItems() {
        throw new Error("fetchItems() must be implemented by subclass");
    }

    /**
     * Optional: Normalize a raw item into the schema format.
     * @param {object} rawItem
     * @returns {object} Normalized entity
     */
    normalize(rawItem) {
        return rawItem;
    }
}
