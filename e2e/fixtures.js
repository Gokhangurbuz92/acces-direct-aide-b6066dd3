/**
 * Global Playwright fixtures with auto-mock support.
 *
 * When USE_MOCKS=true (set in CI), every test automatically gets
 * API mocks injected via setupPublicMocks. Tests that register their
 * own page.route() calls will override the global mock for that route
 * (Playwright uses the last-registered handler).
 *
 * Usage: replace `import { test, expect } from '@playwright/test'`
 * with   `import { test, expect } from './fixtures'`
 */
import { test as base, expect, request } from '@playwright/test';
import { setupPublicMocks } from './_mocks/publicApiMocks.js';

const test = base.extend({
    page: async ({ page }, use) => {
        // Dismiss the OnboardingTour welcome dialog and cookie banner
        // so they don't block clicks or add unexpected role="dialog" elements
        await page.addInitScript(() => {
            window.localStorage.setItem('ada_onboarding_done', 'true');
            window.localStorage.setItem('ada_cookie_consent', JSON.stringify({ accepted: true, date: new Date().toISOString() }));
        });
        if (process.env.USE_MOCKS === 'true') {
            await setupPublicMocks(page);
        }
        await use(page);
    },
});

export { test, expect, request };
