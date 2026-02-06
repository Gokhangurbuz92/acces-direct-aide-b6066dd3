import React from 'react';

/**
 * FalcContent - Display FALC (Facile à Lire et à Comprendre) simplified content
 * 
 * @param {object} falcData - FALC summary data
 * @param {string} falcData.titre_falc - Simplified title
 * @param {string} falcData.resume_falc - Simplified summary
 * @param {string} falcData.etapes_falc - JSON string of simple steps
 * @param {string} falcData.points_cles - JSON string of key points
 */
export default function FalcContent({ falcData }) {
  if (!falcData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-yellow-800">
          La version simplifiée n'est pas disponible pour le moment.
        </p>
      </div>
    );
  }

  const { titre_falc, resume_falc, etapes_falc, points_cles } = falcData;
  
  // Parse JSON strings
  let etapes = [];
  let points = [];
  
  try {
    if (etapes_falc) etapes = JSON.parse(etapes_falc);
  } catch (e) {
    console.warn('Failed to parse etapes_falc:', e);
  }
  
  try {
    if (points_cles) points = JSON.parse(points_cles);
  } catch (e) {
    console.warn('Failed to parse points_cles:', e);
  }

  return (
    <div className="falc-content space-y-6">
      {/* FALC Badge */}
      <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        Version Facile à Lire
      </div>

      {/* Simplified Title */}
      {titre_falc && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 leading-relaxed">
            {titre_falc}
          </h2>
        </div>
      )}

      {/* Simplified Summary */}
      {resume_falc && (
        <div className="bg-white border-l-4 border-blue-500 p-6 rounded-r-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            En résumé
          </h3>
          <div className="prose prose-lg max-w-none">
            {resume_falc.split('\n').map((paragraph, idx) => (
              paragraph.trim() && (
                <p key={idx} className="text-gray-700 leading-relaxed mb-3">
                  {paragraph}
                </p>
              )
            ))}
          </div>
        </div>
      )}

      {/* Simple Steps */}
      {etapes && etapes.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Ce que vous devez faire
          </h3>
          <ol className="space-y-3">
            {etapes.map((etape, idx) => (
              <li key={idx} className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                  {idx + 1}
                </span>
                <span className="text-gray-800 leading-relaxed pt-1">
                  {etape}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Key Points */}
      {points && points.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            Points importants à retenir
          </h3>
          <ul className="space-y-2">
            {points.map((point, idx) => (
              <li key={idx} className="flex gap-3">
                <span className="text-purple-600 font-bold">•</span>
                <span className="text-gray-800 leading-relaxed">
                  {point}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
