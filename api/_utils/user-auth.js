import crypto from 'crypto';
import { signJwt, verifyJwt } from '../_utils/auth.js';
import { env } from './env.js';

export const USER_SESSION_COOKIE_NAME = 'ada_user_session';

const USER_SESSION_ISSUER = 'accesdirectaide';
const USER_SESSION_AUDIENCE = 'accesdirectaide-user';
const USER_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/**
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

/**
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * @param {unknown} value
 * @returns {string}
 */
export function normalizePhone(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return raw.replace(/[^\d+]/g, '').slice(0, 24);
}

/**
 * @param {string} value
 * @returns {string}
 */
export function hashAuthToken(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

/**
 * @returns {string}
 */
export function generateAuthToken() {
  return crypto.randomBytes(32).toString('hex');
}

const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };
const KEY_LEN = 64;

/**
 * @param {string} password
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, KEY_LEN, SCRYPT_PARAMS, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(`scrypt:${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

/**
 * @param {string} password
 * @returns {string}
 */
export function hashPasswordSync(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, KEY_LEN, SCRYPT_PARAMS);
  return `scrypt:${salt}:${derivedKey.toString('hex')}`;
}

/**
 * @param {string} password
 * @param {string} passwordHash
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, passwordHash) {
  if (!password || !passwordHash) return false;
  if (!passwordHash.startsWith('scrypt:')) return false;

  const [, salt, keyHex] = passwordHash.split(':');
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, KEY_LEN, SCRYPT_PARAMS, (err, derivedKey) => {
      if (err) reject(err);
      else {
        const keyBuffer = Buffer.from(keyHex, 'hex');
        if (keyBuffer.length !== derivedKey.length) return resolve(false);
        resolve(crypto.timingSafeEqual(keyBuffer, derivedKey));
      }
    });
  });
}

/**
 * @returns {string | undefined}
 */
function getUserSessionSecret() {
  return env.auth.secret || env.secrets.jwtSecret;
}

/**
 * @param {{ userId: string, email: string }} payload
 * @returns {string}
 */
export function signUserSessionToken(payload) {
  const secret = getUserSessionSecret();
  if (!secret) {
    throw new Error('Missing user auth signing secret (AUTH_SECRET/AUTH_JWT_SECRET/JWT_SECRET)');
  }

  return signJwt(
    {
      scope: 'user',
      role: 'user',
      userId: String(payload.userId || ''),
      email: normalizeEmail(payload.email),
    },
    secret,
    {
      algorithm: 'HS256',
      expiresIn: `${USER_SESSION_MAX_AGE_SECONDS}s`,
      issuer: USER_SESSION_ISSUER,
      audience: USER_SESSION_AUDIENCE,
    },
  );
}

/**
 * @param {string | null | undefined} token
 * @returns {null | { userId: string, email: string, role: 'user', scope: 'user' }}
 */
export function verifyUserSessionToken(token) {
  if (!token) return null;
  const secret = getUserSessionSecret();
  if (!secret) return null;

  try {
    const decoded = verifyJwt(String(token), secret, {
      algorithms: ['HS256'],
      issuer: USER_SESSION_ISSUER,
      audience: USER_SESSION_AUDIENCE,
    });

    if (!decoded || typeof decoded !== 'object') return null;
    const payload = /** @type {Record<string, any>} */ (decoded);
    const scope = String(payload.scope || '');
    const role = String(payload.role || '');
    const userId = String(payload.userId || '').trim();
    const email = normalizeEmail(payload.email);

    if (scope !== 'user' || role !== 'user' || !userId || !email) return null;
    return { userId, email, role: 'user', scope: 'user' };
  } catch {
    return null;
  }
}

/**
 * @param {import('./http-types').ApiRequest} req
 * @returns {Record<string, string>}
 */
export function parseCookies(req) {
  /** @type {Record<string, string>} */
  const output = {};

  if (req && req.cookies && typeof req.cookies === 'object') {
    for (const [key, value] of Object.entries(req.cookies)) {
      if (!key) continue;
      output[key] = String(value || '');
    }
  }

  const rawHeader = req?.headers?.cookie || req?.headers?.Cookie;
  const raw = Array.isArray(rawHeader) ? rawHeader.join(';') : String(rawHeader || '');
  if (!raw) return output;

  for (const part of raw.split(';')) {
    const [namePart, ...valueParts] = part.split('=');
    const name = String(namePart || '').trim();
    if (!name) continue;
    const value = String(valueParts.join('=') || '').trim();
    try {
      output[name] = decodeURIComponent(value);
    } catch {
      output[name] = value;
    }
  }

  return output;
}

