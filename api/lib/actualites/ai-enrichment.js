/**
 * AI ENRICHMENT MODULE FOR ACTUALITES
 *
 * Uses Blackbox AI API to:
 * - Generate FALC (Facile à Lire et à Comprendre) summaries
 * - Extract "change_summary" (Ce que ça change)
 * - Extract "next_steps" (Que faire maintenant)
 * - Enhance topic classification
 * - Detect impact level with reasoning
 */

const BLACKBOX_API_URL = 'https://api.blackbox.ai/v1/chat/completions';

/**
 * Call Blackbox AI API
 * @param {Object} params
 * @param {string} params.prompt - The prompt to send
 * @param {number} params.max_tokens - Max tokens (default 500)
 * @returns {Promise<string>} - AI response
 */
async function callBlackboxAI({ prompt, max_tokens = 500 }) {
  const apiKey = process.env.BLACKBOX_API_KEY;

  if (!apiKey) {
    console.warn('[AI Enrichment] BLACKBOX_API_KEY not set, skipping AI enrichment');
    return null;
  }

  try {
    const response = await fetch(BLACKBOX_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Or 'claude-sonnet-4' depending on Blackbox API support
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert en simplification de l\'information administrative française. Tu réponds de manière concise, factuelle et actionnable.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens,
        temperature: 0.3 // Low temperature for factual content
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AI Enrichment] Blackbox API error (${response.status}):`, errorText);
      return null;
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      console.error('[AI Enrichment] No choices returned from Blackbox API');
      return null;
    }

    const content = data.choices[0].message?.content?.trim();
    return content || null;

  } catch (error) {
    console.error('[AI Enrichment] Error calling Blackbox API:', error.message);
    return null;
  }
}

/**
 * Generate FALC (Facile à Lire et à Comprendre) summary
 * @param {Object} params
 * @param {string} params.title - Article title
 * @param {string} params.excerpt - Article excerpt
 * @param {string} params.content - Full content (optional)
 * @returns {Promise<string|null>} - FALC summary
 */
export async function generateFALCSummary({ title, excerpt, content = '' }) {
  const textToSimplify = content || excerpt || title;

  if (!textToSimplify || textToSimplify.length < 20) {
    return null;
  }

  const prompt = `
Résume cette actualité en FALC (Facile à Lire et à Comprendre) :
- Phrases courtes et simples
- Vocabulaire clair (pas de jargon)
- Maximum 3-4 phrases
- Garde les informations essentielles

TEXTE :
${textToSimplify.substring(0, 1500)}

RÉSUMÉ FALC :
`.trim();

  return await callBlackboxAI({ prompt, max_tokens: 200 });
}

/**
 * Extract change summary ("Ce que ça change")
 * @param {Object} params
 * @param {string} params.title
 * @param {string} params.excerpt
 * @param {string} params.content
 * @returns {Promise<string|null>}
 */
export async function extractChangeSummary({ title, excerpt, content = '' }) {
  const fullText = content || excerpt || title;

  if (!fullText || fullText.length < 30) {
    return null;
  }

  const prompt = `
Analyse cette actualité et explique concrètement "CE QUE ÇA CHANGE" pour les bénéficiaires :
- Quels droits/aides/montants changent ?
- Pour qui ?
- Depuis quand ?

Sois factuel et concis (max 3-4 points). Si rien ne change vraiment, réponds "null".

TEXTE :
${fullText.substring(0, 1500)}

CE QUE ÇA CHANGE :
`.trim();

  const result = await callBlackboxAI({ prompt, max_tokens: 250 });

  // Si l'IA répond "null" ou équivalent, retourner null
  if (result && (result.toLowerCase().includes('rien ne change') || result.trim() === 'null')) {
    return null;
  }

  return result;
}

/**
 * Extract next steps ("Que faire maintenant")
 * @param {Object} params
 * @param {string} params.title
 * @param {string} params.excerpt
 * @param {string} params.content
 * @returns {Promise<string|null>}
 */
export async function extractNextSteps({ title, excerpt, content = '' }) {
  const fullText = content || excerpt || title;

  if (!fullText || fullText.length < 30) {
    return null;
  }

  const prompt = `
Analyse cette actualité et indique "QUE FAIRE MAINTENANT" de manière actionnable :
- Démarches à effectuer ?
- Documents à préparer ?
- Échéances importantes ?
- Où se renseigner ?

Sois concret et utile (max 3-4 actions). Si aucune action n'est requise, réponds "null".

TEXTE :
${fullText.substring(0, 1500)}

QUE FAIRE MAINTENANT :
`.trim();

  const result = await callBlackboxAI({ prompt, max_tokens: 250 });

  if (result && (result.toLowerCase().includes('aucune action') || result.trim() === 'null')) {
    return null;
  }

  return result;
}

/**
 * Enhance topic classification using AI
 * @param {Object} params
 * @param {string} params.title
 * @param {string} params.excerpt
 * @param {string[]} params.detectedTopics - Topics already detected by rule-based classifier
 * @returns {Promise<Object|null>} - { topics: string[], topic_primary: string, reasoning: string }
 */
export async function enhanceTopicClassification({ title, excerpt, detectedTopics = [] }) {
  const fullText = `${title}\n${excerpt}`;

  if (!fullText || fullText.length < 20) {
    return null;
  }

  const availableTopics = [
    'logement', 'sante', 'handicap', 'emploi', 'famille', 'budget', 'mobilite',
    'justice', 'numerique', 'nouveaux_arrivants', 'education_formation',
    'retraite_dependance', 'energie_environnement', 'consommation_fraudes',
    'impots_finances_publiques', 'vie_associative', 'securite_civile', 'international', 'general'
  ];

  const prompt = `
Classifie cette actualité dans 1 à 3 topics parmi : ${availableTopics.join(', ')}.

RÈGLE IMPORTANTE pour "international" :
- "international" = droits/mobilité UE/EEE, immigration/asile, consulaire, crises internationales impactant droits en France
- "nouveaux_arrivants" = démarches en France pour nouveaux arrivants (cartes, naturalisation, etc.)
- Si l'info parle de démarches françaises pour étrangers vivant en France => "nouveaux_arrivants"
- Si l'info parle de mobilité UE, consulaire, coordination internationale => "international"

TEXTE :
${fullText.substring(0, 800)}

Topics détectés (rule-based) : ${detectedTopics.join(', ') || 'aucun'}

Réponds au format JSON strict :
{
  "topics": ["topic1", "topic2"],
  "topic_primary": "topic1",
  "reasoning": "Explication courte"
}
`.trim();

  const result = await callBlackboxAI({ prompt, max_tokens: 200 });

  if (!result) return null;

  try {
    // Extract JSON from markdown code blocks if present
    let jsonStr = result;
    const jsonMatch = result.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonStr);

    // Validation
    if (!Array.isArray(parsed.topics) || !parsed.topic_primary) {
      console.warn('[AI Enrichment] Invalid topic classification response:', result);
      return null;
    }

    // Filter out invalid topics
    parsed.topics = parsed.topics.filter(t => availableTopics.includes(t));

    if (parsed.topics.length === 0) {
      return null;
    }

    return parsed;

  } catch (error) {
    console.error('[AI Enrichment] Failed to parse topic classification response:', error.message);
    return null;
  }
}

/**
 * Detect impact level with AI reasoning
 * @param {Object} params
 * @param {string} params.title
 * @param {string} params.excerpt
 * @param {string} params.ruleBasedImpact - Impact detected by rule-based classifier
 * @returns {Promise<Object|null>} - { impact: 'alerte'|'important'|'info', reasoning: string }
 */
export async function detectImpactWithReasoning({ title, excerpt, ruleBasedImpact = 'info' }) {
  const fullText = `${title}\n${excerpt}`;

  if (!fullText || fullText.length < 20) {
    return null;
  }

  const prompt = `
Analyse l'impact de cette actualité sur les bénéficiaires et classifie-la :

- "alerte" : échéance courte, risque perte droit, fraude massive, crise, urgence
- "important" : nouvelle aide, revalorisation, changement procédure, extension conditions
- "info" : rappel, publication générale, MAJ mineure

TEXTE :
${fullText.substring(0, 800)}

Impact détecté (rule-based) : ${ruleBasedImpact}

Réponds au format JSON strict :
{
  "impact": "alerte|important|info",
  "reasoning": "Explication courte"
}
`.trim();

  const result = await callBlackboxAI({ prompt, max_tokens: 150 });

  if (!result) return null;

  try {
    let jsonStr = result;
    const jsonMatch = result.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonStr);

    if (!['alerte', 'important', 'info'].includes(parsed.impact)) {
      console.warn('[AI Enrichment] Invalid impact value:', parsed.impact);
      return null;
    }

    return parsed;

  } catch (error) {
    console.error('[AI Enrichment] Failed to parse impact detection response:', error.message);
    return null;
  }
}

/**
 * Full enrichment pipeline (call all AI enrichments)
 * @param {Object} article - Article to enrich
 * @returns {Promise<Object>} - Enriched fields
 */
export async function enrichArticle(article) {
  const { title, excerpt, content, topics = [], impact = 'info' } = article;

  console.log(`[AI Enrichment] Enriching article: ${title?.substring(0, 60)}...`);

  const enrichments = {};

  try {
    // Run enrichments in parallel for speed
    const [
      falcSummary,
      changeSummary,
      nextSteps,
      enhancedTopics,
      impactDetection
    ] = await Promise.all([
      generateFALCSummary({ title, excerpt, content }),
      extractChangeSummary({ title, excerpt, content }),
      extractNextSteps({ title, excerpt, content }),
      enhanceTopicClassification({ title, excerpt, detectedTopics: topics }),
      detectImpactWithReasoning({ title, excerpt, ruleBasedImpact: impact })
    ]);

    if (falcSummary) {
      enrichments.falc_summary = falcSummary;
    }

    if (changeSummary) {
      enrichments.change_summary = changeSummary;
    }

    if (nextSteps) {
      enrichments.next_steps = nextSteps;
    }

    if (enhancedTopics) {
      enrichments.topics = enhancedTopics.topics;
      enrichments.topic_primary = enhancedTopics.topic_primary;
      enrichments.ai_topic_reasoning = enhancedTopics.reasoning;
    }

    if (impactDetection) {
      enrichments.impact = impactDetection.impact;
      enrichments.ai_impact_reasoning = impactDetection.reasoning;
    }

    console.log(`[AI Enrichment] Enriched ${Object.keys(enrichments).length} fields`);

    return enrichments;

  } catch (error) {
    console.error('[AI Enrichment] Error in enrichment pipeline:', error.message);
    return enrichments; // Return partial enrichments if any
  }
}
