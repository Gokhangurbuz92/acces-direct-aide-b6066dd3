const BASE_URL = 'https://www.accesdirectaide.fr';

export function generateBreadcrumbSchema(items) {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": items.map((item, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": item.name,
            "item": item.url ? (item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url.startsWith('/') ? item.url : '/' + item.url}`) : undefined
        }))
    };
}

export function generateAideSchema(aide) {
    if (!aide) return null;
    const title = aide.titre || aide.title;
    const description = aide.summary_falc || aide.description || aide.cest_quoi?.substring(0, 200);
    const url = aide.slug ? `${BASE_URL}/aides/${aide.slug}` : undefined;
    const serviceType = aide.theme || aide.categorie || undefined;
    const providerName = aide.providerName || aide.source_org || aide.source_name || undefined;

    const governmentService = {
        "@type": "GovernmentService",
        ...(title && { "name": title }),
        ...(description && { "description": description }),
        ...(serviceType && { "serviceType": serviceType }),
        ...(url && { "url": url }),
        ...(providerName && {
            "provider": {
                "@type": "Organization",
                "name": providerName
            }
        })
    };

    return {
        "@context": "https://schema.org",
        "@type": "WebPage",
        ...(url && { "url": url }),
        ...(title && { "name": title }),
        ...(description && { "description": description }),
        "datePublished": aide.published_at || aide.updatedAt,
        "dateModified": aide.updatedAt,
        "mainEntity": governmentService
    };
}

export function generateStructureSchema(structure) {
    if (!structure) return null;

    const schema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": structure.nom,
        "description": structure.description_courte,
        "url": structure.site_web || `${BASE_URL}/structures/${structure.slug}`,
        "telephone": structure.telephone,
        "email": structure.email,
        "address": {
            "@type": "PostalAddress",
            "streetAddress": structure.adresse,
            "postalCode": structure.code_postal,
            "addressLocality": structure.ville,
            "addressCountry": "FR"
        }
    };

    if (structure.latitude && structure.longitude) {
        schema.geo = {
            "@type": "GeoCoordinates",
            "latitude": structure.latitude,
            "longitude": structure.longitude
        };
    }

    return schema;
}

/** @param {any} demarche */
export function generateDemarcheSchema(demarche) {
    if (!demarche) return null;
    const title = demarche.titre;
    const description = demarche.summary_falc || demarche.description_courte;
    const url = demarche.slug ? `${BASE_URL}/demarches/${demarche.slug}` : undefined;

    const steps = Array.isArray(demarche.etapes) ? demarche.etapes : [];
    const normalizedSteps = steps
        .filter((/** @type {any} */ step) => step && typeof step === 'object')
        .map((/** @type {any} */ step, /** @type {number} */ index) => ({
            index,
            name: step.titre || step.title || step.nom || '',
            text: step.description || step.contenu || step.text || '',
        }))
        .filter((step) => Boolean(step.name || step.text));

    const howToSchema = normalizedSteps.length > 0 ? {
        "@type": "HowTo",
        ...(title && { "name": title }),
        ...(description && { "description": description }),
        ...(url && { "url": url }),
        "inLanguage": "fr-FR",
        "step": normalizedSteps.map((step, idx) => ({
            "@type": "HowToStep",
            "position": idx + 1,
            "name": step.name || `Étape ${idx + 1}`,
            ...(step.text && { "text": step.text }),
        })),
    } : null;

    return {
        "@context": "https://schema.org",
        "@type": "WebPage",
        ...(url && { "url": url }),
        ...(title && { "name": title }),
        ...(description && { "description": description }),
        "inLanguage": "fr-FR",
        ...(demarche.published_at && { "datePublished": demarche.published_at }),
        ...(demarche.updatedAt && { "dateModified": demarche.updatedAt }),
        ...(howToSchema && { "mainEntity": howToSchema }),
    };
}

export function generateActualiteSchema(actu) {
    if (!actu) return null;
    return {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": actu.titre,
        "description": actu.summary_falc || actu.contenu?.substring(0, 150),
        "datePublished": actu.date_publication,
        "dateModified": actu.updatedAt,
        "image": actu.image_url ? [actu.image_url] : [],
        "mainEntityOfPage": {
             "@type": "WebPage",
             "@id": `${BASE_URL}/actualites/${actu.slug}`
        },
        "author": {
             "@type": "Organization",
             "name": "Accès Direct Aide"
        }
    };
}

export function generateDispositifSchema(dispositif) {
    if (!dispositif) return null;
    return {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": dispositif.nom || dispositif.title,
        "description": dispositif.description?.substring(0, 150),
        "dateModified": dispositif.updatedAt,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `${BASE_URL}/dispositifs/${dispositif.slug}`
        },
        "author": {
            "@type": "Organization",
            "name": "Accès Direct Aide"
        }
    };
}

export function generateRessourceSchema(ressource) {
    if (!ressource) return null;
    return {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": ressource.title,
        "description": ressource.content?.substring(0, 150),
        "dateModified": ressource.updatedAt,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `${BASE_URL}/ressources/${ressource.slug}`
        },
        "author": {
            "@type": "Organization",
            "name": "Accès Direct Aide"
        }
    };
}
