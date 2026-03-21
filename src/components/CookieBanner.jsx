import { useState, useEffect } from 'react';

const STORAGE_KEY = 'ada_cookie_consent';

/**
 * CookieBanner — RGPD Cookie Consent
 *
 * Simple banner that appears at the bottom of the page.
 * Uses localStorage to remember consent. Only needs to be accepted once.
 * This site uses essential cookies only (session, CSRF) — no tracking.
 */
export default function CookieBanner() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        try {
            const consent = localStorage.getItem(STORAGE_KEY);
            if (!consent) {
                setVisible(true);
            }
        } catch {
            // localStorage not available (SSR/private browsing)
        }
    }, []);

    const accept = () => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                accepted: true,
                date: new Date().toISOString(),
            }));
        } catch { /* ignore */ }
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div
            id="cookie-banner"
            role="dialog"
            aria-label="Bannière de cookies"
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 9999,
                background: 'rgba(15, 23, 42, 0.95)',
                backdropFilter: 'blur(12px)',
                color: '#e2e8f0',
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                flexWrap: 'wrap',
                fontSize: '14px',
                lineHeight: '1.5',
                borderTop: '1px solid rgba(148, 163, 184, 0.2)',
                boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
            }}
        >
            <p style={{ margin: 0, maxWidth: '600px', textAlign: 'center' }}>
                Ce site utilise des cookies essentiels au fonctionnement du service.
                Aucun cookie de traçage n&apos;est utilisé.{' '}
                <a
                    href="/politique-confidentialite"
                    style={{ color: '#93c5fd', textDecoration: 'underline' }}
                >
                    En savoir plus
                </a>
            </p>
            <button
                onClick={accept}
                id="cookie-accept-btn"
                style={{
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    padding: '8px 24px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'background 0.2s',
                    whiteSpace: 'nowrap',
                }}
                onMouseOver={(e) => { e.target.style.background = '#2563eb'; }}
                onFocus={(e) => { e.target.style.background = '#2563eb'; }}
                onMouseOut={(e) => { e.target.style.background = '#3b82f6'; }}
                onBlur={(e) => { e.target.style.background = '#3b82f6'; }}
            >
                Accepter
            </button>
        </div>
    );
}
