import { expect, test } from './fixtures.js';
import { setupPublicMocks } from './_mocks/publicApiMocks.js';

test.describe('P10-B user auth UI + next flow', () => {
  test('redirects anonymous rdv entry to /auth/login and returns to next after login', async ({ page }) => {
    await setupPublicMocks(page);

    let authMeCalls = 0;
    await page.route('**/api/auth/me', async (route) => {
      authMeCalls += 1;
      if (authMeCalls === 1) {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Unauthorized' }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          session: { kind: 'user', authType: 'user_cookie', role: 'user' },
          user: { id: 'citizen-1', role: 'user' },
        }),
      });
    });

    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          session: { kind: 'user', authType: 'user_cookie', role: 'user' },
          user: { id: 'citizen-1', role: 'user' },
        }),
      });
    });

    await page.goto('/structures/structure-test');
    await page.getByRole('link', { name: /Prendre rendez-vous|Demander un RDV/i }).first().click();

    await expect(page).toHaveURL(/\/auth\/login\?next=%2Frdv%2Fstructure-test/);

    await page.locator('#auth-email').fill('citizen@test.local');
    await page.locator('#auth-password').fill('password-123');
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeEnabled();
    await Promise.all([
      page.waitForRequest((request) => request.url().includes('/api/auth/login') && request.method() === 'POST'),
      page.getByRole('button', { name: 'Se connecter' }).click(),
    ]);

    await expect(page).toHaveURL(/\/rdv\/structure-test/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Prise de rendez-vous' })).toBeVisible();
  });
});
