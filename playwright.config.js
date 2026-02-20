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
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: SHOULD_START_WEBSERVER
    ? {
      command: 'npx vite --port 3000 --host 127.0.0.1',
      url: LOCAL_BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 60 * 1000,
    }
    : undefined,
});
