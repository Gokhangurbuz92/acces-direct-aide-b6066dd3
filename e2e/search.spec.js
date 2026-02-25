import { test, expect } from './fixtures.js';

test.describe('Search Functionality', () => {

  test.beforeEach(async ({ page }) => {
    // Mock Taxonomy (needed for filters and home page)
    await page.route('**/api/taxonomy', async route => {
      await route.fulfill({
        json: {
          categories: [{ slug: 'logement', label: 'Logement', count: 10 }, { slug: 'sante', label: 'Santé', count: 5 }],
          situations: []
        }
      });
    });

    // Mock Search Results (Default empty or generic)
    await page.route('**/api/aides*', async route => {
      await route.fulfill({
        json: {
          items: [],
          pagination: { total: 0, page: 1, pageSize: 12, totalPages: 1 }
        }
      });
    });

    // Mock Demarches
    await page.route('**/api/demarches*', async route => {
      await route.fulfill({
        json: {
          items: [],
          pagination: { total: 0, page: 1, pageSize: 12, totalPages: 1 }
        }
      });
    });

    // Mock Structures
    await page.route('**/api/structures*', async route => {
      await route.fulfill({
        json: {
          items: [],
          pagination: { total: 0, page: 1, pageSize: 12, totalPages: 1 }
        }
      });
    });
  });

  test('Aides Search: q only', async ({ page }) => {
    // Specific mock for "logement" search
    await page.route('**/api/aides?*q=logement*', async route => {
      await route.fulfill({
        json: {
          items: [{ id: '1', titre: 'Aide Logement Test', categorie: 'logement', slug: 'aide-logement' }],
          pagination: { total: 1, page: 1, pageSize: 12, totalPages: 1 }
        }
      });
    });

    await page.goto('/aides');

    // Fill search
    const searchInput = page.getByRole('textbox', { name: 'Rechercher' });
    await searchInput.fill('logement');
    await searchInput.press('Enter');

    // Check URL
    await expect(page).toHaveURL(/q=logement/);

    // Check results 
    await expect(page.getByText('Server Error')).not.toBeVisible();
  });

  test('Aides Search: q + filter', async ({ page }) => {
    // Mock response for this specific filter combo
    await page.route('**/api/aides*', async route => {
      // Fallback for any other params (mocking catch-all for this test)
      const url = new URL(route.request().url());
      if (url.searchParams.get('category') === 'sante') {
        await route.fulfill({
          json: {
            items: [{ id: '99', titre: 'Aide Santé', categorie: 'sante', slug: 'aide-sante' }],
            pagination: { total: 1, page: 1, pageSize: 12, totalPages: 1 }
          }
        });
      } else {
        await route.fulfill({ json: { items: [], pagination: { total: 0 } } });
      }
    });

    // Navigate directly to URL to avoid complex UI interaction with Shadcn Select in mocked env
    await page.goto('/aides?q=sante&category=sante');

    const searchInput = page.getByRole('textbox', { name: 'Rechercher' });

    // Check Search Input has 'sante'
    await expect(searchInput).toHaveValue('sante');

    // Check that we are looking at Santé category.
    // The UI shows active filters.
    await expect(page.getByText('Catégorie : sante')).toBeVisible();
  });

  test('Pagination & Refresh', async ({ page }) => {
    // Mock Page 1 (Active)
    await page.route('**/api/aides?*page=1*', async route => {
      await route.fulfill({
        json: {
          items: Array.from({ length: 12 }).map((_, i) => ({ id: `${i}`, titre: `Aide ${i}`, slug: `aide-${i}` })),
          pagination: { total: 24, page: 1, pageSize: 12, totalPages: 2 }
        }
      });
    });

    // Mock Page 2 (Target)
    await page.route('**/api/aides?*page=2*', async route => {
      await route.fulfill({
        json: {
          items: Array.from({ length: 12 }).map((_, i) => ({ id: `${12 + i}`, titre: `Aide ${12 + i}`, slug: `aide-${12 + i}` })),
          pagination: { total: 24, page: 2, pageSize: 12, totalPages: 2 }
        }
      });
    });

    await page.goto('/aides?q=a&page=1');

    // Make sure next button is enabled
    const nextButton = page.getByRole('button', { name: 'Suivant' });
    await expect(nextButton).toBeEnabled();
    await nextButton.click();

    await expect(page).toHaveURL(/page=2/);

    // Refresh
    await page.reload();
    await expect(page).toHaveURL(/page=2/);
  });

  test('Demarches Search', async ({ page }) => {
    // Navigate directly to search URL
    await page.goto('/demarches?q=passport');

    // Check URL
    await expect(page).toHaveURL(/q=passport/);

    // Check Input
    const searchInput = page.getByPlaceholder('Rechercher une démarche');
    await expect(searchInput).toHaveValue('passport');
  });

  test('Annuaire Search', async ({ page }) => {
    // Navigate directly
    await page.goto('/structures?q=mairie');

    // Check URL
    await expect(page).toHaveURL(/q=mairie/);

    // Check Input
    const searchInput = page.getByPlaceholder('Rechercher par nom ou service...');
    await expect(searchInput).toHaveValue('mairie');
  });

});
