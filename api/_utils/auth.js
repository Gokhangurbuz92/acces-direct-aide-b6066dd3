
import crypto from 'crypto';
import { signJwt, verifyJwt, verifyProToken } from '../lib/pro-auth.js';
import { env } from './env.js';

const ADMIN_SESSION_ISSUER = 'accesdirectaide';
const ADMIN_SESSION_AUDIENCE = 'accesdirectaide-admin';

export const AUTH_ROLE = {
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
  STRUCTURE_ADMIN: 'structure_admin',
  PRO: 'pro',
  USER: 'user',
};

/**
 * @param {import('./http-types').ApiRequest} req
 * @returns {string | null}
 */
export function getBearerToken(req) {
  const raw = req?.headers?.authorization || req?.headers?.Authorization;
  if (typeof raw !== 'string') return null;
  const match = raw.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const token = String(match[1] || '').trim();
  return token || null;
}

/**
 * @param {string} left
 * @param {string} right
 * @returns {boolean}
 */
function timingSafeEquals(left, right) {
  const leftBuf = Buffer.from(left);
  const rightBuf = Buffer.from(right);
  if (leftBuf.length !== rightBuf.length) return false;
  return crypto.timingSafeEqual(leftBuf, rightBuf);
}

/**
 * @param {string | null} token
 * @returns {boolean}
 */
function verifyLegacyAdminToken(token) {
  const adminToken = env.secrets.adminToken;
  if (!token || !adminToken) return false;
  return timingSafeEquals(token, adminToken);
}

/**
 * @returns {string | undefined}
 */
function getAdminSessionSecret() {
  return env.auth.secret || env.secrets.jwtSecret;
}

/**
 * @param {{ email?: string, role?: string }} payload
 * @returns {string}
 */
export function signAdminSessionToken(payload = {}) {
  const secret = getAdminSessionSecret();
  if (!secret) {
    throw new Error('Missing admin auth signing secret (AUTH_SECRET/AUTH_JWT_SECRET/JWT_SECRET)');
  }

  const role = payload.role || AUTH_ROLE.ADMIN;
  const email = payload.email || env.secrets.adminEmail || 'admin@accesdirectaide.fr';

  return signJwt(
    {
      scope: 'admin',
      role,
      email,
    },
    secret,
    {
      algorithm: 'HS256',
      expiresIn: '8h',
      issuer: ADMIN_SESSION_ISSUER,
      audience: ADMIN_SESSION_AUDIENCE,
    },
  );
}

/**
 * @param {string | null} token
 * @returns {null | { scope?: string, role?: string, email?: string }}
 */
export function verifyAdminSessionToken(token) {
  if (!token) return null;

  const secret = getAdminSessionSecret();
  if (!secret) return null;

  try {
    const decoded = verifyJwt(token, secret, {
      algorithms: ['HS256'],
      issuer: ADMIN_SESSION_ISSUER,
      audience: ADMIN_SESSION_AUDIENCE,
    });

    if (!decoded || typeof decoded !== 'object') return null;
    if (decoded.scope !== 'admin') return null;
    if (typeof decoded.role !== 'string') return null;

    return {
      scope: decoded.scope,
      role: decoded.role,
      email: typeof decoded.email === 'string' ? decoded.email : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * @param {string | undefined} role
 * @returns {string}
 */
function normalizeRole(role) {
  switch (String(role || '').toUpperCase()) {
    case 'SUPERADMIN':
      return AUTH_ROLE.SUPERADMIN;
    case 'STRUCTURE_ADMIN':
      return AUTH_ROLE.STRUCTURE_ADMIN;
    case 'PRO':
      return AUTH_ROLE.PRO;
    case 'ADMIN':
      return AUTH_ROLE.ADMIN;
    default:
      return AUTH_ROLE.USER;
  }
}

/**
 * @param {import('./http-types').ApiRequest} req
 * @returns {null | { role: string, authType: 'admin_token' | 'admin_jwt' | 'pro_jwt', email?: string, userId?: string, structureId?: string }}
 */
export function resolveAuthContext(req) {
  const token = getBearerToken(req);
  if (!token) return null;

  if (verifyLegacyAdminToken(token)) {
    return {
      role: AUTH_ROLE.ADMIN,
      authType: 'admin_token',
      email: env.secrets.adminEmail || 'admin@accesdirectaide.fr',
    };
  }

  const adminSession = verifyAdminSessionToken(token);
  if (adminSession) {
    return {
      role: normalizeRole(adminSession.role),
      authType: 'admin_jwt',
      email: adminSession.email || env.secrets.adminEmail || 'admin@accesdirectaide.fr',
    };
  }

  const proClaims = verifyProToken(token);
  if (proClaims && typeof proClaims === 'object') {
    return {
      role: normalizeRole(/** @type {any} */ (proClaims).role),
      authType: 'pro_jwt',
      email: /** @type {any} */ (proClaims).email,
      userId: String(/** @type {any} */ (proClaims).userId || ''),
      structureId: String(/** @type {any} */ (proClaims).structureId || ''),
    };
  }

  return null;
}

/**
 * Backward-compatible admin verifier used by existing handlers.
 *
 * @param {import('./http-types').ApiRequest} req
 * @returns {boolean}
 */
export function verifyAdmin(req) {
  const auth = resolveAuthContext(req);
  return Boolean(auth && (auth.role === AUTH_ROLE.ADMIN || auth.role === AUTH_ROLE.SUPERADMIN));
}

/**
 * @param {import('./http-types').ApiRequest} req
 * @returns {Promise<null | { email?: string, role: string, authType: string, userId?: string, structureId?: string }>}
 */
export async function getAuthenticatedUser(req) {
  const auth = resolveAuthContext(req);
  if (!auth) return null;
  return auth;
}

/**
 * @param {(req: import('./http-types').ApiRequest, res: import('./http-types').ApiResponse) => any} handler
 */
export function requireAuth(handler) {
  /** @param {import('./http-types').ApiRequest} req @param {import('./http-types').ApiResponse} res */
  return async function wrapped(req, res) {
    const auth = resolveAuthContext(req);
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    req.auth = auth;
    if (auth.authType === 'pro_jwt') {
      req.user = {
        userId: auth.userId,
        role: auth.role,
        structureId: auth.structureId,
        email: auth.email,
      };
    }
    return handler(req, res);
  };
}

/**
 * @param {(req: import('./http-types').ApiRequest, res: import('./http-types').ApiResponse) => any} handler
 * @param {string[]} roles
 * @param {{ allowAdminBypass?: boolean }=} options
 */
export function requireRole(handler, roles, options = {}) {
  const expected = Array.isArray(roles) ? roles : [];
  const allowAdminBypass = options.allowAdminBypass !== false;

  /** @param {import('./http-types').ApiRequest} req @param {import('./http-types').ApiResponse} res */
  return requireAuth(async function roleWrapped(req, res) {
    const auth = req.auth || resolveAuthContext(req);
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });

    const role = normalizeRole(auth.role);
    const isAdmin = role === AUTH_ROLE.ADMIN || role === AUTH_ROLE.SUPERADMIN;
    const allowed = expected.length === 0 || expected.includes(role) || (allowAdminBypass && isAdmin);

    if (!allowed) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return handler(req, res);
  });
}
