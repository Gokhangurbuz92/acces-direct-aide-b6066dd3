/**
 * Territory Cascade Resolution for AccesDirectAide.
 *
 * Given a user's location (INSEE code, department, or region),
 * resolves the full chain of territory scopes they should see:
 *   communal → départemental → régional → national
 *
 * Alsace-specific mapping (MVP):
 *   - Bas-Rhin (67) → Grand Est → national
 *   - Haut-Rhin (68) → Grand Est → national
 *
 * The territoires field in the DB uses string[] with values like:
 *   "national", "ALSACE", "67", "68", "GRAND_EST", "STRASBOURG", etc.
 */

// Department → Region mapping (Alsace focus, extensible)
const DEPT_TO_REGION = {
  '67': 'GRAND_EST',
  '68': 'GRAND_EST',
  // Extensible: add more departments as coverage grows
};

// Region aliases (some data uses different names)
const REGION_ALIASES = {
  'GRAND_EST': ['GRAND_EST', 'ALSACE', 'grand_est', 'alsace', 'Grand Est'],
  // Extensible
};

// Known commune → department mapping (Alsace major cities)
const COMMUNE_TO_DEPT = {
  'STRASBOURG': '67',
  'COLMAR': '68',
  'MULHOUSE': '68',
  'HAGUENAU': '67',
  'SCHILTIGHEIM': '67',
  'ILLKIRCH': '67',
  'SELESTAT': '67',
  'BISCHHEIM': '67',
  'LINGOLSHEIM': '67',
  'OSTWALD': '67',
  'SAINT_LOUIS': '68',
  'GUEBWILLER': '68',
  'THANN': '68',
  'WISSEMBOURG': '67',
  'SAVERNE': '67',
};

/**
 * Resolve the full territory chain for a given location identifier.
 *
 * @param {string} location - Can be:
 *   - An INSEE code (e.g., "67482" for Strasbourg)
 *   - A department code (e.g., "67")
 *   - A commune name (e.g., "STRASBOURG")
 *   - A region name (e.g., "GRAND_EST")
 *   - "national" or "france"
 *
 * @returns {string[]} Array of territory values to include in the filter,
 *   from most specific to most general. Always includes "national".
 */
export function resolveTerritoryChain(location) {
  if (!location || typeof location !== 'string') {
    return ['national'];
  }

  const loc = location.trim().toUpperCase();
  const chain = new Set();

  // Always include the original value
  chain.add(location);

  // National: just return national
  if (loc === 'NATIONAL' || loc === 'FRANCE' || loc === 'FRANCE_ENTIERE') {
    return ['national'];
  }

  // Check if it's a known commune name
  if (COMMUNE_TO_DEPT[loc]) {
    chain.add(loc);
    chain.add(location.toLowerCase());
    const dept = COMMUNE_TO_DEPT[loc];
    chain.add(dept);
    const region = DEPT_TO_REGION[dept];
    if (region) {
      chain.add(region);
      // Add region aliases
      const aliases = REGION_ALIASES[region] || [];
      aliases.forEach(a => chain.add(a));
    }
    chain.add('national');
    return Array.from(chain);
  }

  // Check if it's an INSEE code (5 digits) → extract department (first 2 digits)
  if (/^\d{5}$/.test(loc)) {
    const dept = loc.substring(0, 2);
    chain.add(dept);
    const region = DEPT_TO_REGION[dept];
    if (region) {
      chain.add(region);
      const aliases = REGION_ALIASES[region] || [];
      aliases.forEach(a => chain.add(a));
    }
    chain.add('national');
    return Array.from(chain);
  }

  // Check if it's a department code (2 digits)
  if (/^\d{2,3}$/.test(loc)) {
    chain.add(loc);
    const region = DEPT_TO_REGION[loc];
    if (region) {
      chain.add(region);
      const aliases = REGION_ALIASES[region] || [];
      aliases.forEach(a => chain.add(a));
    }
    chain.add('national');
    return Array.from(chain);
  }

  // Check if it's a known region
  for (const [regionKey, aliases] of Object.entries(REGION_ALIASES)) {
    const normalizedAliases = aliases.map(a => a.toUpperCase());
    if (normalizedAliases.includes(loc) || regionKey === loc) {
      chain.add(regionKey);
      aliases.forEach(a => chain.add(a));
      chain.add('national');
      return Array.from(chain);
    }
  }

  // Unknown location: include as-is + national
  chain.add('national');
  return Array.from(chain);
}

/**
 * Build a Prisma SQL condition for territory cascade filtering.
 * Checks if ANY of the resolved territory values matches the territoires array.
 *
 * @param {string} location - User's location identifier
 * @returns {string[]} The resolved chain for use in SQL
 */
export function getTerritoryFilterValues(location) {
  return resolveTerritoryChain(location);
}

export default { resolveTerritoryChain, getTerritoryFilterValues };
