const SEARCH_API_PATH = '/api/search';
const DEFAULT_LIMIT = 10;
const MIN_LIMIT = 1;
const MAX_LIMIT = 30;
const MIN_QUERY_LENGTH = 2;

export const SEARCH_CATEGORY_OPTIONS = [
  { value: 'LOGEMENT', label: 'Logement' },
  { value: 'SANTE', label: 'Santé' },
  { value: 'HANDICAP', label: 'Handicap' },
  { value: 'EMPLOI', label: 'Emploi' },
  { value: 'FAMILLE', label: 'Famille' },
  { value: 'ETUDES', label: 'Études' },
  { value: 'MOBILITE', label: 'Mobilité' },
  { value: 'ENERGIE', label: 'Énergie' },
  { value: 'ALIMENTATION', label: 'Alimentation' },
  { value: 'JUSTICE', label: 'Justice' },
  { value: 'NUMERIQUE', label: 'Numérique' },
  { value: 'AUTRE', label: 'Autre' },
];

const SEARCH_CATEGORY_LOOKUP = Object.fromEntries(
  SEARCH_CATEGORY_OPTIONS.map((option) => [option.value, option.label])
);

const LEGACY_CATEGORY_MAP = {
  logement: 'LOGEMENT',
  sante: 'SANTE',
  handicap: 'HANDICAP',
  emploi: 'EMPLOI',
  famille: 'FAMILLE',
  etudes: 'ETUDES',
  mobilite: 'MOBILITE',
  energie: 'ENERGIE',
  alimentation: 'ALIMENTATION',
  justice: 'JUSTICE',
  numerique: 'NUMERIQUE',
  autre: 'AUTRE',
};

const activeControllers = new Map();

function normalizeScope(scope) {
  if (!scope) return 'default';
  return String(scope);
}

function clampLimit(limit) {
  const parsed = Number.parseInt(String(limit ?? DEFAULT_LIMIT), 10);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  if (parsed < MIN_LIMIT) return MIN_LIMIT;
  if (parsed > MAX_LIMIT) return MAX_LIMIT;
  return parsed;
}

async function parsePayload(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json().catch(() => null);
  }
  const rawText = await response.text().catch(() => '');
  if (!rawText) return null;
  try {
    return JSON.parse(rawText);
  } catch {
    return rawText;
  }
}

function buildErrorMessage(status, payload) {
  if (payload && typeof payload === 'object') {
    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error.trim();
    }
    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message.trim();
    }
  }
  if (status >= 500) {
    return 'Le service de recherche est temporairement indisponible.';
  }
  if (status === 400) {
    return 'La requête de recherche est invalide.';
  }
  return 'La recherche a échoué.';
}

function normalizeResultItem(item) {
  const normalizedCategory = normalizeSearchCategory(item?.category || item?.categorie);
  const toOptionalNumber = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  return {
    id: item?.id ? String(item.id) : '',
    slug: item?.slug ? String(item.slug) : '',
    title: item?.title || item?.titre || 'Aide',
    description: item?.description || item?.cest_quoi || item?.summary_falc || '',
    category: normalizedCategory || null,
    status: item?.status || null,
    score: toOptionalNumber(item?.score),
    lexicalScore: toOptionalNumber(item?.lexicalScore),
    semanticScore: toOptionalNumber(item?.semanticScore),
    citations: Array.isArray(item?.citations) ? item.citations : [],
  };
}

function normalizeResponse(payload) {
  const rawItems = Array.isArray(payload?.items) ? payload.items : [];
  const results = rawItems.map(normalizeResultItem);
  const totalFromPayload = Number(payload?.total);

  return {
    results,
    meta: {
      total: Number.isFinite(totalFromPayload) ? totalFromPayload : results.length,
      message: typeof payload?.message === 'string' ? payload.message : null,
    },
    error: typeof payload?.error === 'string' ? payload.error : null,
  };
}

function linkAbortSignal(externalSignal, controller) {
  if (!externalSignal) {
    return () => {};
  }

  const abortActiveController = () => controller.abort(externalSignal.reason);
  if (externalSignal.aborted) {
    abortActiveController();
    return () => {};
  }

  externalSignal.addEventListener('abort', abortActiveController, { once: true });
  return () => externalSignal.removeEventListener('abort', abortActiveController);
}

export function normalizeSearchCategory(value) {
  if (!value) return '';
  const rawValue = String(value).trim();
  if (!rawValue) return '';

  const legacyMappedValue = LEGACY_CATEGORY_MAP[rawValue.toLowerCase()];
  if (legacyMappedValue) return legacyMappedValue;

  const upperValue = rawValue.toUpperCase();
  return SEARCH_CATEGORY_LOOKUP[upperValue] ? upperValue : '';
}

export function getSearchCategoryLabel(categoryCode) {
  const normalizedCategory = normalizeSearchCategory(categoryCode);
  return normalizedCategory ? SEARCH_CATEGORY_LOOKUP[normalizedCategory] : 'Non classée';
}

export function isAbortError(error) {
  return error instanceof Error && error.name === 'AbortError';
}

export async function searchAides({
  query,
  category,
  situations,
  geoScope,
  limit = DEFAULT_LIMIT,
  signal,
  scope = 'aides-search',
} = {}) {
  const normalizedQuery = typeof query === 'string' ? query.trim() : '';
  if (normalizedQuery.length < MIN_QUERY_LENGTH) {
    throw new Error(`Veuillez saisir au moins ${MIN_QUERY_LENGTH} caractères.`);
  }

  const normalizedScope = normalizeScope(scope);
  const activeController = activeControllers.get(normalizedScope);
  if (activeController) activeController.abort();

  const controller = new AbortController();
  activeControllers.set(normalizedScope, controller);
  const detachAbortListener = linkAbortSignal(signal, controller);

  const payload = {
    query: normalizedQuery,
    limit: clampLimit(limit),
  };

  const normalizedCategory = normalizeSearchCategory(category);
  if (normalizedCategory) {
    payload.category = normalizedCategory;
  }

  const normalizedSituations = Array.isArray(situations)
    ? situations
    : situations
      ? [situations]
      : [];

  const cleanedSituations = normalizedSituations
    .map((value) => (value == null ? '' : String(value).trim()))
    .filter(Boolean)
    .slice(0, 20);

  if (cleanedSituations.length > 0) {
    payload.situations = cleanedSituations;
  }

  const normalizedGeoScope = typeof geoScope === 'string' ? geoScope.trim() : '';
  if (normalizedGeoScope) {
    payload.geoScope = normalizedGeoScope;
  }

  try {
    const response = await fetch(SEARCH_API_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const parsedPayload = await parsePayload(response);
    if (!response.ok) {
      const error = new Error(buildErrorMessage(response.status, parsedPayload));
      error.status = response.status;
      error.payload = parsedPayload;
      throw error;
    }

    return normalizeResponse(parsedPayload);
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('La recherche est temporairement indisponible.');
  } finally {
    detachAbortListener();
    if (activeControllers.get(normalizedScope) === controller) {
      activeControllers.delete(normalizedScope);
    }
  }
}

export function __resetSearchClientForTests() {
  for (const controller of activeControllers.values()) {
    controller.abort();
  }
  activeControllers.clear();
}
