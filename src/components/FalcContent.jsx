/**
 * FALC Content Display Component
 * Displays simplified content following FALC (Facile à Lire et à Comprendre) guidelines:
 * - Short sentences (1 idea per sentence)
 * - Simple vocabulary
 * - Clear structure with headings
 * - Entity-specific sections
 */

/** Helper: strip HTML to plain text */
function stripHtml(text) {
  if (!text) return '';
  return String(text).replace(/<[^>]+>/g, '').trim();
}

/** Helper: truncate to short FALC-friendly sentences */
function toFalcText(text, maxLen = 300) {
  const plain = stripHtml(text);
  if (!plain) return '';
  if (plain.length <= maxLen) return plain;
  const cut = plain.slice(0, maxLen);
  const lastDot = cut.lastIndexOf('.');
  return lastDot > maxLen / 2 ? cut.slice(0, lastDot + 1) : cut + '…';
}

/** Section component */
function FalcSection({ icon, title, children }) {
  if (!children) return null;
  return (
    <section style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: 'hsl(var(--primary))' }}>
        {icon} {title}
      </h2>
      <div style={{ fontSize: '1.125rem', color: 'hsl(var(--foreground))', whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
        {children}
      </div>
    </section>
  );
}

/** List section for arrays */
function FalcListSection({ icon, title, items }) {
  if (!items || !items.length) return null;
  return (
    <section style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: 'hsl(var(--primary))' }}>
        {icon} {title}
      </h2>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((item, i) => (
          <li key={i} style={{
            fontSize: '1.125rem', padding: '0.75rem', marginBottom: '0.5rem',
            backgroundColor: 'hsl(var(--muted))', borderLeft: '4px solid hsl(var(--primary))',
            borderRadius: '0.25rem'
          }}>
            {typeof item === 'string' ? item : (item?.titre || item?.title || item?.nom || JSON.stringify(item))}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Steps section */
function FalcStepsSection({ steps }) {
  if (!steps || !steps.length) return null;
  return (
    <section style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: 'hsl(var(--primary))' }}>
        📋 Les étapes
      </h2>
      <ol style={{ listStyle: 'none', padding: 0, margin: 0, counterReset: 'step' }}>
        {steps.map((step, i) => (
          <li key={i} style={{
            fontSize: '1.125rem', padding: '0.75rem', marginBottom: '0.5rem',
            backgroundColor: 'hsl(var(--muted))', borderLeft: '4px solid hsl(var(--primary))',
            borderRadius: '0.25rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
          }}>
            <span style={{
              minWidth: '2rem', height: '2rem', borderRadius: '50%',
              backgroundColor: 'hsl(var(--primary))', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 'bold', flexShrink: 0,
            }}>
              {step.numero || i + 1}
            </span>
            <div>
              {step.titre && <strong>{step.titre}</strong>}
              {step.description && <p style={{ margin: '0.25rem 0 0' }}>{toFalcText(step.description)}</p>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

// --- Entity-Type Section Renderers ---

function AideFalcSections({ data }) {
  const summary = data.summary_falc || data.resume_falc || data.description_falc || toFalcText(data.cest_quoi || data.description_courte);
  const conditions = data.conditions_falc || toFalcText(data.conditions || data.pour_qui);
  const montant = data.montant_falc || toFalcText(data.montant);
  const comment = toFalcText(data.comment_faire || data.demarche);
  const documents = Array.isArray(data.documents_necessaires) ? data.documents_necessaires : [];
  const keyPoints = data.key_points_falc || [];

  return (
    <>
      <FalcSection icon="📖" title="C'est quoi ?">{summary}</FalcSection>
      <FalcSection icon="✅" title="Pour qui ?">{conditions}</FalcSection>
      <FalcSection icon="💰" title="Combien ?">{montant}</FalcSection>
      <FalcSection icon="🔧" title="Comment faire ?">{comment}</FalcSection>
      <FalcListSection icon="📄" title="Documents à préparer" items={documents} />
      <FalcListSection icon="🔑" title="Points importants" items={keyPoints} />
      {!summary && !conditions && !montant && !comment && documents.length === 0 && keyPoints.length === 0 && (
        <FalcSection icon="ℹ️" title="Information">
          Les informations FALC détaillées ne sont pas encore disponibles pour cette aide.
        </FalcSection>
      )}
    </>
  );
}

function DemarcheFalcSections({ data }) {
  const summary = data.summary_falc || data.resume_falc || data.description_falc || toFalcText(data.description_courte || data.description);
  const pourQui = data.conditions_falc || toFalcText(data.pour_qui);
  const delai = toFalcText(data.delai);
  const cout = toFalcText(data.cout);
  const ouFaire = toFalcText(data.ou_faire);
  const steps = Array.isArray(data.etapes) ? data.etapes : [];
  const documents = Array.isArray(data.documents_necessaires) ? data.documents_necessaires : [];

  return (
    <>
      <FalcSection icon="📖" title="C'est quoi ?">{summary}</FalcSection>
      <FalcSection icon="✅" title="Pour qui ?">{pourQui}</FalcSection>
      <FalcSection icon="⏱️" title="Combien de temps ?">{delai}</FalcSection>
      <FalcSection icon="💰" title="Combien ça coûte ?">{cout}</FalcSection>
      <FalcSection icon="📍" title="Où faire cette démarche ?">{ouFaire}</FalcSection>
      <FalcStepsSection steps={steps} />
      <FalcListSection icon="📄" title="Documents à préparer" items={documents} />
      {!summary && !pourQui && !delai && !cout && !ouFaire && steps.length === 0 && documents.length === 0 && (
        <FalcSection icon="ℹ️" title="Information">
          Les informations FALC détaillées ne sont pas encore disponibles pour cette démarche.
        </FalcSection>
      )}
    </>
  );
}

function StructureFalcSections({ data }) {
  const summary = data.resume_falc || data.summary_falc || data.description_falc || toFalcText(data.description_courte);
  const services = Array.isArray(data.services) ? data.services : [];
  const horaires = toFalcText(data.horaires);
  const contact = [
    data.telephone && `📞 Téléphone : ${data.telephone}`,
    data.email && `📧 Email : ${data.email}`,
    data.site_web && `🌐 Site : ${data.site_web}`,
  ].filter(Boolean).join('\n');
  const adresse = [
    data.adresse,
    [data.code_postal, data.ville].filter(Boolean).join(' '),
  ].filter(Boolean).join('\n');

  return (
    <>
      <FalcSection icon="📖" title="C'est quoi ?">{summary}</FalcSection>
      <FalcListSection icon="🛠️" title="Services proposés" items={services} />
      <FalcSection icon="🕐" title="Horaires">{horaires}</FalcSection>
      <FalcSection icon="📞" title="Contact">{contact}</FalcSection>
      <FalcSection icon="📍" title="Adresse">{adresse}</FalcSection>
      {!summary && services.length === 0 && !horaires && !contact && !adresse && (
        <FalcSection icon="ℹ️" title="Information">
          Les informations FALC détaillées ne sont pas encore disponibles pour cette structure.
        </FalcSection>
      )}
    </>
  );
}

/**
 * @param {{ falcData: any, entityType?: string }} props
 */
export default function FalcContent({ falcData, entityType }) {
  if (!falcData) {
    return (
      <div className="falc-content-empty" style={{ padding: '1rem', color: 'hsl(var(--muted-foreground))' }}>
        <p>Aucun contenu FALC disponible.</p>
      </div>
    );
  }

  return (
    <div className="falc-content" style={{ lineHeight: '1.8' }}>
      {entityType === 'demarche' ? (
        <DemarcheFalcSections data={falcData} />
      ) : entityType === 'structure' ? (
        <StructureFalcSections data={falcData} />
      ) : (
        <AideFalcSections data={falcData} />
      )}

      {/* FALC Help Text */}
      <div
        className="falc-help"
        style={{
          marginTop: '2rem', padding: '1rem',
          backgroundColor: 'hsl(var(--accent))', borderRadius: '0.5rem',
          fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))'
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
