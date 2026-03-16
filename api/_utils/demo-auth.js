/**
 * 🧪 Demo Auth — Development-only authentication bypass
 *
 * Allows testing protected Pro/Admin interfaces in local dev
 * without requiring real JWT tokens or database credentials.
 *
 * Usage:
 *   Add ?demo=pro or ?demo=admin to any protected URL
 *   Example: http://localhost:5173/pro/dashboard?demo=pro
 *
 * Security:
 *   - Only active when NODE_ENV === 'development'
 *   - Returns null in all other environments
 *   - Demo sessions are never persisted
 */

const DEMO_PROFILES = {
  pro: {
    id: 'demo-pro-001',
    email: 'demo-pro@accesdirectaide.fr',
    role: 'pro',
    name: 'Marie Dupont (Démo)',
    structureId: 'demo-structure-001',
    structureName: 'CCAS de Paris (Démo)',
    permissions: ['read', 'write', 'rdv', 'messages'],
    isDemo: true,
  },
  admin: {
    id: 'demo-admin-001',
    email: 'demo-admin@accesdirectaide.fr',
    role: 'super_admin',
    name: 'Admin Démo',
    permissions: ['read', 'write', 'admin', 'super_admin'],
    isDemo: true,
  },
  viewer: {
    id: 'demo-viewer-001',
    email: 'demo-viewer@accesdirectaide.fr',
    role: 'viewer',
    name: 'Auditeur Démo',
    permissions: ['read'],
    isDemo: true,
  },
};

/**
 * Get a demo user profile if in development mode and ?demo param is present.
 *
 * @param {import('../_utils/http-types').ApiRequest} req
 * @returns {object | null} — demo user profile or null
 */
export function getDemoUser(req) {
  // Hard safety check: NEVER in production
  if (process.env.NODE_ENV !== 'development') return null;

  try {
    const url = new URL(req.url, `https://${req.headers?.host || 'localhost'}`);
    const demoType = url.searchParams.get('demo');

    if (!demoType) return null;

    const profile = DEMO_PROFILES[demoType];
    if (!profile) {
      return null;
    }

    return { ...profile };
  } catch {
    return null;
  }
}

/**
 * Check if current request is a demo session.
 *
 * @param {import('../_utils/http-types').ApiRequest} req
 * @returns {boolean}
 */
export function isDemoRequest(req) {
  return getDemoUser(req) !== null;
}
