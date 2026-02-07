
/**
 * Interface for Source Connectors
 */
export class SourceConnector {
    constructor(name, baseUrl) {
        this.name = name;
        this.baseUrl = baseUrl;
    }

    /**
     * Fetches the listing page(s) and returns a list of detail URLs.
     * @returns {Promise<string[]>}
     */
    async getDetailUrls() {
        throw new Error('Not implemented');
    }

    async fetch(url) {
        throw new Error('Not implemented');
    }

    async parse(html, url) {
        throw new Error('Not implemented');
    }

    getStableId(item) {
        throw new Error('Not implemented');
    }
}
