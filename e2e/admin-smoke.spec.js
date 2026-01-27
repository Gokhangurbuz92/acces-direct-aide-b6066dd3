import { test, expect } from '@playwright/test';

import { setupAdminMocks } from './_mocks/adminApiMocks';

test.describe('Admin Smoke Test', () => {
    test.beforeEach(async ({ page }) => {
        await setupAdminMocks(page);
    });

    test('Full Content Lifecycle: Create -> Publish -> Verify', async ({ page }) => {
        // 1. Login
        // We rely on CI environment variables for credentials
        const email = process.env.ADMIN_EMAIL || 'admin@accesdirectaide.fr';
        const password = process.env.ADMIN_PASSWORD || 'admin';

        await page.goto('/admin/login');
        await page.getByLabel('Email').fill(email);
        await page.getByLabel('Mot de passe').fill(password);
        await page.getByRole('button', { name: 'Se connecter' }).click();

        // Wait for auth to complete and redirect
        await expect(page).toHaveURL(/\/admin/);

        // 2. Create Aide (Draft)
        await page.goto('/adminaides');
        await expect(page.getByRole('heading', { name: 'Gestion des Aides' })).toBeVisible();
        await page.getByRole('button', { name: 'Créer' }).click();

        const timestamp = Date.now();
        const title = `Test Aide ${timestamp}`;

        await page.getByLabel('Titre').fill(title);

        // Handle Select (Radix UI)
        await page.getByRole('combobox').first().click();
        await page.getByRole('option').nth(0).click();

        await page.getByLabel('Résumé court').fill('Short summary for test');

        // Save
        await page.getByRole('button', { name: 'Enregistrer' }).click();

        // Verify redirection to list and presence of item
        await expect(page).toHaveURL(/\/adminaides/);

        // Reload to ensure list is fresh
        await page.reload();

        const card = page.locator('.rounded-xl', { hasText: title }).first();
        await expect(card).toBeVisible();
        await expect(card).toContainText('Brouillon');

        // 3. Publish
        await card.getByRole('button', { name: 'Publier' }).click();

        // Verify Status changes to Publié
        await expect(card).toContainText('Publié');

        // 4. Verify Public Access
        await page.goto('/aides');
        await expect(page.getByText(title)).toBeVisible();
    });
});
