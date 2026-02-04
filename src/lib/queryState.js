/**
 * Query State Management Utilities
 * 
 * Provides utilities for managing URL query parameters in list pages.
 * Ensures type safety, whitelisting, and consistent behavior across pages.
 */

/**
 * Parse query parameters from URLSearchParams
 * @param {URLSearchParams} searchParams - URL search parameters
 * @param {Object} schema - Schema defining allowed parameters and their types
 * @returns {Object} Parsed parameters
 */
export function parseQueryParams(searchParams, schema = {}) {
  const params = {};
  
  for (const [key, config] of Object.entries(schema)) {
    const value = searchParams.get(key);
    
    if (!value) {
      params[key] = config.default ?? '';
      continue;
    }
    
    // Type conversion
    switch (config.type) {
      case 'number':
        const num = parseInt(value, 10);
        params[key] = isNaN(num) ? config.default ?? 1 : num;
        break;
      case 'boolean':
        params[key] = value === 'true' || value === '1';
        break;
      case 'string':
      default:
        params[key] = value;
        break;
    }
  }
  
  return params;
}

/**
 * Update query parameters in URL
 * @param {URLSearchParams} searchParams - Current search parameters
 * @param {Function} setSearchParams - Function to update search parameters
 * @param {string} key - Parameter key to update
 * @param {any} value - New value (empty string or falsy to remove)
 * @param {Object} options - Options
 * @param {boolean} options.resetPage - Whether to reset page to 1 (default: true)
 */
export function updateQueryParam(searchParams, setSearchParams, key, value, options = {}) {
  const { resetPage = true } = options;
  const newParams = new URLSearchParams(searchParams);
  
  if (value === '' || value === null || value === undefined) {
    newParams.delete(key);
  } else {
    newParams.set(key, String(value));
  }
  
  // Reset page to 1 when changing filters (unless updating page itself)
  if (resetPage && key !== 'page') {
    newParams.set('page', '1');
  }
  
  setSearchParams(newParams);
}

/**
 * Clear all query parameters
 * @param {Function} setSearchParams - Function to update search parameters
 * @param {Array<string>} keep - Parameters to keep (e.g., ['slug'])
 */
export function clearQueryParams(setSearchParams, keep = []) {
  if (keep.length === 0) {
    setSearchParams({});
  } else {
    const newParams = new URLSearchParams();
    keep.forEach(key => {
      const value = new URLSearchParams(window.location.search).get(key);
      if (value) newParams.set(key, value);
    });
    setSearchParams(newParams);
  }
}

/**
 * Get active filters from query parameters
 * @param {Object} params - Parsed query parameters
 * @param {Array<string>} exclude - Keys to exclude (e.g., ['page', 'pageSize'])
 * @returns {Object} Active filters
 */
export function getActiveFilters(params, exclude = ['page', 'pageSize']) {
  const active = {};
  
  for (const [key, value] of Object.entries(params)) {
    if (exclude.includes(key)) continue;
    if (value === '' || value === null || value === undefined) continue;
    active[key] = value;
  }
  
  return active;
}

/**
 * Check if any filters are active
 * @param {Object} params - Parsed query parameters
 * @param {Array<string>} exclude - Keys to exclude
 * @returns {boolean} True if any filters are active
 */
export function hasActiveFilters(params, exclude = ['page', 'pageSize']) {
  return Object.keys(getActiveFilters(params, exclude)).length > 0;
}

/**
 * Common query parameter schemas for list pages
 */
export const SCHEMAS = {
  aides: {
    q: { type: 'string', default: '' },
    theme: { type: 'string', default: '' },
    situation: { type: 'string', default: '' },
    territoire: { type: 'string', default: '' },
    public: { type: 'string', default: '' },
    organisme: { type: 'string', default: '' },
    urgent: { type: 'string', default: '' },
    page: { type: 'number', default: 1 },
  },
  demarches: {
    q: { type: 'string', default: '' },
    category: { type: 'string', default: '' },
    situation: { type: 'string', default: '' },
    page: { type: 'number', default: 1 },
  },
  structures: {
    q: { type: 'string', default: '' },
    type: { type: 'string', default: '' },
    city: { type: 'string', default: '' },
    page: { type: 'number', default: 1 },
  },
  actualites: {
    categorie: { type: 'string', default: '' },
    page: { type: 'number', default: 1 },
  },
};
