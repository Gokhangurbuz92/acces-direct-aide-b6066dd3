import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

/**
 * Composant Logo unifié pour l'application AccesDirectAide
 * Design System v1.0 - Branding
 * 
 * @param {Object} props
 * @param {'a' | 'b' | 'c' | 'current'} props.family - Famille de logo (a/b/c pour preview, current pour prod)
 * @param {'full' | 'icon' | 'tagline'} props.variant - Type de logo
 * @param {'default' | 'white'} props.tone - Tonalité (default = couleur, white = blanc)
 * @param {number | 'sm' | 'md' | 'lg'} props.size - Hauteur en pixels ou preset
 * @param {boolean} props.asLink - Si true, enveloppe dans un Link vers l'accueil
 * @param {string} props.alt - Texte alternatif personnalisé
 * @param {string} props.className - Classes CSS additionnelles
 */
const Logo = ({ 
    family = 'current',
    variant = 'full', 
    tone = 'default',
    size = 40,
    asLink = false,
    alt,
    className,
    ...props 
}) => {
    // Conversion size preset vers pixels
    const sizeMap = {
        sm: 24,
        md: 40,
        lg: 64
    };
    const heightPx = typeof size === 'string' ? sizeMap[size] : size;
    
    // Chemins des assets
    const basePath = '/assets/branding';
    
    // Déterminer le suffixe de famille (a/b/c ou vide pour current)
    const familySuffix = family === 'current' ? '' : `-${family}`;
    
    // Sélection du fichier selon family, variant et tone
    let logoSrc;
    let fallbackSrc;
    
    if (tone === 'white') {
        // Version blanche (toutes familles)
        logoSrc = `${basePath}/logo${familySuffix}-white.svg`;
        fallbackSrc = '/brand/logo-horizontal-transparent.png';
    } else if (variant === 'icon') {
        logoSrc = `${basePath}/logo${familySuffix}-icon.svg`;
        fallbackSrc = '/brand/logo-mark.png';
    } else if (variant === 'tagline') {
        logoSrc = `${basePath}/logo${familySuffix}-tagline.svg`;
        fallbackSrc = '/brand/logo-horizontal.png';
    } else {
        // variant === 'full'
        logoSrc = `${basePath}/logo${familySuffix}-full.svg`;
        fallbackSrc = '/brand/logo-horizontal.png';
    }
    
    // Texte alternatif
    const altText = alt || "AccesDirectAide — La lumière sur vos démarches";
    
    // Composant image
    const logoImage = (
        <img
            src={logoSrc}
            alt={altText}
            className={cn("object-contain", className)}
            style={{ height: `${heightPx}px`, width: 'auto' }}
            onError={(e) => {
                // Fallback vers PNG si SVG non disponible
                e.currentTarget.src = fallbackSrc;
            }}
            {...props}
        />
    );
    
    // Si asLink, envelopper dans un Link
    if (asLink) {
        return (
            <Link 
                to="/" 
                className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 rounded"
                aria-label="Accueil - AccesDirectAide"
            >
                {logoImage}
            </Link>
        );
    }
    
    return logoImage;
};

Logo.propTypes = {
    family: PropTypes.oneOf(['a', 'b', 'c', 'current']),
    variant: PropTypes.oneOf(['full', 'icon', 'tagline']),
    tone: PropTypes.oneOf(['default', 'white']),
    size: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.oneOf(['sm', 'md', 'lg'])
    ]),
    asLink: PropTypes.bool,
    alt: PropTypes.string,
    className: PropTypes.string,
};

export default Logo;
