import { defineConfig, devices } from '@playwright/test';

const REMOTE_BASE_URL = process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL; // PROD or Preview
const LOCAL_BASE_URL = 'http://127.0.0.1:3000';

// If a remote URL is provided, use it. Otherwise, assume local.
const BASE_URL = REMOTE_BASE_URL || LOCAL_BASE_URL;

// Start Vite only if:
// - CI (we want reliable local), OR
// - No remote URL is provided (so we target local)
const SHOULD_START_WEBSERVER = !!process.env.CI || !REMOTE_BASE_URL;

export default defineConfig({
  testDir: process.env.TEST_A11Y ? './tests/a11y' : './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: 'html',

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },

  projects: [
    // Fast mode: mocked API, no DB dependency (USE_MOCKS=true)
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Integration mode: real Neon branch DB via Vercel preview URL
    // Usage: PLAYWRIGHT_BASE_URL=https://my-pr-preview.vercel.app npx playwright test --project=integration
    // The DATABASE_URL is automatically injected by Vercel and points to a Neon branch.
    // Mocks are NOT loaded (USE_MOCKS is not set), so tests hit the real API.
    {
      name: 'integration',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /smoke-|vital-|aides-flow|booking/,
    },
  ],

  webServer: SHOULD_START_WEBSERVER
    ? {
      command: 'npx vite --port 3000 --host 127.0.0.1',
      url: LOCAL_BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      env: {
        VITE_USE_MOCKS: 'true',
        USE_MOCKS: 'true',
      },
    }
    : undefined,
});

