/**
 * brand-config.js
 *
 * Identité visuelle et juridique de AccesDirectAide
 * Association de droit local (Loi 1908 — Alsace-Moselle).
 *
 * Modifier ce fichier pour rebrander toute l'application.
 */

const brand = {
    // — Identity —
    name: 'AccesDirectAide',
    shortName: 'ADA',
    tagline: "L'information sociale claire et souveraine",
    institution: 'AccesDirectAide',
    institutionShort: 'ADA',
    region: 'Strasbourg, Alsace',

    // — Colors —
    colors: {
        primary: '#0f766e',       // Bleu Canard — confiance & social
        primaryLight: '#ccfbf1',  // Fond clair teal
        primaryDark: '#115e59',   // Hover
        accent: '#f59e0b',        // Ambre chaleureux
        accentLight: '#fef3c7',
        success: '#059669',
        successLight: '#d1fae5',
        warning: '#d97706',
        warningLight: '#fef3c7',
        danger: '#dc2626',
        dangerLight: '#fee2e2',
        neutral: '#1e293b',
        neutralLight: '#f8fafc',
    },

    // — Government banner (disabled for association) —
    banner: {
        text: '',
        bgColor: '#0f766e',
        textColor: '#ffffff',
    },

    // — Logos —
    logo: '/logo.svg',
    favicon: '/favicon.ico',

    // — Contact —
    contact: {
        phone: '07.78.55.75.25',
        email: 'contact@accesdirectaide.fr',
        address: '58 rue Himmerich, 67000 Strasbourg',
    },

    // — Legal —
    legal: {
        entity: 'AccesDirectAide — Association de droit local (Loi 1908)',
        legalStatus: 'Association de droit local (Loi 1908)',
        siret: '',
        rgpdContact: 'contact@accesdirectaide.fr',
    },

    // — Feature flags —
    features: {
        showGouvBanner: false,
        showInstitutionBadge: true,
        isAssociative: true,
    },
};

export default brand;