/**
 * @param {import('./http-types').ApiRequest} req
 * @returns {string | null}
 */
export function getUserSessionTokenFromRequest(req) {
  const cookies = parseCookies(req);
  const value = String(cookies[USER_SESSION_COOKIE_NAME] || '').trim();
  return value || null;
}

/**
 * @param {string} token
 * @param {{ maxAgeSeconds?: number }=} options
 * @returns {string}
 */
export function buildUserSessionCookie(token, options = {}) {
  const maxAge = Number(options.maxAgeSeconds || USER_SESSION_MAX_AGE_SECONDS);
  const secure = env.runtime.vercelEnv === 'production' || env.runtime.vercelEnv === 'preview';
  const encoded = encodeURIComponent(String(token || ''));

  const parts = [
    `${USER_SESSION_COOKIE_NAME}=${encoded}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${Math.max(0, Math.floor(maxAge))}`,
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

/**
 * @returns {string}
 */
export function buildUserSessionCookieClear() {
  const secure = env.runtime.vercelEnv === 'production' || env.runtime.vercelEnv === 'preview';
  const parts = [
    `${USER_SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    'Max-Age=0',
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

/**
 * @param {unknown} value
 * @param {string=} fallback
 * @returns {string}
 */
export function normalizeNextPath(value, fallback = '/') {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;

  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    decoded = trimmed;
  }

  if (!decoded.startsWith('/')) return fallback;
  if (decoded.startsWith('//')) return fallback;
  return decoded;
}

/**
 * @param {string} path
 * @returns {string}
 */
export function buildAppUrl(path) {
  const base = String(env.runtime.appBaseUrl || 'http://localhost:3000').trim() || 'http://localhost:3000';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = String(path || '/').startsWith('/') ? String(path || '/') : `/${String(path || '')}`;
  return new URL(cleanPath, normalizedBase).toString();
}

/**
 * Allowlist of domains that are safe redirect targets.
 * Everything else is rewritten to '/' to prevent open redirect attacks.
 */
const ALLOWED_REDIRECT_HOSTS = new Set([
  'accesdirectaide.fr',
  'www.accesdirectaide.fr',
]);

/**
 * Validate a redirect URL to prevent open redirect attacks.
 * Only allows:
 *  - Relative paths (starts with '/' but not '//')
 *  - Absolute URLs to allowed hosts
 *
 * @param {string} location
 * @param {string} fallback
 * @returns {string}
 */
export function safeRedirectUrl(location, fallback = '/') {
  if (typeof location !== 'string' || !location.trim()) return fallback;
  const loc = location.trim();

  // Relative path — safe (normalizeNextPath already blocks '//')
  if (loc.startsWith('/') && !loc.startsWith('//')) return loc;

  // Absolute URL — validate host against allowlist
  try {
    const parsed = new URL(loc);
    if (ALLOWED_REDIRECT_HOSTS.has(parsed.hostname)) return loc;
  } catch {
    // Malformed URL — reject
  }

  return fallback;
}

/**
 * @param {import('./http-types').ApiResponse} res
 * @param {string} location
 * @param {number=} statusCode
 */
export function redirect(res, location, statusCode = 302) {
  const code = Number(statusCode || 302);
  const safeLocation = safeRedirectUrl(location);

  if (typeof res.redirect === 'function') {
    return res.redirect(code, safeLocation);
  }
  if (typeof res.writeHead === 'function') {
    res.writeHead(code, { Location: safeLocation });
    return res.end();
  }
  res.status(code);
  res.setHeader('Location', safeLocation);
  return res.end();
}

/**
 * @param {import('./http-types').ApiRequest} req
 * @returns {string}
 */
export function getClientIp(req) {
  const raw = req?.headers?.['x-forwarded-for'] || req?.headers?.['X-Forwarded-For'] || req?.socket?.remoteAddress;
  if (!raw) return 'unknown';
  return String(raw).split(',')[0].trim() || 'unknown';
}

