import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

/**
 * Composant Logo unifié pour l'application AccesDirectAide
 * Design System v1.0 - Branding
 * 
 * @param {Object} props
 * @param {'full' | 'icon'} props.variant - Type de logo (full = complet, icon = icône seule)
 * @param {'default' | 'white' | 'mono'} props.tone - Tonalité (default = couleur, white = blanc, mono = monochrome)
 * @param {number} props.size - Hauteur en pixels (défaut: 40)
 * @param {boolean} props.asLink - Si true, enveloppe dans un Link vers l'accueil
 * @param {string} props.alt - Texte alternatif personnalisé
 * @param {string} props.className - Classes CSS additionnelles
 */
const Logo = ({ 
    variant = 'full', 
    tone = 'default',
    size = 40,
    asLink = false,
    alt,
    className,
    ...props 
}) => {
    // Chemins des assets
    const basePath = '/assets/branding';
    
    // Sélection du fichier selon variant et tone
    let logoSrc;
    let fallbackSrc;
    
    if (variant === 'icon') {
        logoSrc = `${basePath}/logo-icon.svg`;
        fallbackSrc = tone === 'white' 
            ? '/brand/logo-mark-transparent.png'
            : '/brand/logo-mark.png';
    } else {
        // variant === 'full'
        if (tone === 'white') {
            logoSrc = `${basePath}/logo-white.svg`;
            fallbackSrc = '/brand/logo-horizontal-transparent.png';
        } else {
            logoSrc = `${basePath}/logo-full.svg`;
            fallbackSrc = '/brand/logo-horizontal.png';
        }
    }
    
    // Texte alternatif
    const altText = alt || "AccesDirectAide — La lumière sur vos démarches";
    
    // Composant image
    const logoImage = (
        <img
            src={logoSrc}
            alt={altText}
            className={cn("object-contain", className)}
            style={{ height: `${size}px`, width: 'auto' }}
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
    variant: PropTypes.oneOf(['full', 'icon']),
    tone: PropTypes.oneOf(['default', 'white', 'mono']),
    size: PropTypes.number,
    asLink: PropTypes.bool,
    alt: PropTypes.string,
    className: PropTypes.string,
};

export default Logo;
