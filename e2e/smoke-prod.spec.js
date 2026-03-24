import { test, expect } from '@playwright/test';

/**
 * Production Smoke Tests — vérifications rapides que les pages principales chargent.
 *
 * Usage :
 *   npm run dev          # Dans un premier terminal
 *   npx playwright test e2e/smoke-prod.spec.js  # Dans un second
 */
test.describe('Production Smoke Tests', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Accès Direct|Aide/i);
  });

  test('aides page loads', async ({ page }) => {
    await page.goto('/aides');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toContainText(/aide/i);
  });

  test('structures page loads', async ({ page }) => {
    await page.goto('/annuaire');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toContainText(/annuaire|structure/i);
  });

  test('confidentialite page loads', async ({ page }) => {
    await page.goto('/confidentialite');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toContainText(/donn|cookie|confidential/i);
  });

  test('admin login page loads', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');
    await expect(
      page.locator('input[type="email"], input[type="text"], input[name="email"]')
    ).toBeVisible({ timeout: 10000 });
  });

  test('API health endpoint responds', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.ok).toBe(true);
  });
});
