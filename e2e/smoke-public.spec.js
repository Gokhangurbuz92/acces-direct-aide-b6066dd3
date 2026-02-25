import { test, expect } from './fixtures.js';
import { setupPublicMocks } from './_mocks/publicApiMocks';

// Timeout global augmenté
test.setTimeout(60000);

test.describe('Public Navigation Smoke Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Utilisation des mocks partagés pour garantir la cohérence
    await setupPublicMocks(page);
  });

  test('Aides Flow: List -> Detail -> Refresh -> Back', async ({ page }) => {
    await page.goto('/aides');
    // Le titre attendu vient des données du mock (Aide Test)
    await expect(page.getByRole('heading', { name: 'Aide Test' }).first()).toBeVisible();

    // Correction du sélecteur pour utiliser le label accessible
    await page.getByLabel("Voir l'aide Aide Test").click();

    await expect(page).toHaveURL(/\/aides\/aide-test/);
    // Le titre détail attendu vient des données du mock (Aide Test Detail)
    await expect(page.getByRole('heading', { name: 'Aide Test Detail' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Aide Test Detail' })).toBeVisible();

    await page.getByRole('link', { name: 'Retour aux aides' }).click();
    await expect(page).toHaveURL(/\/aides/);
  });

  test('Demarches Flow: List -> Detail -> Refresh -> Back', async ({ page }) => {
    await page.goto('/demarches');
    await expect(page.getByRole('heading', { name: 'Démarche Test' }).first()).toBeVisible();

    // Sélecteur plus robuste (regex sur le label ou lien générique si nécessaire, ici on suppose un pattern similaire ou le bouton standard)
    // public-core utilise: getByRole('link', { name: /Démarrer|Voir|Consulter/i }).first()
    await page.getByRole('link', { name: /Démarrer|Voir|Consulter/i }).first().click();

    await expect(page).toHaveURL(/\/demarches\/demarche-test/);
    await expect(page.getByRole('heading', { name: 'Démarche Test Detail' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Démarche Test Detail' })).toBeVisible();

    await page.getByRole('link', { name: 'Retour aux démarches' }).click();
    await expect(page).toHaveURL(/\/demarches/);
  });

  test('Structures Flow: List -> Detail -> Refresh -> Back', async ({ page }) => {
    await page.goto('/structures');
    await expect(page.getByRole('heading', { name: 'Structure Test' }).first()).toBeVisible();

    // public-core utilise: getByRole('link', { name: "Plus d'infos" }).first()
    await page.getByRole('link', { name: "Plus d'infos" }).first().click();

    await expect(page).toHaveURL(/\/structures\/structure-test/);
    await expect(page.getByRole('heading', { name: 'Structure Test Detail' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Structure Test Detail' })).toBeVisible();

    await page.getByRole('link', { name: 'Retour à l\'annuaire' }).click();
    await expect(page).toHaveURL(/\/structures/);
  });

});