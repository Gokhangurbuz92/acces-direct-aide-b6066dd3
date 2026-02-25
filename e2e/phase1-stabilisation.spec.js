// @ts-check
import { test, expect } from './fixtures.js';

/**
 * Phase 1 — Stabilisation smoke tests.
 *
 * These tests verify the 5 critical fixes required for Phase 1:
 * 1. /auth/login renders (not blank)
 * 2. /demarches renders (results or informative empty state)
 * 3. /assistant does not 404 (redirects to /orientation)
 * 4. /api/assistant/chat returns stable JSON (200 or 503)
 */

test.describe('Phase 1 — Stabilisation', () => {
    test('FIX1: /auth/login renders login form (not blank)', async ({ page }) => {
        await page.goto('/auth/login');
        // Must have a visible heading
        const heading = page.locator('h1, [class*="CardTitle"]').first();
        await expect(heading).toBeVisible({ timeout: 10_000 });
        await expect(heading).toContainText(/connexion/i);
        // Must have an email input
        const emailInput = page.locator('input[type="email"]');
        await expect(emailInput).toBeVisible();
    });

    test('FIX2: /demarches renders results or informative empty state', async ({ page }) => {
        await page.goto('/demarches');
        // Wait for either results list or empty state (not a blank page)
        const resultsList = page.locator('[data-testid="demarches-results-list"]');
        const emptyState = page.locator('[data-testid="demarches-empty-state"]');
        const errorState = page.locator('[data-testid="demarches-error-state"]');

        // One of these three must appear within 15s
        await expect(
            resultsList.or(emptyState).or(errorState).first(),
        ).toBeVisible({ timeout: 15_000 });

        // Page must have an h1
        const heading = page.locator('h1');
        await expect(heading).toBeVisible();
        await expect(heading).toContainText(/démarches/i);
    });

    test('FIX4: /assistant redirects to /orientation (no 404)', async ({ page }) => {
        await page.goto('/assistant');
        // Should redirect to /orientation
        await page.waitForURL('**/orientation', { timeout: 10_000 });
        // Must have a visible heading
        const heading = page.locator('h1');
        await expect(heading).toBeVisible();
        await expect(heading).toContainText(/assistant/i);
    });

    test('FIX3: /api/assistant/chat returns stable JSON (200 or 503)', async ({ request }) => {
        const response = await request.post('/api/assistant/chat', {
            data: { message: 'Bonjour, quelles aides existent ?' },
            headers: { 'Content-Type': 'application/json' },
        });

        // Must be 200 or 503 — never 500 or other unexpected status
        expect([200, 503]).toContain(response.status());

        const body = await response.json();

        if (response.status() === 200) {
            // Success: must have answer
            expect(body).toHaveProperty('answer');
            expect(body).toHaveProperty('meta');
        } else {
            // 503: must have stable error shape
            expect(body).toHaveProperty('ok', false);
            expect(body).toHaveProperty('error', 'service_unavailable');
            expect(body).toHaveProperty('message');
        }
    });
});
