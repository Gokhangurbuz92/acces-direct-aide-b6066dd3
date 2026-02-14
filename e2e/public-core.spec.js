import { test, expect } from '@playwright/test';

test.describe('Public Core Navigation', () => {

  test.beforeEach(async ({ page }) => {
    // Mock Taxonomy
    await page.route('**/api/taxonomy', async route => {
      await route.fulfill({
        json: {
          categories: [{ slug: 'sante', label: 'Santé' }],
          situations: []
        }
      });
    });
  });

  test('Aides Flow: Search -> Detail -> Refresh', async ({ page }) => {
    // The /aides page is now powered by /api/search (not /api/aides list).
    // Mock search results.
    await page.route('**/api/search', async route => {
      await route.fulfill({
        json: {
          items: [{
            id: 'aide-1',
            slug: 'aide-test-slug',
            title: 'Aide Test Title',
            description: 'Summary of aide test',
            category: 'LOGEMENT'
          }],
          total: 1
        }
      });
    });

    // Mock Detail (AideDetail uses /api/aides?slug=...)
    await page.route('**/api/aides?slug=aide-test-slug', async route => {
      await route.fulfill({
        json: {
          id: 'aide-1',
          slug: 'aide-test-slug',
          titre: 'Aide Test Title',
          description: 'Full description',
          categorie: 'logement',
          cest_quoi: 'Full description'
        }
      });
    });

    // Sidebar query from AideDetail
    await page.route('**/api/structures*', async route => {
      await route.fulfill({ json: { items: [] } });
    });

    // Go to search page with a query so results load.
    await page.goto('/aides?q=loyer');
    await expect(page.getByRole('link', { name: /Aide Test Title/i }).first()).toBeVisible();

    // Click result (assuming card has a link)
    // We target the link that contains the slug
    await page.getByRole('link', { name: /Aide Test Title/i }).first().click();

    // Check URL
    await expect(page).toHaveURL(/\/aides\/aide-test-slug/);
    await expect(page.getByRole('heading', { level: 1, name: /Aide Test Title/i })).toBeVisible();

    // Refresh
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: /Aide Test Title/i })).toBeVisible();
  });

  test('Demarches Flow: List -> Detail -> Refresh', async ({ page }) => {
    // Mock List
    await page.route('**/api/demarches*', async route => {
      await route.fulfill({
        json: {
          items: [{
            id: 'dem-1',
            slug: 'demarche-test',
            titre: 'Demarche Test',
            summary_falc: 'Summary',
            categorie: 'sante'
          }],
          pagination: { page: 1, totalPages: 1 }
        }
      });
    });

    // Mock Detail
    await page.route('**/api/demarches/demarche-test', async route => {
      await route.fulfill({
        json: {
          id: 'dem-1',
          slug: 'demarche-test',
          titre: 'Demarche Test',
          description: 'Full description'
        }
      });
    });

    await page.goto('/demarches');
    await expect(page.getByText('Demarche Test').first()).toBeVisible();

    await page.getByRole('link', { name: /Demarche Test/i }).first().click();
    await expect(page).toHaveURL(/\/demarches\/demarche-test/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Demarche Test');

    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Demarche Test');
  });

  test('Structures (Annuaire) Flow: List -> Detail -> Refresh', async ({ page }) => {
    // Mock List
    await page.route('**/api/structures*', async route => {
      await route.fulfill({
        json: {
          items: [{
            id: 'struct-1',
            slug: 'structure-test',
            nom: 'Structure Test',
            ville: 'Strasbourg'
          }],
          pagination: { page: 1, totalPages: 1 }
        }
      });
    });

    // Mock Detail
    await page.route('**/api/structures/structure-test', async route => {
      await route.fulfill({
        json: {
          id: 'struct-1',
          slug: 'structure-test',
          nom: 'Structure Test',
          ville: 'Strasbourg',
          adresse: '10 rue des tests'
        }
      });
    });

    await page.goto('/annuaire');
    await expect(page.getByText('Structure Test').first()).toBeVisible();

    await page.getByRole('link', { name: /Structure Test/i }).first().click();
    await expect(page).toHaveURL(/\/structures\/structure-test/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Structure Test');

    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Structure Test');
  });

  test('Actualites Flow: List -> Detail -> Refresh', async ({ page }) => {
     // Mock List
    await page.route('**/api/actualites*', async route => {
      await route.fulfill({
        json: {
          items: [{
            id: 'actu-1',
            slug: 'actu-test',
            titre: 'Actu Test',
            contenu: 'Summary',
            type_actu: 'info',
            date_publication: '2023-01-01'
          }],
          pagination: { page: 1, totalPages: 1 }
        }
      });
    });

    // Mock Detail
    await page.route('**/api/actualites/actu-test', async route => {
      await route.fulfill({
        json: {
          id: 'actu-1',
          slug: 'actu-test',
          titre: 'Actu Test',
          contenu: 'Full content',
          type_actu: 'info',
          date_publication: '2023-01-01'
        }
      });
    });

    await page.goto('/actualites');
    await expect(page.getByText('Actu Test').first()).toBeVisible();

    await page.getByRole('link', { name: /Actu Test/i }).first().click();
    await expect(page).toHaveURL(/\/actualites\/actu-test/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Actu Test');

    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Actu Test');
  });

});
