/**
 * FALC Content Display Component
 * Displays simplified content following FALC (Facile à Lire et à Comprendre) guidelines:
 * - Short sentences (1 idea per sentence)
 * - Simple vocabulary
 * - Clear structure with headings
 * - Action steps when available
 */
/**
 * @param {{ falcData: any, entityType?: string }} props
 */
export default function FalcContent({ falcData, entityType }) {
  // Kept for compatibility: some pages pass this prop and strict TS checkJs infers component props from destructuring.
  void entityType;
  if (!falcData) {
    return (
      <div className="falc-content-empty" style={{ padding: '1rem', color: '#666' }}>
        <p>Aucun contenu FALC disponible.</p>
      </div>
    );
  }

  // Extract FALC fields based on entity type
  const {
    summary_falc,
    conditions_falc,
    montant_falc,
    key_points_falc,
    description_falc,
    resume_falc,
  } = falcData;

  const summary = summary_falc || resume_falc || description_falc;
  const keyPoints = key_points_falc || [];

  return (
    <div className="falc-content" style={{ lineHeight: '1.8' }}>
      {/* Main Summary */}
      {summary && (
        <section className="falc-summary" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#0066cc' }}>
            📖 C'est quoi ?
          </h2>
          <div 
            style={{ 
              fontSize: '1.125rem', 
              color: '#333',
              whiteSpace: 'pre-wrap'
            }}
          >
            {summary}
          </div>
        </section>
      )}

      {/* Conditions (for Aide) */}
      {conditions_falc && (
        <section className="falc-conditions" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#0066cc' }}>
            ✅ Pour qui ?
          </h2>
          <div 
            style={{ 
              fontSize: '1.125rem', 
              color: '#333',
              whiteSpace: 'pre-wrap'
            }}
          >
            {conditions_falc}
          </div>
        </section>
      )}

      {/* Amount (for Aide) */}
      {montant_falc && (
        <section className="falc-montant" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#0066cc' }}>
            💰 Combien ?
          </h2>
          <div 
            style={{ 
              fontSize: '1.125rem', 
              color: '#333',
              whiteSpace: 'pre-wrap'
            }}
          >
            {montant_falc}
          </div>
        </section>
      )}

      {/* Key Points */}
      {keyPoints.length > 0 && (
        <section className="falc-key-points" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#0066cc' }}>
            🔑 Points importants
          </h2>
          <ul style={{ 
            listStyle: 'none', 
            padding: 0,
            margin: 0
          }}>
            {keyPoints.map((point, index) => (
              <li 
                key={index}
                style={{
                  fontSize: '1.125rem',
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  backgroundColor: '#f0f8ff',
                  borderLeft: '4px solid #0066cc',
                  borderRadius: '0.25rem'
                }}
              >
                {point}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Help Text */}
      <div 
        className="falc-help" 
        style={{ 
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#fff9e6',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          color: '#666'
        }}
      >
        <p style={{ margin: 0 }}>
          💡 <strong>FALC</strong> = Facile à Lire et à Comprendre. 
          Ce texte est simplifié pour être plus facile à comprendre.
        </p>
      </div>
    </div>
  );
}
