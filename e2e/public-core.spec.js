import { test, expect } from '@playwright/test';

test.describe('Public Core Routes', () => {

  // Mock Data
  const mockAides = {
    items: [{ id: 1, slug: 'aide-test', titre: 'Aide Test', resume: 'Resume Aide' }],
    pagination: { total: 1, page: 1, limit: 10 }
  };
  const mockAideDetail = { id: 1, slug: 'aide-test', titre: 'Aide Test Detail', resume: 'Detail Resume' };

  const mockDemarches = {
    items: [{ id: 1, slug: 'demarche-test', titre: 'Demarche Test', resume: 'Resume Demarche' }],
    pagination: { total: 1 }
  };
  const mockDemarcheDetail = { id: 1, slug: 'demarche-test', titre: 'Demarche Test Detail', resume: 'Detail Resume' };

  const mockStructures = {
    items: [{ id: 1, slug: 'structure-test', nom: 'Structure Test', ville: 'Paris' }],
    pagination: { total: 1 }
  };
  const mockStructureDetail = { id: 1, slug: 'structure-test', nom: 'Structure Test Detail', ville: 'Paris' };

  const mockActualites = {
    items: [{ id: 1, slug: 'actu-test', titre: 'Actu Test', chapeau: 'Intro Actu', type_actu: 'info', date_publication: '2023-01-01' }],
    pagination: { total: 1 }
  };
  const mockActualiteDetail = { id: 1, slug: 'actu-test', titre: 'Actu Test Detail', content: 'Contenu Actu', type_actu: 'info', date_publication: '2023-01-01' };

  test.beforeEach(async ({ page }) => {
    // General Mocking
    await page.route('**/api/taxonomy', async route => route.fulfill({ json: { categories: [], situations: [] } }));

    // Aides
    await page.route('**/api/aides?*', async route => route.fulfill({ json: mockAides }));
    await page.route('**/api/aides/aide-test*', async route => route.fulfill({ json: mockAideDetail }));

    // Demarches
    await page.route('**/api/demarches?*', async route => route.fulfill({ json: mockDemarches }));
    await page.route('**/api/demarches/demarche-test*', async route => route.fulfill({ json: mockDemarcheDetail }));

    // Structures
    await page.route('**/api/structures?*', async route => route.fulfill({ json: mockStructures }));
    await page.route('**/api/structures/structure-test*', async route => route.fulfill({ json: mockStructureDetail }));

    // Actualites
    await page.route('**/api/actualites?*', async route => route.fulfill({ json: mockActualites }));
    await page.route('**/api/actualites/actu-test*', async route => route.fulfill({ json: mockActualiteDetail }));
  });

  test('Aides Flow: List -> Detail -> Refresh', async ({ page }) => {
    await page.goto('/aides');
    // Ensure content is loaded
    await expect(page.getByRole('heading', { name: 'Aide Test' }).first()).toBeVisible();

    // Click the card link (overlay)
    await page.getByLabel("Voir l'aide Aide Test").click();

    // Verify Detail
    await expect(page).toHaveURL(/\/aides\/aide-test/);
    await expect(page.getByRole('heading', { name: 'Aide Test' })).toBeVisible();

    // Refresh
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Aide Test' })).toBeVisible();
  });

  test('Demarches Flow: List -> Detail -> Refresh', async ({ page }) => {
    await page.goto('/demarches');
    await expect(page.getByRole('heading', { name: 'Demarche Test' }).first()).toBeVisible();

    await page.getByLabel("Voir la démarche Demarche Test").click();

    await expect(page).toHaveURL(/\/demarches\/demarche-test/);
    await expect(page.getByRole('heading', { name: 'Demarche Test' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Demarche Test' })).toBeVisible();
  });

  test('Structures Flow: List -> Detail -> Refresh', async ({ page }) => {
    await page.goto('/annuaire'); // Note: /annuaire maps to Structures list
    await expect(page.getByRole('heading', { name: 'Structure Test' }).first()).toBeVisible();

    await page.getByLabel("Voir la fiche de Structure Test").click();

    await expect(page).toHaveURL(/\/structures\/structure-test/);
    await expect(page.getByRole('heading', { name: 'Structure Test' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Structure Test' })).toBeVisible();
  });

  test('Actualites Flow: List -> Detail -> Refresh', async ({ page }) => {
    await page.goto('/actualites');
    await expect(page.getByRole('heading', { name: 'Actu Test' }).first()).toBeVisible();

    await page.getByLabel("Lire l'actualité Actu Test").click();

    await expect(page).toHaveURL(/\/actualites\/actu-test/);
    await expect(page.getByRole('heading', { name: 'Actu Test' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Actu Test' })).toBeVisible();
  });

});
