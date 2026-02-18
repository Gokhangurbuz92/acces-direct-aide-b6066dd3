import { afterEach, describe, expect, it } from 'vitest';

import { resolveAuthContext, signAdminSessionToken, verifyAdminSessionToken } from '../../api/_utils/auth.js';

const originalAuthMode = process.env.AUTH_MODE;
const originalAuthSecret = process.env.AUTH_SECRET;
const originalAdminToken = process.env.ADMIN_TOKEN;
const originalJwtSecret = process.env.JWT_SECRET;

afterEach(() => {
  process.env.AUTH_MODE = originalAuthMode;
  process.env.AUTH_SECRET = originalAuthSecret;
  process.env.ADMIN_TOKEN = originalAdminToken;
  process.env.JWT_SECRET = originalJwtSecret;
});

describe('auth utils foundation (P9-A)', () => {
  it('signs and verifies admin session JWT when AUTH_SECRET is configured', () => {
    process.env.AUTH_MODE = 'jwt';
    process.env.AUTH_SECRET = 'unit-test-auth-secret';

    const token = signAdminSessionToken({ email: 'admin@test.local', role: 'admin' });
    const payload = verifyAdminSessionToken(token);

    expect(typeof token).toBe('string');
    expect(payload).toMatchObject({
      scope: 'admin',
      role: 'admin',
      email: 'admin@test.local',
    });
  });

  it('resolves admin auth context from legacy ADMIN_TOKEN bearer', () => {
    process.env.ADMIN_TOKEN = 'unit-test-admin-token';
    const auth = resolveAuthContext({
      headers: { authorization: 'Bearer unit-test-admin-token' },
    });

    expect(auth).toMatchObject({
      role: 'admin',
      authType: 'admin_token',
    });
  });

  it('rejects malformed or unknown bearer tokens', () => {
    process.env.ADMIN_TOKEN = 'unit-test-admin-token';
    process.env.AUTH_SECRET = 'unit-test-auth-secret';

    const auth = resolveAuthContext({
      headers: { authorization: 'Bearer invalid.token.value' },
    });

    expect(auth).toBeNull();
  });
});
