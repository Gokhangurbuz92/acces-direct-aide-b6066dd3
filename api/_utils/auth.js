import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from './env.js';
import logger from './logger.js';
import { db } from '../../src/db/index.js';
import { AuditLog } from '../../src/db/schema.js';
import { checkRateLimit as checkRateLimitUtil } from './rateLimit.js';

const ADMIN_SESSION_ISSUER = 'accesdirectaide';
const ADMIN_SESSION_AUDIENCE = 'accesdirectaide-admin';
const PRO_SESSION_ISSUER = 'accesdirectaide';
const PRO_SESSION_AUDIENCE = 'accesdirectaide-pro';

export const AUTH_ROLE = {
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
  STRUCTURE_ADMIN: 'structure_admin',
  PRO: 'pro',
  USER: 'user',
};

export const ROLE = {
    SUPERADMIN: 'SUPERADMIN',
    STRUCTURE_ADMIN: 'STRUCTURE_ADMIN',
    PRO: 'PRO'
};

const NO_STORE_VALUE = 'private, no-store, max-age=0, must-revalidate';

function getJwtSecret() {
    return env.secrets.jwtSecret;
}

export function signJwt(payload, secret, options = {}) {
    return jwt.sign(payload, secret, options);
}

export function verifyJwt(token, secret, options = {}) {
    return jwt.verify(token, secret, options);
}

export function signProToken(user) {
    const JWT_SECRET = getJwtSecret();
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is missing");
    }

    return jwt.sign(
        {
            userId: user.id,
            email: user.email,
            structureId: user.structureId,
            role: user.role,
            scope: 'pro'
        },
        JWT_SECRET,
        {
            expiresIn: '8h',
            issuer: PRO_SESSION_ISSUER,
            audience: PRO_SESSION_AUDIENCE,
            algorithm: 'HS256',
        }
    );
}

export function verifyProToken(token) {
    const JWT_SECRET = getJwtSecret();
    if (!JWT_SECRET) return null;

    try {
        const strictDecoded = jwt.verify(token, JWT_SECRET, {
            algorithms: ['HS256'],
            issuer: PRO_SESSION_ISSUER,
            audience: PRO_SESSION_AUDIENCE,
        });
        return validateProClaims(strictDecoded);
    } catch {
        try {
            const legacyDecoded = jwt.verify(token, JWT_SECRET, {
                algorithms: ['HS256'],
            });
            return validateProClaims(legacyDecoded);
        } catch {
            return null;
        }
    }
}

function validateProClaims(decoded) {
    if (!decoded || typeof decoded !== 'object') return null;

    const payload = /** @type {Record<string, any>} */ (decoded);
    const scope = typeof payload.scope === 'string' ? payload.scope : '';
    const userId = String(payload.userId || '').trim();
    const structureId = String(payload.structureId || '').trim();
    const roleRaw = String(payload.role || '').toUpperCase();

    if (scope && scope !== 'pro') return null;
    if (!userId || !structureId) return null;
    if (![ROLE.PRO, ROLE.STRUCTURE_ADMIN, ROLE.SUPERADMIN].includes(roleRaw)) return null;

    return {
        userId,
        structureId,
        email: typeof payload.email === 'string' ? payload.email : undefined,
        role: roleRaw,
        scope: scope || undefined,
    };
}

export async function checkRateLimit(identifier) {
    const result = await checkRateLimitUtil('LOGIN_PRO', identifier);
    if (!result.allowed) {
        return { allowed: false, remaining: 0 };
    }
    return { allowed: true, remaining: 1 };
}

function hashIp(ip) {
    if (!ip) return 'unknown';
    return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
}

export async function logProAudit(action, actorId, structureId, details, ip) {
    try {
        await db.insert(AuditLog).values({
            action,
            actor_id: actorId, 
            actor: actorId, 
            entity: 'ProUser', 
            details: { ...details, structureId },
            ip,
            ip_hash: hashIp(ip)
        });
    } catch (e) {
        logger.error("Audit Log Error", e);
    }
}

export function getBearerToken(req) {
  const raw = req?.headers?.authorization || req?.headers?.Authorization;
  if (typeof raw !== 'string') return null;
  const match = raw.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const token = String(match[1] || '').trim();
  return token || null;
}

function timingSafeEquals(left, right) {
  const leftBuf = Buffer.from(left);
  const rightBuf = Buffer.from(right);
  if (leftBuf.length !== rightBuf.length) return false;
  return crypto.timingSafeEqual(leftBuf, rightBuf);
}

function verifyLegacyAdminToken(token) {
  const adminToken = env.secrets.adminToken;
  if (!token || !adminToken) return false;
  return timingSafeEquals(token, adminToken);
}

function getAdminSessionSecret() {
  return env.auth.secret || env.secrets.jwtSecret;
}

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

export function isAdminRole(role) {
  const normalized = normalizeRole(role);
  return normalized === AUTH_ROLE.ADMIN || normalized === AUTH_ROLE.SUPERADMIN;
}

export function isProRole(role) {
  const normalized = normalizeRole(role);
  return (
    normalized === AUTH_ROLE.PRO ||
    normalized === AUTH_ROLE.STRUCTURE_ADMIN ||
    normalized === AUTH_ROLE.SUPERADMIN
  );
}

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

export function verifyAdmin(req) {
  const auth = resolveAuthContext(req);
  return Boolean(auth && isAdminRole(auth.role));
}

export async function getAuthenticatedUser(req) {
  const auth = resolveAuthContext(req);
  if (!auth) return null;
  return auth;
}

export function requireAuth(handler, allowedRolesLegacy = []) {
  return async function wrapped(req, res) {
    const auth = resolveAuthContext(req);
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Support legacy allowedRoles array from pro-auth
    if (allowedRolesLegacy && allowedRolesLegacy.length > 0) {
        if (!allowedRolesLegacy.includes(auth.role) && auth.role !== AUTH_ROLE.SUPERADMIN) {
           return res.status(403).json({ error: 'Forbidden' });
        }
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

export function requireRole(handler, roles, options = {}) {
  const expected = Array.isArray(roles) ? roles : [];
  const allowAdminBypass = options.allowAdminBypass !== false;

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

export function requireAdminAuth(handler) {
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

export function requireAdminMfa(handler) {
  return requireAdminAuth(async function mfaWrapped(req, res) {
    if (!req.auth?.mfa_verified) {
      return res.status(403).json({ error: 'MFA required', mfa_required: true });
    }
    return handler(req, res);
  });
}

export function requireProAuth(handler) {
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

export function requireProRole(handler, roles) {
  const expected = Array.isArray(roles) ? roles : [];

  return requireProAuth(async function wrapped(req, res) {
    if (expected.length > 0 && !expected.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return handler(req, res);
  });
}

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
