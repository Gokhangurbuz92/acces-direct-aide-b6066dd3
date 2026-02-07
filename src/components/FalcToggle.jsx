import { useEffect, useState } from 'react';

/**
 * FALC Toggle Component
 * Accessible toggle for switching between normal and FALC (easy-to-read) content
 * Features:
 * - Keyboard navigation (Space/Enter to toggle)
 * - ARIA attributes for screen readers
 * - localStorage persistence
 * - Disabled state when FALC unavailable
 */
export default function FalcToggle({ hasFalcContent, onChange, className = '' }) {
  const [isFalcMode, setIsFalcMode] = useState(false);

  // Load preference from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('falc-mode-preference');
      if (saved === 'true' && hasFalcContent) {
        setIsFalcMode(true);
        onChange?.(true);
      }
    } catch (error) {
      // localStorage might be unavailable (private browsing, etc.)
      console.warn('localStorage unavailable:', error);
    }
  }, [hasFalcContent, onChange]);

  const handleToggle = () => {
    if (!hasFalcContent) return;
    
    const newValue = !isFalcMode;
    setIsFalcMode(newValue);
    onChange?.(newValue);
    
    try {
      localStorage.setItem('falc-mode-preference', String(newValue));
    } catch (error) {
      console.warn('Failed to save preference:', error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className={`falc-toggle-container ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={isFalcMode}
        aria-label={hasFalcContent ? "Activer la version facile à lire (FALC)" : "Version facile à lire non disponible"}
        disabled={!hasFalcContent}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`falc-toggle ${isFalcMode ? 'active' : ''} ${!hasFalcContent ? 'disabled' : ''}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          border: '2px solid',
          borderColor: hasFalcContent ? (isFalcMode ? '#0066cc' : '#ccc') : '#e0e0e0',
          borderRadius: '0.5rem',
          backgroundColor: isFalcMode ? '#e6f2ff' : '#fff',
          cursor: hasFalcContent ? 'pointer' : 'not-allowed',
          opacity: hasFalcContent ? 1 : 0.6,
          transition: 'all 0.2s ease',
          fontSize: '1rem',
          fontWeight: '500',
        }}
      >
        <span
          className="toggle-icon"
          aria-hidden="true"
          style={{
            display: 'inline-block',
            width: '2.5rem',
            height: '1.5rem',
            position: 'relative',
            backgroundColor: isFalcMode ? '#0066cc' : '#ccc',
            borderRadius: '1rem',
            transition: 'background-color 0.2s ease',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '0.125rem',
              left: isFalcMode ? '1.125rem' : '0.125rem',
              width: '1.25rem',
              height: '1.25rem',
              backgroundColor: '#fff',
              borderRadius: '50%',
              transition: 'left 0.2s ease',
            }}
          />
        </span>
        <span className="toggle-label">
          {hasFalcContent ? 'Version facile (FALC)' : 'FALC indisponible'}
        </span>
      </button>
      {!hasFalcContent && (
        <p 
          className="falc-unavailable-message" 
          style={{ 
            marginTop: '0.5rem', 
            fontSize: '0.875rem', 
            color: '#666',
            fontStyle: 'italic'
          }}
        >
          La version facile à lire n'est pas encore disponible pour ce contenu.
        </p>
      )}
    </div>
  );
}
