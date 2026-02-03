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
    return {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": aide.titre,
        "description": aide.summary_falc || aide.cest_quoi?.substring(0, 150),
        "datePublished": aide.published_at || aide.updatedAt,
        "dateModified": aide.updatedAt,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `${BASE_URL}/aide/${aide.slug}`
        },
        "author": {
            "@type": "Organization",
            "name": "Accès Direct Aide"
        }
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

export function generateDemarcheSchema(demarche) {
    if (!demarche) return null;
    return {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": demarche.titre,
        "description": demarche.description_courte,
        "dateModified": demarche.updatedAt,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `${BASE_URL}/demarches/${demarche.slug}`
        },
        "author": {
             "@type": "Organization",
             "name": "Accès Direct Aide"
        }
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
