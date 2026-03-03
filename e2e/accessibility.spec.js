// @ts-check
import { test, expect } from './fixtures.js';
import AxeBuilder from '@axe-core/playwright';

/**
 * Phase 2 — Accessibility (RGAA 4.1.2) automated tests.
 *
 * Uses axe-core via @axe-core/playwright to scan key pages for
 * critical and serious accessibility violations.
 */

const PAGES = [
    { name: 'Accueil', path: '/' },
    { name: 'Aides', path: '/aides' },
    { name: 'Aide détail', path: '/aides/aide-test' },
    { name: 'Démarches', path: '/demarches' },
    { name: 'Annuaire', path: '/annuaire' },
    { name: 'Recherche', path: '/recherche' },
    { name: 'Orientation', path: '/orientation' },
    { name: 'Connexion', path: '/auth/login' },
];

test.describe('Accessibility — axe audit (critical + serious)', () => {
    for (const { name, path } of PAGES) {
        test(`${name} (${path}) — no critical/serious violations`, async ({ page }) => {
            await page.goto(path);
            // Wait for main content to load
            await page.waitForSelector('#main-content', { timeout: 10_000 });

            const results = await new AxeBuilder({ page })
                .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
                .analyze();

            // Filter to critical and serious only
            const serious = results.violations.filter(
                (v) => v.impact === 'critical' || v.impact === 'serious',
            );

            if (serious.length > 0) {
                const summary = serious
                    .map((v) => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} instances)`)
                    .join('\n');
                console.error('Accessibility violations:\n' + summary);
            }

            expect(serious).toHaveLength(0);
        });
    }
});

test.describe('Accessibility — keyboard navigation', () => {
    test('Skip link is present and functional', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Reset focus context: blur any active element so Tab traverses from document start
        await page.evaluate(() => {
            if (document.activeElement && document.activeElement !== document.body) {
                /** @type {HTMLElement} */ (document.activeElement).blur();
            }
        });

        // Tab twice to reach the skip link (first Tab cycles to body in Chromium)
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');

        // Use accessibility-first locator
        const skipLink = page.getByRole('link', { name: 'Aller au contenu principal' });

        // Assert it received focus and became visible
        await expect(skipLink).toBeFocused();
        await expect(skipLink).toBeVisible();

        // Activate skip link
        await page.keyboard.press('Enter');

        // Check FOCUS moved to main content (requires tabindex="-1" on #main-content)
        const mainContent = page.locator('#main-content');
        await expect(mainContent).toBeFocused();
    });

    test('Chat widget — focus trap and Esc close', async ({ page }) => {
        await page.goto('/');

        // Find and click the chat FAB (Boussole Sociale)
        const chatFab = page.locator('button[aria-label*="Boussole"]');
        await chatFab.click();

        // Chat dialog should open with role="dialog"
        const chatDialog = page.locator('[role="dialog"]');
        await expect(chatDialog).toBeVisible();
        await expect(chatDialog).toHaveAttribute('aria-modal', 'true');

        // Input should be focused
        const chatInput = chatDialog.locator('input[aria-label="Message utilisateur"]');
        await expect(chatInput).toBeFocused();

        // Tab should cycle within the dialog (focus trap)
        await page.keyboard.press('Tab');
        // We should still be inside the dialog
        const activeElement = page.locator(':focus');
        const isInsideDialog = await chatDialog.locator(':focus').count();
        expect(isInsideDialog).toBeGreaterThan(0);

        // Esc should close the dialog
        await page.keyboard.press('Escape');
        await expect(chatDialog).not.toBeVisible();

        // Focus should return to the FAB
        await expect(chatFab).toBeFocused();
    });

    test('Wizard — progress bar has accessible role and value', async ({ page }) => {
        await page.goto('/orientation');

        const progressBar = page.locator('[role="progressbar"]');
        // Progress bar may or may not be visible depending on wizard state
        const count = await progressBar.count();
        if (count > 0) {
            await expect(progressBar).toHaveAttribute('aria-label', 'Progression du diagnostic');
            const valueText = await progressBar.getAttribute('aria-valuetext');
            expect(valueText).toMatch(/Étape \d+ sur \d+/);
        }
    });
});
