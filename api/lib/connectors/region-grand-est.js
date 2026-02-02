/**
 * Connecteur Région Grand Est
 * Source: https://www.grandest.fr/aides/
 */

import { BaseConnector } from './base.js';
import { JSDOM } from 'jsdom';
import slugify from '@sindresorhus/slugify';

export class RegionGrandEstConnector extends BaseConnector {
    constructor() {
        super({
            name: 'Région Grand Est',
            domain: 'grandest.fr',
            rateLimit: 2000 // 2 seconds between requests
        });
        this.baseUrl = 'https://www.grandest.fr';
        this.aidesListUrl = 'https://www.grandest.fr/vos-aides/';
    }

    /**
     * Fetch list of aides from Grand Est
     */
    async fetch() {
        const items = [];
        
        try {
            // Fetch main listing page
            const response = await this.fetchWithRetry(this.aidesListUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${this.aidesListUrl}: ${response.status}`);
            }

            const html = await response.text();
            const dom = new JSDOM(html);
            const document = dom.window.document;

            // Find all aide links (adjust selector based on actual site structure)
            const aideLinks = document.querySelectorAll('a[href*="/vos-aides/"]');
            
            for (const link of aideLinks) {
                const href = link.getAttribute('href');
                if (!href || href === this.aidesListUrl) continue;

                const fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
                
                // Fetch individual aide page
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
            console.error('Error fetching Grand Est aides:', error);
            throw error;
        }

        return items;
    }

    /**
     * Parse HTML page into structured data
     */
    parse(rawItem) {
        const { url, dom } = rawItem;
        
        // Extract data from DOM (adjust selectors based on actual site)
        const titre = dom.querySelector('h1')?.textContent?.trim() || '';
        const description = dom.querySelector('.aide-description, .content')?.textContent?.trim() || '';
        
        // Try to extract structured sections
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

        // Extract apply link
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

        // Generate slug
        const slug = slugify(titre);

        // Map sections to fields
        const cest_quoi = sections['présentation'] || sections['description'] || description.substring(0, 500);
        const pour_qui = sections['bénéficiaires'] || sections['qui peut en bénéficier'] || sections['public concerné'] || null;
        const conditions = sections['conditions'] || sections['critères'] || sections['éligibilité'] || null;
        const montant = sections['montant'] || sections['aide financière'] || null;
        const etapes = sections['démarches'] || sections['comment faire'] || sections['procédure'] || null;
        const documents = sections['pièces à fournir'] || sections['documents'] || null;

        // Parse documents into array
        let documents_necessaires = [];
        if (documents) {
            documents_necessaires = documents.split('\n').filter(d => d.trim().length > 0);
        }

        // Parse etapes into structured format
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
            ou_demander: 'Région Grand Est',
            lien_demande: apply_url,
            apply_url,
            source_url,
            source_url_exact: source_url,
            source_name: 'Région Grand Est',
            source_domain: this.domain,
            fetched_at,
            source_last_modified: fetched_at,
            
            // Metadata
            theme: this.inferTheme(titre, description),
            organisme: 'Région Grand Est',
            providerName: 'Région Grand Est',
            providerType: 'collectivite',
            territoire_niveau: 'region',
            territoires: ['grand-est'],
            territoire_label: 'Région Grand Est',
            audiences: this.inferAudiences(pour_qui),
            
            // Status
            statut: 'brouillon', // Will be reviewed before publishing
            quality_score: 50,
            
            // Deduplication
            content_hash: this.generateContentHash({
                titre,
                organisme: 'Région Grand Est',
                source_url
            })
        };
    }

    /**
     * Generate stable ID for deduplication
     */
    getStableId(parsedItem) {
        return this.generateContentHash({
            titre: parsedItem.titre,
            organisme: 'Région Grand Est',
            source_url: parsedItem.source_url
        });
    }

    /**
     * Infer theme from title and description
     */
    inferTheme(titre, description) {
        const text = `${titre} ${description}`.toLowerCase();
        
        if (text.includes('logement') || text.includes('hébergement')) return 'logement';
        if (text.includes('santé') || text.includes('médical')) return 'sante';
        if (text.includes('handicap')) return 'handicap';
        if (text.includes('emploi') || text.includes('formation')) return 'emploi';
        if (text.includes('famille') || text.includes('enfant')) return 'famille';
        if (text.includes('mobilité') || text.includes('transport')) return 'mobilite';
        if (text.includes('numérique') || text.includes('digital')) return 'numerique';
        
        return null;
    }

    /**
     * Infer audiences from pour_qui text
     */
    inferAudiences(pour_qui) {
        if (!pour_qui) return [];
        
        const text = pour_qui.toLowerCase();
        const audiences = [];
        
        if (text.includes('jeune') || text.includes('16-25')) audiences.push('jeunes');
        if (text.includes('senior') || text.includes('âgé')) audiences.push('seniors');
        if (text.includes('handicap')) audiences.push('handicap');
        if (text.includes('famille')) audiences.push('famille');
        if (text.includes('étudiant')) audiences.push('etudiants');
        if (text.includes('demandeur d\'emploi')) audiences.push('demandeurs-emploi');
        
        return audiences.length > 0 ? audiences : ['tous'];
    }
}
