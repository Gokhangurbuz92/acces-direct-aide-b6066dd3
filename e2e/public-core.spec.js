import { test, expect } from '@playwright/test';

// Augmentation du timeout pour la CI (60 secondes)
test.setTimeout(60000);

import { setupPublicMocks } from './_mocks/publicApiMocks';

test.describe('Public Core Routes', () => {

    test.beforeEach(async ({ page }) => {
        // Mocks API via helper partagé
        await setupPublicMocks(page);
    });

    test('Home page loads', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/AccesDirect|Aide/i);
    });

    test('Aides list and detail navigation', async ({ page }) => {
        await page.goto('/aides');
        await expect(page.getByRole('heading', { name: /Aide Test/i }).first()).toBeVisible();

        await page.getByLabel('Voir l\'aide Aide Test').click();
        await page.waitForURL(/\/aides\/.+/);
        await expect(page.getByRole('heading', { name: /Aide Test/i })).toBeVisible({ timeout: 10000 });
    });

    test('Demarches list and detail navigation', async ({ page }) => {
        await page.goto('/demarches');
        await expect(page.getByRole('heading', { name: /Démarche Test/i }).first()).toBeVisible();

        await page.getByRole('link', { name: /Démarrer|Voir|Consulter/i }).first().click();
        await page.waitForURL(/\/demarches\/.+/);
        await expect(page.getByRole('heading', { name: /Démarche Test/i })).toBeVisible();
    });

    test('Structures list and detail navigation', async ({ page }) => {
        await page.goto('/annuaire');
        await expect(page.getByRole('heading', { name: /Structure Test/i }).first()).toBeVisible();

        await page.getByRole('link', { name: /Plus d.?infos|Voir|Consulter|Détails/i }).first().click();
        await page.waitForURL(/\/(annuaire|structures)\/.+/);
        await expect(page.getByRole('heading', { name: /Structure Test/i })).toBeVisible({ timeout: 10000 });
    });

    test('Actualites list and detail navigation', async ({ page }) => {
        await page.goto('/actualites');
        await expect(page.getByRole('heading', { name: 'Actualité Test' }).first()).toBeVisible();

        await page.getByRole('link', { name: /Lire l'actualité Actualité Test/i }).first().click();
        await page.waitForURL(/\/actualites\/.+/);
        await expect(page.getByRole('heading', { name: /Actualité Test/i })).toBeVisible({ timeout: 10000 });
    });

});