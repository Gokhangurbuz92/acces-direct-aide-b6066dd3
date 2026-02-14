import { afterEach, describe, expect, it } from 'vitest';
import { env, envAliases, getEnv, requireEnv } from '../../api/_utils/env.js';

function snapshotEnv(keys) {
  /** @type {Record<string, string | undefined>} */
  const out = {};
  for (const key of keys) out[key] = process.env[key];
  return out;
}

function restoreEnv(snapshot) {
  for (const [key, value] of Object.entries(snapshot)) {
    if (value == null) delete process.env[key];
    else process.env[key] = value;
  }
}

const MUTATED_KEYS = [
  'TEST_TRIM',
  'REQ_A',
  'REQ_B',
  'KV_REST_API_URL',
  'KV_REST_API_TOKEN',
  'UPSTASH_KV_KV_REST_API_URL',
  'UPSTASH_KV_KV_REST_API_TOKEN',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'GEMINI_API_KEY',
  'GOOGLE_API_KEY',
];

const ORIGINAL = snapshotEnv(MUTATED_KEYS);

afterEach(() => {
  restoreEnv(ORIGINAL);
});

describe('api/_utils/env.js', () => {
  it('getEnv returns trimmed values and supports defaults', () => {
    process.env.TEST_TRIM = '  hello  ';
    expect(getEnv('TEST_TRIM')).toBe('hello');
    delete process.env.TEST_TRIM;
    expect(getEnv('TEST_TRIM', { default: 'fallback' })).toBe('fallback');
  });

  it('requireEnv throws with variable names only when missing', () => {
    delete process.env.REQ_A;
    delete process.env.REQ_B;

    expect(() => requireEnv(['REQ_A', 'REQ_B'])).toThrowError(
      '[env] Missing required environment variables: REQ_A, REQ_B',
    );
  });

  it('envAliases returns canonical value when set', () => {
    process.env.KV_REST_API_URL = 'https://canonical.example';
    process.env.UPSTASH_KV_KV_REST_API_URL = 'https://alias.example';
    expect(envAliases('KV_REST_API_URL', ['UPSTASH_KV_KV_REST_API_URL'])).toBe('https://canonical.example');
  });

  it('env.kv falls back to supported aliases', () => {
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    process.env.UPSTASH_KV_KV_REST_API_URL = 'https://alias.example';
    process.env.UPSTASH_KV_KV_REST_API_TOKEN = 'token-alias';

    expect(env.kv.url).toBe('https://alias.example');
    expect(env.kv.token).toBe('token-alias');
  });

  it('env.ai.geminiKey supports GOOGLE_API_KEY alias', () => {
    delete process.env.GEMINI_API_KEY;
    process.env.GOOGLE_API_KEY = 'google-key';
    expect(env.ai.geminiKey).toBe('google-key');
  });
});
