import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let synonymMap = null;

/**
 * Load and cache the synonyms map from synonyms.json.
 */
function loadSynonyms() {
  if (synonymMap) return synonymMap;
  try {
    const raw = readFileSync(join(__dirname, '..', 'data', 'synonyms.json'), 'utf-8');
    synonymMap = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load synonyms.json:', e.message);
    synonymMap = {};
  }
  return synonymMap;
}

/**
 * Normalize a string: lowercase, remove accents, trim.
 */
function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['']/g, "'")
    .trim();
}

/**
 * Expand a search query with synonyms.
 * Returns the original query plus any synonym expansions joined with spaces.
 *
 * Example: "cmu allocation" → "cmu css complémentaire santé solidaire couverture maladie universelle allocation alloc aide financière prestation"
 *
 * For PostgreSQL FTS, we build an OR-based tsquery from the expanded terms.
 */
export function expandQuery(query) {
  if (!query || typeof query !== 'string') return query;

  const map = loadSynonyms();
  const normalizedQuery = normalize(query);
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

  const expandedTerms = new Set();

  // Add original tokens
  tokens.forEach(t => expandedTerms.add(t));

  // Check single tokens
  for (const token of tokens) {
    const key = normalize(token);
    if (map[key]) {
      map[key].forEach(syn => expandedTerms.add(normalize(syn)));
    }
  }

  // Check multi-word phrases (2-3 word combinations)
  for (let len = 2; len <= Math.min(3, tokens.length); len++) {
    for (let i = 0; i <= tokens.length - len; i++) {
      const phrase = tokens.slice(i, i + len).join(' ');
      const key = normalize(phrase);
      if (map[key]) {
        map[key].forEach(syn => expandedTerms.add(normalize(syn)));
      }
    }
  }

  return Array.from(expandedTerms).join(' ');
}

/**
 * Build a PostgreSQL tsquery string using OR (|) from expanded terms.
 * This allows matching any of the synonym terms.
 *
 * Returns a string suitable for to_tsquery('french', ...).
 */
export function buildExpandedTsquery(query) {
  if (!query || typeof query !== 'string') return null;

  const map = loadSynonyms();
  const normalizedQuery = normalize(query);
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

  // Collect all term groups: original terms AND their synonyms
  const allTermGroups = [];

  // Original query as AND group
  allTermGroups.push(tokens.join(' & '));

  // For each token, check synonyms and add as OR alternatives
  const synonymTerms = [];
  for (const token of tokens) {
    const key = normalize(token);
    if (map[key]) {
      for (const syn of map[key]) {
        const synTokens = normalize(syn).split(/\s+/).filter(Boolean);
        synonymTerms.push(synTokens.join(' & '));
      }
    }
  }

  // Check multi-word phrases
  for (let len = 2; len <= Math.min(3, tokens.length); len++) {
    for (let i = 0; i <= tokens.length - len; i++) {
      const phrase = tokens.slice(i, i + len).join(' ');
      const key = normalize(phrase);
      if (map[key]) {
        for (const syn of map[key]) {
          const synTokens = normalize(syn).split(/\s+/).filter(Boolean);
          synonymTerms.push(synTokens.join(' & '));
        }
      }
    }
  }

  if (synonymTerms.length === 0) {
    // No synonyms found, return null to use default plainto_tsquery
    return null;
  }

  // Combine: (original) | (synonym1) | (synonym2) ...
  const allGroups = [allTermGroups[0], ...synonymTerms];
  // Wrap each group in parens and join with OR
  return allGroups.map(g => `(${g})`).join(' | ');
}

export default { expandQuery, buildExpandedTsquery };
