import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';

const DEFAULT_IMAGE = '/og-image.png';
const SITE_NAME = 'Accès Direct Aide';
// Use SITE_URL from env, fallback to production domain
const BASE_URL = 'https://www.accesdirectaide.fr';

/**
 * SEO Component with OpenGraph and Twitter Card support.
 * Use this in individual pages for consistent SEO.
 */
export default function SEO({
    title,
    description,
    path = '',
    image = DEFAULT_IMAGE,
    noindex = false
}) {
    const fullTitle = title ? `${title} - ${SITE_NAME}` : SITE_NAME;
    const canonicalUrl = `${BASE_URL}${path}`;
    const imageUrl = image.startsWith('http') ? image : `${BASE_URL}${image}`;

    return (
        <Helmet>
            {/* Basic */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={canonicalUrl} />

            {/* Robots */}
            {noindex && <meta name="robots" content="noindex, nofollow" />}

            {/* OpenGraph */}
            <meta property="og:type" content="website" />
            <meta property="og:site_name" content={SITE_NAME} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:image" content={imageUrl} />
            <meta property="og:locale" content="fr_FR" />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={imageUrl} />
        </Helmet>
    );
}

SEO.propTypes = {
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    path: PropTypes.string,
    image: PropTypes.string,
    noindex: PropTypes.bool
};
