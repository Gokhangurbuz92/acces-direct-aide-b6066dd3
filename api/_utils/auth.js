
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

const NO_STORE_VALUE = 'private, no-store, max-age=0, must-revalidate';

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
  const mfa_verified = payload.mfa_verified === true;

  return signJwt(
    {
      scope: 'admin',
      role,
      email,
      mfa_verified,
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
      mfa_verified: decoded.mfa_verified === true,
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
 * @param {string | undefined} role
 * @returns {boolean}
 */
export function isAdminRole(role) {
  const normalized = normalizeRole(role);
  return normalized === AUTH_ROLE.ADMIN || normalized === AUTH_ROLE.SUPERADMIN;
}

/**
 * @param {string | undefined} role
 * @returns {boolean}
 */
export function isProRole(role) {
  const normalized = normalizeRole(role);
  return (
    normalized === AUTH_ROLE.PRO ||
    normalized === AUTH_ROLE.STRUCTURE_ADMIN ||
    normalized === AUTH_ROLE.SUPERADMIN
  );
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
      mfa_verified: adminSession.mfa_verified === true,
    };
  }

  const proClaims = verifyProToken(token);
  if (proClaims && typeof proClaims === 'object') {
    return {
      role: normalizeRole(/** @type {any} */(proClaims).role),
      authType: 'pro_jwt',
      email: /** @type {any} */ (proClaims).email,
      userId: String(/** @type {any} */(proClaims).userId || ''),
      structureId: String(/** @type {any} */(proClaims).structureId || ''),
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
  return Boolean(auth && isAdminRole(auth.role));
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
    const isAdmin = isAdminRole(role);
    const allowed = expected.length === 0 || expected.includes(role) || (allowAdminBypass && isAdmin);

    if (!allowed) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return handler(req, res);
  });
}

/**
 * Strict admin-only auth guard.
 * Accepts only admin token or admin session JWT.
 *
 * @param {(req: import('./http-types').ApiRequest, res: import('./http-types').ApiResponse) => any} handler
 */
export function requireAdminAuth(handler) {
  /** @param {import('./http-types').ApiRequest} req @param {import('./http-types').ApiResponse} res */
  return async function wrapped(req, res) {
    res.setHeader('Cache-Control', NO_STORE_VALUE);

    const auth = resolveAuthContext(req);
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const isAdminAuthType = auth.authType === 'admin_token' || auth.authType === 'admin_jwt';
    if (!isAdminAuthType || !isAdminRole(auth.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    req.auth = {
      ...auth,
      role: normalizeRole(auth.role),
      mfa_verified: auth.mfa_verified === true,
    };
    return handler(req, res);
  };
}

/**
 * Strict admin auth guard that ALSO requires MFA verification.
 * Returns 403 with { error: 'MFA required' } if mfa_verified claim missing.
 *
 * @param {(req: import('./http-types').ApiRequest, res: import('./http-types').ApiResponse) => any} handler
 */
export function requireAdminMfa(handler) {
  return requireAdminAuth(async function mfaWrapped(req, res) {
    if (!req.auth?.mfa_verified) {
      return res.status(403).json({ error: 'MFA required', mfa_required: true });
    }
    return handler(req, res);
  });
}

/**
 * Strict pro-only auth guard.
 * Accepts only pro JWT. Rejects static admin token and admin session JWT.
 *
 * @param {(req: import('./http-types').ApiRequest, res: import('./http-types').ApiResponse) => any} handler
 */
export function requireProAuth(handler) {
  /** @param {import('./http-types').ApiRequest} req @param {import('./http-types').ApiResponse} res */
  return async function wrapped(req, res) {
    res.setHeader('Cache-Control', NO_STORE_VALUE);

    const auth = resolveAuthContext(req);
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (auth.authType !== 'pro_jwt') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const role = normalizeRole(auth.role);
    if (!isProRole(role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const userId = String(auth.userId || '').trim();
    const structureId = String(auth.structureId || '').trim();
    if (!userId || !structureId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    req.auth = {
      ...auth,
      role,
    };
    req.user = {
      userId,
      role,
      structureId,
      email: auth.email || null,
    };

    return handler(req, res);
  };
}

/**
 * Pro role guard (pro JWT only).
 *
 * @param {(req: import('./http-types').ApiRequest, res: import('./http-types').ApiResponse) => any} handler
 * @param {string[]} roles
 */
export function requireProRole(handler, roles) {
  const expected = Array.isArray(roles) ? roles : [];

  /** @param {import('./http-types').ApiRequest} req @param {import('./http-types').ApiResponse} res */
  return requireProAuth(async function wrapped(req, res) {
    if (expected.length > 0 && !expected.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return handler(req, res);
  });
}

/**
 * Enforces structure context for pro routes and optionally compares a target structure id.
 *
 * @param {import('./http-types').ApiRequest} req
 * @param {import('./http-types').ApiResponse} res
 * @param {string | undefined | null} targetStructureId
 * @returns {{ structureId: string, userId: string, role: string } | null}
 */
export function requireProStructureContext(req, res, targetStructureId = null) {
  const structureId = String(req?.user?.structureId || '').trim();
  const userId = String(req?.user?.userId || '').trim();
  const role = normalizeRole(req?.user?.role);

  if (!structureId || !userId) {
    res.status(403).json({ error: 'Forbidden' });
    return null;
  }

  const target = String(targetStructureId || '').trim();
  if (target && target !== structureId) {
    res.status(403).json({ error: 'Forbidden' });
    return null;
  }

  return { structureId, userId, role };
}
