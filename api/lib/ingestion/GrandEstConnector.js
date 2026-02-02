
import { SourceConnector } from './SourceConnector.js';
import crypto from 'crypto';
import taxonomy from '../../data/taxonomy.json' with { type: "json" };

export class GrandEstConnector extends SourceConnector {
    constructor() {
        super('Grand Est', 'https://www.grandest.fr');
    }

    async getDetailUrls() {
        const listingUrl = 'https://www.grandest.fr/aides/';
        const html = await this.fetch(listingUrl);
        const urls = new Set();

        // Regex to find links to aides/calls for projects
        // Pattern: href=".../vos-aides-regionales/..." or ".../appel-a-projet/..."
        // Supports relative and absolute URLs
        const regex = /href=["']((?:https?:\/\/www\.grandest\.fr)?\/+(?:vos-aides-regionales|appel-a-projet)\/[^"']+)["']/gi;
        let match;
        while ((match = regex.exec(html)) !== null) {
            urls.add(this.resolveUrl(match[1], listingUrl));
        }
        return Array.from(urls);
    }

    async fetch(url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.text();
    }

    async parse(html, url) {
        // Basic Regex Parser
        const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
        const title = titleMatch ? this.cleanText(titleMatch[1]) : 'Sans titre';

        // Extract content (naive)
        // Look for main content area often identified by specific classes or just body text
        // For Grand Est, let's assume standard WP structure
        let content = '';
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch) {
            content = this.cleanText(bodyMatch[1]).substring(0, 5000); // Truncate
        }

        // Apply URL detection
        // Look for links containing keywords
        let applyUrl = null;
        const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
        let match;
        while ((match = linkRegex.exec(html)) !== null) {
            const href = match[1];
            const text = match[2].toLowerCase();
            if (text.includes('demande') || text.includes('dossier') || text.includes('candidater')) {
                // Ignore internal nav links
                if (!href.startsWith('#') && !href.includes('wp-content')) {
                    applyUrl = this.resolveUrl(href, url);
                    break;
                }
            }
        }

        // Theme mapping (naive keywords)
        let theme = null;
        const lowerContent = (title + ' ' + content).toLowerCase();

        for (const cat of taxonomy) {
            if (cat.keywords.some(k => lowerContent.includes(k))) {
                theme = cat.slug;
                break;
            }
        }

        return {
            title,
            description: content.substring(0, 200) + '...',
            content,
            source_url: url,
            apply_url: applyUrl,
            theme,
            fetched_at: new Date()
        };
    }

    getStableId(item) {
        return crypto.createHash('md5').update(item.source_url).digest('hex');
    }

    cleanText(html) {
        return html
            .replace(/<[^>]+>/g, ' ') // Strip tags
            .replace(/\s+/g, ' ')     // Normalize whitespace
            .trim();
    }

    resolveUrl(href, base) {
        try {
            return new URL(href, base).toString();
        } catch (e) {
            return href;
        }
    }
}
