import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';
import { frontendEnv } from '@/config/env';
import {
    buildAbsoluteImageUrl,
    buildCanonicalUrl,
    getCurrentPathname,
} from '@/lib/seo';

const DEFAULT_IMAGE = '/og-image.png';
const SITE_NAME = 'Accès Direct Aide';

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
 * @property {string=} ogType
 * @property {SchemaValue=} schema
 */

/** @param {SEOProps} props */
export default function SEO({
    title,
    description = 'Vos droits et démarches sociales, simplement.',
    path = '',
    image = DEFAULT_IMAGE,
    noindex = false,
    ogType = 'website',
    schema = null
}) {
    const pageTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    const activePath = path || getCurrentPathname();
    const canonicalUrl = buildCanonicalUrl(activePath);
    const imageUrl = buildAbsoluteImageUrl(image);
    const isProduction = frontendEnv.runtime.vercelEnv === 'production';

    return (
        <Helmet>
            {/* Basic */}
            <title>{pageTitle}</title>
            <meta name="description" content={description} />

            {/* Canonical */}
            <link rel="canonical" href={canonicalUrl} />

            {/* Robots */}
            {(noindex || !isProduction) && <meta name="robots" content="noindex, nofollow" />}

            {/* OpenGraph */}
            <meta property="og:type" content={ogType} />
            <meta property="og:site_name" content={SITE_NAME} />
            <meta property="og:title" content={pageTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:image" content={imageUrl} />
            <meta property="og:locale" content="fr_FR" />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={pageTitle} />
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
    description: PropTypes.string,
    path: PropTypes.string,
    image: PropTypes.string,
    noindex: PropTypes.bool,
    ogType: PropTypes.string,
    schema: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.array
    ])
};
