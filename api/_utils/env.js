/**
 * Centralized environment access (server + node scripts).
 *
 * IMPORTANT:
 * - Never log secret values. Errors must mention variable names only.
 * - Frontend must NOT import this module. Frontend uses Vite `import.meta.env` via `src/config/env.js`.
 */

/**
 * @typedef {object} GetEnvOptions
 * @property {boolean=} required
 * @property {string=} default
 * @property {string[]=} aliases
 * @property {boolean=} redact
 */

const warnedAliasConflicts = new Set();

/**
 * @param {unknown} raw
 * @returns {string | undefined}
 */
function normalizeEnvValue(raw) {
  if (typeof raw !== 'string') return undefined;
  const value = raw.trim();
  return value ? value : undefined;
}

/**
 * Read a single environment variable safely (trimmed).
 *
 * @param {string} name
 * @param {GetEnvOptions=} options
 * @returns {string | undefined}
 */
export function getEnv(name, options = {}) {
  const aliases = Array.isArray(options.aliases) ? options.aliases : [];
  const keys = aliases.length > 0 ? [name, ...aliases] : [name];

  /** @type {Array<[string, string]>} */
  const present = [];
  for (const key of keys) {
    const value = normalizeEnvValue(process.env[key]);
    if (value != null) present.push([key, value]);
  }

  if (present.length > 1) {
    const firstValue = present[0][1];
    const allSame = present.every(([, value]) => value === firstValue);
    if (!allSame && !warnedAliasConflicts.has(name)) {
      warnedAliasConflicts.add(name);
      // Never log values. Names-only warning for misconfigured duplicates.
      console.warn(
        `[env] Multiple environment variables are set for ${name}: ${present.map(([k]) => k).join(', ')}.`,
      );
    }
  }

  const resolved = present.length > 0 ? present[0][1] : undefined;

  if (resolved != null) return resolved;

  if (Object.prototype.hasOwnProperty.call(options, 'default')) {
    return options.default;
  }

  if (options.required) {
    throw new Error(`[env] Missing required environment variable: ${name}`);
  }

  return undefined;
}

/**
 * Read a single environment variable with aliases (optional).
 *
 * @param {string} name
 * @param {{ aliases?: string[] }=} options
 * @returns {string | undefined}
 */
export function getOptionalEnv(name, options = {}) {
  return getEnv(name, { aliases: options.aliases });
}

/**
 * Return the first defined value among a canonical name and its aliases.
 *
 * @param {string} name
 * @param {string[]} aliases
 * @returns {string | undefined}
 */
export function envAliases(name, aliases = []) {
  return getOptionalEnv(name, { aliases });
}

/**
 * Require a list of environment variables to exist.
 *
 * @param {string[]} names
 * @returns {Record<string, string>}
 */
export function requireEnv(names) {
  const missing = [];
  /** @type {Record<string, string>} */
  const out = {};

  for (const name of names) {
    const value = getEnv(name);
    if (!value) missing.push(name);
    else out[name] = value;
  }

  if (missing.length > 0) {
    throw new Error(`[env] Missing required environment variables: ${missing.join(', ')}`);
  }

  return out;
}

// -----------------------------------------
// Normalized exports (names only, no values)
// -----------------------------------------

export const env = {
  kv: {
    get url() {
      return envAliases('KV_REST_API_URL', [
        // Preferred Upstash aliases
        'UPSTASH_KV_REST_API_URL',
        // Legacy (double "KV") aliases
        'UPSTASH_KV_KV_REST_API_URL',
        // Common Upstash REST aliases
        'UPSTASH_REDIS_REST_URL',
      ]);
    },
    get token() {
      return envAliases('KV_REST_API_TOKEN', [
        'UPSTASH_KV_REST_API_TOKEN',
        'UPSTASH_KV_KV_REST_API_TOKEN',
        'UPSTASH_REDIS_REST_TOKEN',
      ]);
    },
  },

  storage: {
    get endpoint() {
      return getEnv('STORAGE_ENDPOINT');
    },
    get bucket() {
      return getEnv('STORAGE_BUCKET');
    },
    get region() {
      return getEnv('STORAGE_REGION') || 'auto';
    },
    get accessKeyId() {
      return getEnv('STORAGE_ACCESS_KEY_ID');
    },
    get secretAccessKey() {
      return getEnv('STORAGE_SECRET_ACCESS_KEY');
    },
  },

  sentry: {
    // DSN is public (not a secret), but still treated as config.
    get dsn() {
      return envAliases('SENTRY_DSN', ['VITE_SENTRY_DSN']);
    },
    get environment() {
      return envAliases('VERCEL_ENV', ['VITE_ENV']) || 'development';
    },
    get release() {
      return envAliases('VERCEL_GIT_COMMIT_SHA', ['VITE_GIT_COMMIT_SHA']) || 'dev';
    },
  },

  db: {
    get databaseUrl() {
      return getEnv('DATABASE_URL');
    },
    get prismaUrl() {
      return getEnv('POSTGRES_PRISMA_URL');
    },
    get directUrl() {
      return getEnv('POSTGRES_URL_NON_POOLING', { aliases: ['DATABASE_URL_UNPOOLED'] });
    },
    get directUrlLegacy() {
      return getEnv('DATABASE_URL_UNPOOLED');
    },
    get databaseUrlTest() {
      return getEnv('DATABASE_URL_TEST');
    },
  },

  secrets: {
    get jwtSecret() {
      return getEnv('JWT_SECRET');
    },
    get adaEncryptionKey() {
      return getEnv('ADA_ENCRYPTION_KEY');
    },
    get cronSecret() {
      return getEnv('CRON_SECRET');
    },
    get adminToken() {
      return getEnv('ADMIN_TOKEN');
    },
    get adminEmail() {
      return getEnv('ADMIN_EMAIL');
    },
    get adminPassword() {
      return getEnv('ADMIN_PASSWORD');
    },
    get bypassSecret() {
      return getEnv('BYPASS_SECRET');
    },
    get debugToken() {
      return getEnv('DEBUG_TOKEN');
    },
  },

  ai: {
    get geminiKey() {
      return envAliases('GEMINI_API_KEY', ['GOOGLE_API_KEY']);
    },
  },

  flags: {
    get devLoginEnabled() {
      return getEnv('VITE_DEV_LOGIN_ENABLED') === 'true';
    },
    get allowDevTools() {
      return getEnv('ALLOW_DEV_TOOLS') === 'true';
    },
    get publicDiagnostics() {
      return getEnv('VITE_PUBLIC_DIAGNOSTICS') === 'true';
    },
  },

  runtime: {
    get nodeEnv() {
      return getEnv('NODE_ENV') || 'development';
    },
    get vercelEnv() {
      return envAliases('VERCEL_ENV', ['VITE_ENV']) || 'development';
    },
    get logLevel() {
      return getEnv('LOG_LEVEL') || 'info';
    },
    get publicBaseUrl() {
      return getEnv('PUBLIC_BASE_URL');
    },
    get appBaseUrl() {
      return envAliases('APP_BASE_URL', ['PUBLIC_BASE_URL', 'VITE_BASE_URL']);
    },
  },
};
