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
        // CORRECTION : Utilisation de .first() pour éviter l'erreur de duplication
        await expect(page.getByRole('heading', { name: 'Aide Test' }).first()).toBeVisible();

        await page.getByLabel('Voir l\'aide Aide Test').click();
        await expect(page.getByRole('heading', { name: 'Aide Test Detail' })).toBeVisible();
    });

    test('Demarches list and detail navigation', async ({ page }) => {
        await page.goto('/demarches');
        await expect(page.getByRole('heading', { name: 'Démarche Test' }).first()).toBeVisible();

        await page.getByRole('link', { name: /Démarrer|Voir|Consulter/i }).first().click();
        await expect(page.getByRole('heading', { name: 'Démarche Test Detail' })).toBeVisible();
    });

    test('Structures list and detail navigation', async ({ page }) => {
        await page.goto('/annuaire');
        await expect(page.getByRole('heading', { name: 'Structure Test' }).first()).toBeVisible();

        await page.getByRole('link', { name: "Plus d'infos" }).first().click();
        await expect(page.getByRole('heading', { name: 'Structure Test Detail' })).toBeVisible();
    });

    test('Actualites list and detail navigation', async ({ page }) => {
        await page.goto('/actualites');
        await expect(page.getByRole('heading', { name: 'Actualité Test' }).first()).toBeVisible();

        await page.getByText('Actualité Test').first().click();
        await expect(page.getByRole('heading', { name: 'Actualité Test Detail' })).toBeVisible();
    });

});