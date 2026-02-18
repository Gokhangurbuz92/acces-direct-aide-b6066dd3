import { test, expect } from '@playwright/test';
import { setupPublicMocks } from './_mocks/publicApiMocks.js';

test.describe('Public Core Navigation', () => {
    test.beforeEach(async ({ page }) => {
        // Enable console log debugging
        page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
        page.on('pageerror', err => console.log(`BROWSER ERROR: ${err}`));
        page.on('requestfailed', request => console.log(`REQUEST FAILED: ${request.url()} - ${request.failure().errorText}`));

        await setupPublicMocks(page);
    });

    test('Parcours Aides: List -> Detail -> Refresh', async ({ page }) => {
        await page.goto('/aides');
        await expect(page.getByText('Aide Test').first()).toBeVisible();

        // Navigate to detail (simulating click or direct access)
        await page.goto('/aides/aide-test');
        await expect(page.getByText('Description longue')).toBeVisible();

        await page.reload();
        await expect(page.getByText('Description longue')).toBeVisible();
    });

    // TODO: Fix 500 Error in Dev Server for DemarcheDetail
    test.skip('Parcours Demarches: List -> Detail -> Refresh', async ({ page }) => {
        await page.goto('/demarches');
        await expect(page.getByText('Démarche Test').first()).toBeVisible();

        await page.goto('/demarches/demarche-test');
        await expect(page.getByText('Résumé démarche.')).toBeVisible();

        await page.reload();
        await expect(page.getByText('Résumé démarche.')).toBeVisible();
    });

    test('Parcours Annuaire: List -> Detail -> Refresh', async ({ page }) => {
        await page.goto('/annuaire');
        await expect(page.getByText('Structure Test').first()).toBeVisible();

        await page.goto('/structures/structure-test');
        await expect(page.getByText('Testville')).toBeVisible();

        await page.reload();
        await expect(page.getByText('Testville')).toBeVisible();
    });

    // TODO: Fix 500 Error in Dev Server for ActualiteDetail
    test.skip('Parcours Actualites: List -> Detail -> Refresh', async ({ page }) => {
        await page.goto('/actualites');
        await expect(page.getByText('Actualité Test').first()).toBeVisible();

        await page.goto('/actualites/actu-test');
        await expect(page.getByText('Contenu actu')).toBeVisible();

        await page.reload();
        await expect(page.getByText('Contenu actu')).toBeVisible();
    });
});
