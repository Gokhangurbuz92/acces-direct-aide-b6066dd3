import React from 'react';

/**
 * FalcToggle - Toggle switch for FALC (Facile à Lire et à Comprendre) content
 * 
 * @param {boolean} enabled - Whether FALC content is available
 * @param {boolean} active - Whether FALC mode is currently active
 * @param {function} onToggle - Callback when toggle is clicked
 */
export default function FalcToggle({ enabled, active, onToggle }) {
  return (
    <div className="falc-toggle-container bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-blue-900 mb-1">
            Version Facile à Lire et à Comprendre (FALC)
          </h3>
          <p className="text-sm text-blue-700">
            {enabled 
              ? "Activez cette option pour lire une version simplifiée de cette page."
              : "La version simplifiée n'est pas encore disponible pour cette page."}
          </p>
        </div>
        
        <button
          onClick={onToggle}
          disabled={!enabled}
          className={`
            relative inline-flex h-8 w-14 items-center rounded-full transition-colors
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${enabled 
              ? active 
                ? 'bg-blue-600' 
                : 'bg-gray-300 hover:bg-gray-400'
              : 'bg-gray-200 cursor-not-allowed opacity-50'
            }
          `}
          aria-label={enabled ? (active ? "Désactiver le mode FALC" : "Activer le mode FALC") : "Mode FALC non disponible"}
          aria-pressed={active}
          aria-disabled={!enabled}
        >
          <span
            className={`
              inline-block h-6 w-6 transform rounded-full bg-white transition-transform
              ${active ? 'translate-x-7' : 'translate-x-1'}
            `}
          />
        </button>
      </div>
    </div>
  );
}
