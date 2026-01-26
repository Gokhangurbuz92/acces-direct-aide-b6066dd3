import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

/**
 * Composant Logo unifié pour l'application AccesDirectAide
 * 
 * Supports variants:
 * - header: Logo horizontal pour desktop, icône seule pour mobile
 * - hero: Logo complet avec tagline (ou stacked selon espace)
 * - footer: Logo complet avec tagline ou horizontal
 * - mark: Icône seule (carré)
 */
const Logo = ({ variant = 'header', className, ...props }) => {

    // Base paths
    const basePath = '/brand';
    const logoHorizontal = `${basePath}/logo-horizontal.png`;
    const logoHorizontalTagline = `${basePath}/logo-horizontal-tagline.png`;
    const logoStackedTagline = `${basePath}/logo-stacked-tagline.png`;
    const logoMark = `${basePath}/logo-mark.png`;

    // Default Alt text
    const altText = "AccesDirectAide — La lumière sur vos démarches";

    if (variant === 'mark') {
        return (
            <img
                src={logoMark}
                alt="AccesDirectAide"
                className={cn("h-10 w-10 object-contain", className)}
                {...props}
            />
        );
    }

    if (variant === 'header') {
        return (
            <div className={cn("flex items-center", className)} {...props}>
                {/* Mobile: Logo Mark Only */}
                <img
                    src={logoMark}
                    alt={altText}
                    className="h-10 w-auto sm:hidden"
                />
                {/* Tablet/Desktop: Horizontal Logo */}
                <img
                    src={logoHorizontal}
                    alt={altText}
                    className="hidden sm:block h-10 w-auto"
                />
            </div>
        );
    }

    if (variant === 'hero') {
        return (
            <img
                src={logoStackedTagline}
                alt={altText}
                className={cn("w-auto max-w-[280px] md:max-w-[400px] mx-auto", className)}
                {...props}
            />
        );
    }

    if (variant === 'footer') {
        return (
            <img
                src={logoHorizontalTagline}
                alt={altText}
                className={cn("h-12 w-auto", className)}
                {...props}
            />
        );
    }

    return null;
};

Logo.propTypes = {
    variant: PropTypes.oneOf(['header', 'hero', 'footer', 'mark']),
    className: PropTypes.string,
};

export default Logo;
