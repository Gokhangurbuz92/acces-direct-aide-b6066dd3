import { test, expect } from '@playwright/test';

test('Dev server: /@vite/client is served as JavaScript (local only)', async ({ request }) => {
  // Keep in sync with `playwright.config.js`.
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL || 'http://127.0.0.1:3000';

  // This check only makes sense for local dev runs (Vite / vercel dev).
  if (!baseURL || !/(localhost|127\.0\.0\.1)/.test(baseURL)) {
    test.skip(true, 'Not running against a local dev server.');
  }

  const res = await request.get(`${baseURL}/@vite/client`);
  expect(res.status()).toBe(200);

  const ct = res.headers()['content-type'] || '';
  expect(ct).toMatch(/javascript/i);
});

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

  test('Aides Flow: Listing -> Detail -> Refresh', async ({ page }) => {
    // Mock Listing + Detail (AideDetail uses /api/aides?slug=...)
    await page.route('**/api/aides*', async (route) => {
      const url = new URL(route.request().url());
      const slug = url.searchParams.get('slug');

      if (slug === 'aide-test-slug') {
        await route.fulfill({
          json: {
            id: 'aide-1',
            slug: 'aide-test-slug',
            titre: 'Aide Test Title',
            categorie: 'logement',
            cest_quoi: 'Full description',
            summary_falc: 'Summary',
          },
        });
        return;
      }

      await route.fulfill({
        json: {
          items: [
            {
              id: 'aide-1',
              slug: 'aide-test-slug',
              titre: 'Aide Test Title',
              categorie: 'logement',
              cest_quoi: 'Summary',
              summary_falc: 'Summary',
            },
          ],
          facets: {},
          pagination: { page: 1, totalPages: 1, total: 1, limit: 20, pageSize: 20, hasNext: false },
        },
      });
    });

    // Sidebar query from AideDetail
    await page.route('**/api/structures*', async route => {
      await route.fulfill({ json: { items: [] } });
    });

    await page.goto('/aides');
    await expect(page.getByTestId('aides-results-list')).toBeVisible();
    await expect(page.getByTestId('aide-card').first()).toBeVisible();

    await page.getByTestId('aide-card').first().click();

    // Check URL
    await expect(page).toHaveURL(/\/aides\/aide-test-slug/);
    await expect(page.getByRole('heading', { level: 1, name: /Aide Test Title/i })).toBeVisible();

    // Refresh
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: /Aide Test Title/i })).toBeVisible();
  });

  test('Demarches Flow: List -> Detail -> Refresh', async ({ page }) => {
    // Mock List + Detail
    await page.route('**/api/demarches**', async route => {
      const url = new URL(route.request().url());
      const isDetail = url.pathname.endsWith('/api/demarches/demarche-test');

      if (isDetail) {
        await route.fulfill({
          json: {
            id: 'dem-1',
            slug: 'demarche-test',
            titre: 'Demarche Test',
            description_courte: 'Full description',
            category: { slug: 'sante', label: 'Santé' },
          },
        });
        return;
      }

      await route.fulfill({
        json: {
          items: [{
            id: 'dem-1',
            slug: 'demarche-test',
            titre: 'Demarche Test',
            summary_falc: 'Summary',
            category: { slug: 'sante', label: 'Santé' },
          }],
          pagination: { page: 1, totalPages: 1, total: 1, limit: 20, pageSize: 20, hasNext: false },
        },
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
    // Mock List + Detail (supports both /api/structures?slug=... and /api/structures/:slug)
    await page.route('**/api/structures**', async (route) => {
      const url = new URL(route.request().url());
      const slugParam = url.searchParams.get('slug');
      const isDetailPath = url.pathname.endsWith('/api/structures/structure-test');
      const isDetail = isDetailPath || slugParam === 'structure-test';

      if (isDetail) {
        await route.fulfill({
          json: {
            id: 'struct-1',
            slug: 'structure-test',
            nom: 'Structure Test',
            ville: 'Strasbourg',
            departement: '67',
            type_structure: 'association',
            statut: 'actif',
            accessibilite_pmr: true,
            description_courte: 'Courte description',
            adresse: '10 rue des tests',
            code_postal: '67000',
          },
        });
        return;
      }

      await route.fulfill({
        json: {
          items: [{
            id: 'struct-1',
            slug: 'structure-test',
            nom: 'Structure Test',
            ville: 'Strasbourg',
            departement: '67',
            type_structure: 'association',
            accessibilite_pmr: true,
            description_courte: 'Courte description',
            adresse: '10 rue des tests',
            code_postal: '67000',
          }],
          pagination: { page: 1, totalPages: 1, total: 1, limit: 12, pageSize: 12, hasNext: false }
        }
      });
    });

    await page.goto('/annuaire');
    await expect(page.getByTestId('structures-results-list')).toBeVisible();
    await expect(page.getByText('Structure Test').first()).toBeVisible();

    // Interaction: submit search
    await page.getByTestId('structures-search-input').fill('Structure Test');
    await page.getByTestId('structures-search-submit').click();

    await page.getByRole('link', { name: /Voir la fiche de Structure Test/i }).first().click();
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
