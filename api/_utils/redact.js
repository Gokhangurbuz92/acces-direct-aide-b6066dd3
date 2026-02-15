/**
 * Redaction helpers for logs and observability.
 *
 * Goals:
 * - Never log secrets (tokens, passwords, cookies, authorization headers, API keys, DB URLs with creds).
 * - Mask common PII (email, phone).
 * - Avoid logging request bodies.
 * - Keep logs bounded (truncate long strings, cap large arrays/objects).
 */

const EMAIL_REGEX = /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
const PHONE_REGEX = /(\b(?:\+33|0)[1-9](?:[\s.-]*\d{2}){4}\b)/g;

const SENSITIVE_KEY_REGEX = /(token|secret|authorization|cookie|password|jwt|api[_-]?key|private[_-]?key|access[_-]?key|session)/i;
const BODY_KEY_REGEX = /(^body$|payload|raw|content|html|markdown)/i;

const DEFAULT_MAX_STRING = 200;
const MAX_QUERY_STRING = 80;
const MAX_ARRAY_ITEMS = 50;
const MAX_OBJECT_KEYS = 50;
const MAX_DEPTH = 6;

/** @param {string} email */
function maskEmail(email) {
  if (!email) return email;
  const [local, domain] = String(email).split('@');
  if (!domain) return email;
  const safeLocal = local.length > 1 ? `${local[0]}***` : '***';
  return `${safeLocal}@${domain}`;
}

/** @param {string} phone */
function maskPhone(phone) {
  if (!phone) return phone;
  const clean = String(phone).replace(/[\s.-]/g, '');
  if (clean.length < 6) return '******';
  return `${clean.slice(0, 2)}******${clean.slice(-2)}`;
}

/** @param {string} value @param {number} maxLen */
function truncateString(value, maxLen) {
  const s = String(value);
  if (s.length <= maxLen) return s;
  return `${s.slice(0, maxLen)}...`;
}

/** @param {unknown} value @param {{ maxLen?: number }=} options */
function sanitizeString(value, { maxLen = DEFAULT_MAX_STRING } = {}) {
  if (value == null) return value;
  let s = String(value);
  s = s.replace(EMAIL_REGEX, (m) => maskEmail(m));
  s = s.replace(PHONE_REGEX, (m) => maskPhone(m));
  return truncateString(s, maxLen);
}

/** @param {unknown} error */
function sanitizeError(error) {
  if (!(error instanceof Error)) return sanitizeString(error);
  return {
    name: error.name,
    message: sanitizeString(error.message, { maxLen: DEFAULT_MAX_STRING }),
    stack: typeof error.stack === 'string' ? sanitizeString(error.stack, { maxLen: 2000 }) : undefined,
  };
}

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isPlainObject(value) {
  if (!value || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Redact an arbitrary value for safe logging.
 *
 * @param {unknown} value
 * @param {{ depth?: number }=} options
 * @returns {unknown}
 */
export function redactValue(value, options = {}) {
  const depth = options.depth ?? 0;
  if (value == null) return value;

  if (typeof value === 'string') return sanitizeString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'bigint') return Number(value);
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) return sanitizeError(value);

  if (depth >= MAX_DEPTH) return '[Truncated]';

  if (Array.isArray(value)) {
    const sliced = value.slice(0, MAX_ARRAY_ITEMS);
    return sliced.map((v) => redactValue(v, { depth: depth + 1 }));
  }

  if (isPlainObject(value)) {
    /** @type {Record<string, unknown>} */
    const out = {};
    const entries = Object.entries(value).slice(0, MAX_OBJECT_KEYS);
    for (const [rawKey, rawVal] of entries) {
      const key = String(rawKey);
      const lower = key.toLowerCase();

      if (SENSITIVE_KEY_REGEX.test(lower)) {
        out[key] = '[REDACTED]';
        continue;
      }

      if (BODY_KEY_REGEX.test(lower)) {
        out[key] = '[REDACTED_BODY]';
        continue;
      }

      const maxLen =
        lower === 'q' || lower.includes('query') || lower.includes('search')
          ? MAX_QUERY_STRING
          : DEFAULT_MAX_STRING;

      if (typeof rawVal === 'string') {
        out[key] = sanitizeString(rawVal, { maxLen });
        continue;
      }

      out[key] = redactValue(rawVal, { depth: depth + 1 });
    }
    return out;
  }

  // Unknown structured types (Map, Set, Buffer, streams) -> string tag only
  try {
    const tag = Object.prototype.toString.call(value);
    return sanitizeString(tag);
  } catch {
    return '[Unserializable]';
  }
}

/**
 * Convenience for logger hooks: always returns a plain object suitable for JSON logs.
 *
 * @param {unknown} obj
 * @returns {Record<string, unknown>}
 */
export function redactForLog(obj) {
  if (!obj || typeof obj !== 'object') return {};
  const redacted = redactValue(obj);
  return isPlainObject(redacted) ? redacted : { value: redacted };
}
