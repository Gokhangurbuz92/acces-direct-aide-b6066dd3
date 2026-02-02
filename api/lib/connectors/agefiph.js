/**
 * Connecteur AGEFIPH
 * Source: https://www.agefiph.fr/
 */

import { BaseConnector } from './base.js';
import { JSDOM } from 'jsdom';
import slugify from '@sindresorhus/slugify';

export class AgefiphConnector extends BaseConnector {
    constructor() {
        super({
            name: 'AGEFIPH',
            domain: 'agefiph.fr',
            rateLimit: 2000
        });
        this.baseUrl = 'https://www.agefiph.fr';
        this.aidesListUrl = 'https://www.agefiph.fr/aides-handicap';
    }

    /**
     * Fetch list of aides from AGEFIPH
     */
    async fetch() {
        const items = [];
        
        try {
            const response = await this.fetchWithRetry(this.aidesListUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${this.aidesListUrl}: ${response.status}`);
            }

            const html = await response.text();
            const dom = new JSDOM(html);
            const document = dom.window.document;

            // Find all aide links
            const aideLinks = document.querySelectorAll('a[href*="/aides-handicap/"]');
            
            for (const link of aideLinks) {
                const href = link.getAttribute('href');
                if (!href || href === this.aidesListUrl) continue;

                const fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
                
                try {
                    const aideResponse = await this.fetchWithRetry(fullUrl);
                    if (!aideResponse.ok) continue;

                    const aideHtml = await aideResponse.text();
                    const aideDom = new JSDOM(aideHtml);
                    
                    items.push({
                        url: fullUrl,
                        html: aideHtml,
                        dom: aideDom.window.document
                    });
                } catch (error) {
                    console.error(`Error fetching ${fullUrl}:`, error.message);
                }
            }
        } catch (error) {
            console.error('Error fetching AGEFIPH aides:', error);
            throw error;
        }

        return items;
    }

    /**
     * Parse HTML page into structured data
     */
    parse(rawItem) {
        const { url, dom } = rawItem;
        
        const titre = dom.querySelector('h1')?.textContent?.trim() || '';
        const description = dom.querySelector('.field-name-body, .content')?.textContent?.trim() || '';
        
        const sections = {};
        const headings = dom.querySelectorAll('h2, h3');
        headings.forEach(heading => {
            const title = heading.textContent.trim().toLowerCase();
            const content = [];
            let sibling = heading.nextElementSibling;
            
            while (sibling && !['H2', 'H3'].includes(sibling.tagName)) {
                if (sibling.textContent.trim()) {
                    content.push(sibling.textContent.trim());
                }
                sibling = sibling.nextElementSibling;
            }
            
            sections[title] = content.join('\n');
        });

        const applyLink = dom.querySelector('a[href*="demande"], a[href*="formulaire"], .btn-primary')?.getAttribute('href');
        
        return {
            titre,
            description,
            sections,
            source_url: url,
            apply_url: applyLink ? (applyLink.startsWith('http') ? applyLink : `${this.baseUrl}${applyLink}`) : null,
            fetched_at: new Date()
        };
    }

    /**
     * Map parsed data to Aide model
     */
    mapToAide(parsedItem) {
        const { titre, description, sections, source_url, apply_url, fetched_at } = parsedItem;

        const slug = slugify(titre);

        const cest_quoi = sections['présentation'] || sections['description'] || description.substring(0, 500);
        const pour_qui = sections['bénéficiaires'] || sections['qui peut en bénéficier'] || 'Personnes en situation de handicap';
        const montant = sections['montant'] || sections['aide financière'] || null;
        const etapes = sections['démarches'] || sections['comment faire'] || null;
        const documents = sections['pièces à fournir'] || sections['documents'] || null;

        let documents_necessaires = [];
        if (documents) {
            documents_necessaires = documents.split('\n').filter(d => d.trim().length > 0);
        }

        let etapes_json = null;
        if (etapes) {
            const steps = etapes.split('\n').filter(s => s.trim().length > 0);
            etapes_json = steps.map((step, idx) => ({
                numero: idx + 1,
                titre: `Étape ${idx + 1}`,
                description: step
            }));
        }

        return {
            slug,
            titre,
            cest_quoi,
            pour_qui,
            ce_que_ca_aide: montant,
            documents_necessaires,
            etapes: etapes_json,
            ou_demander: 'AGEFIPH',
            lien_demande: apply_url,
            apply_url,
            source_url,
            source_url_exact: source_url,
            source_name: 'AGEFIPH',
            source_domain: this.domain,
            fetched_at,
            source_last_modified: fetched_at,
            
            // Metadata
            theme: 'handicap', // All AGEFIPH aides are handicap-related
            organisme: 'AGEFIPH',
            providerName: 'AGEFIPH',
            providerType: 'organisme-handicap',
            territoire_niveau: 'national',
            territoires: ['national'],
            territoire_label: 'France entière',
            audiences: ['handicap'],
            
            // Status
            statut: 'brouillon',
            quality_score: 60, // AGEFIPH is official source, higher score
            
            // Deduplication
            content_hash: this.generateContentHash({
                titre,
                organisme: 'AGEFIPH',
                source_url
            })
        };
    }

    /**
     * Generate stable ID
     */
    getStableId(parsedItem) {
        return this.generateContentHash({
            titre: parsedItem.titre,
            organisme: 'AGEFIPH',
            source_url: parsedItem.source_url
        });
    }
}
