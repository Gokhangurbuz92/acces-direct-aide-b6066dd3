import { env } from '../_utils/env.js';

const GEMINI_EMBEDDING_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent';
const DEFAULT_OUTPUT_DIMENSIONALITY = 768;
const MAX_INPUT_CHARS = 12000;

/** @param {string} text */
function normalizeInput(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

/** @param {string} text @param {number=} maxChars */
function truncateInput(text, maxChars = MAX_INPUT_CHARS) {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars);
}

export function canUseGeminiEmbeddings() {
  return Boolean(env.ai.geminiKey);
}

/** @param {string} text @param {number=} outputDimensionality @returns {Promise<number[] | null>} */
export async function generateEmbedding(text, outputDimensionality = DEFAULT_OUTPUT_DIMENSIONALITY) {
  const apiKey = env.ai.geminiKey;
  if (!apiKey) return null;

  const normalized = normalizeInput(text);
  if (!normalized) return null;

  const payload = {
    model: 'models/gemini-embedding-001',
    content: {
      parts: [{ text: truncateInput(normalized) }],
    },
    outputDimensionality,
  };

  const response = await fetch(`${GEMINI_EMBEDDING_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini embedding request failed (${response.status}): ${errorText.slice(0, 300)}`);
  }

  const data = await response.json();
  const values = data?.embedding?.values;
  if (!Array.isArray(values)) {
    throw new Error('Gemini embedding response missing embedding.values');
  }

  return values
    .slice(0, outputDimensionality)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
}

export { MAX_INPUT_CHARS, DEFAULT_OUTPUT_DIMENSIONALITY };
