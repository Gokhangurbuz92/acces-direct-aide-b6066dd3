import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';
import { frontendEnv } from '@/config/env';

const DEFAULT_IMAGE = '/og-image.png';
const SITE_NAME = 'Accès Direct Aide';
// Use SITE_URL from env, fallback to production domain
const BASE_URL = 'https://www.accesdirectaide.fr';

/**
 * SEO Component with OpenGraph and Twitter Card support.
 * Use this in individual pages for consistent SEO.
 */
/**
 * @typedef {object | object[] | null | undefined} SchemaValue
 * @typedef {Object} SEOProps
 * @property {string} title
 * @property {string} description
 * @property {string=} path
 * @property {string=} image
 * @property {boolean=} noindex
 * @property {SchemaValue=} schema
 */

/** @param {SEOProps} props */
export default function SEO({
    title,
    description,
    path = '',
    image = DEFAULT_IMAGE,
    noindex = false,
    schema = null
}) {
    const fullTitle = title ? `${title} - ${SITE_NAME}` : SITE_NAME;

    // Canonical URL logic
    // 1. Remove query params if any
    const cleanPath = path.split('?')[0];
    // 2. Ensure leading slash if path is provided and doesn't have it
    const normalizedPath = cleanPath && !cleanPath.startsWith('/') ? `/${cleanPath}` : cleanPath;

    // P0.6: Canonical is emitted ONLY in production and must equal PUBLIC_BASE_URL
    const isProduction = frontendEnv.runtime.vercelEnv === 'production';
    const canonicalBase = isProduction ? 'https://www.accesdirectaide.fr' : null;
    const canonicalUrl = canonicalBase ? `${canonicalBase}${normalizedPath}` : null;

    // Image URL logic
    const imageUrl = image.startsWith('http')
        ? image
        : `${BASE_URL}${image.startsWith('/') ? image : '/' + image}`;

    // Determine robots
    // P0.6: In non-prod: keep noindex (already standard behavior if we force !indexable logic or manual override)
    // If not production, force noindex if not already set?
    // The current logic typically uses `noIndex` prop. 
    // Let's ensure we default to noIndex if not prod, unless checking props.
    // However, user said "keep noindex in preview/dev". 
    // Usually handled by passing noIndex={true} or relying on environment.

    // Simplest logic adhering to request:
    // If canonical is null, don't render it.

    return (
        <Helmet>
            {/* Basic */}
            <title>{title ? `${title} | Accès Direct Aide` : 'Accès Direct Aide'}</title>
            <meta name="description" content={description} />

            {/* Canonical ONLY in production */}
            {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

            {/* Robots */}
            {(noindex || !isProduction) && <meta name="robots" content="noindex, nofollow" />}

            {/* Open Graph */}

            {/* OpenGraph */}
            <meta property="og:type" content="website" />
            <meta property="og:site_name" content={SITE_NAME} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
            <meta property="og:image" content={imageUrl} />
            <meta property="og:locale" content="fr_FR" />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={imageUrl} />

            {/* Schema.org */}
            {schema && (
                <script type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            )}
        </Helmet>
    );
}

SEO.propTypes = {
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    path: PropTypes.string,
    image: PropTypes.string,
    noindex: PropTypes.bool,
    schema: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.array
    ])
};
