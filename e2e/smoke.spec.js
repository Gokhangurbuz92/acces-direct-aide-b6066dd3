import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Critical Paths', () => {

  test.beforeEach(async ({ page }) => {
    // MOCK: Taxonomy (Critical for Filters)
    await page.route('**/api/taxonomy', async route => {
        await route.fulfill({ json: {
            categories: [{ slug: 'logement', label: 'Logement', count: 10 }],
            situations: [{ slug: 'etudiant', label: 'Étudiant', count: 5 }]
        }});
    });

    // MOCK: Auth/Me (Prevent 401/403 errors if app checks)
    await page.route('**/api/auth/me', async route => route.fulfill({ status: 401, json: { error: 'Not logged in' } }));
    await page.route('**/api/pro/me', async route => route.fulfill({ status: 401, json: { error: 'Not logged in' } }));


    // AIDES
    await page.route('**/api/aides?*', async route => {
      const json = {
        items: [{
            id: '1',
            slug: 'test-aide',
            titre: 'Aide Test Logement',
            categorie: 'logement',
            cest_quoi: 'Description courte aide',
            resume_falc: 'Une aide pour le logement'
        }],
        total: 1,
        page: 1,
        pageSize: 10
      };
      await route.fulfill({ json });
    });

    await page.route('**/api/aides/test-aide', async route => {
       await route.fulfill({ json: {
           id: '1',
           slug: 'test-aide',
           titre: 'Aide Test Logement',
           cest_quoi: 'Description détaillée',
           pour_qui: 'Pour tous',
           categorie: 'logement'
       }});
    });

    // DEMARCHES
    await page.route('**/api/demarches?*', async route => {
        await route.fulfill({ json: {
            items: [{
                id: '2',
                slug: 'test-demarche',
                titre: 'Demarche Test',
                description_courte: 'Desc demarche'
            }],
            total: 1
        }});
    });

    await page.route('**/api/demarches/test-demarche', async route => {
       await route.fulfill({ json: {
           id: '2',
           slug: 'test-demarche',
           titre: 'Demarche Test Detail',
           description_courte: 'Une démarche test'
       }});
    });

    // STRUCTURES (Annuaire)
    await page.route('**/api/structures?*', async route => {
        await route.fulfill({ json: {
            items: [{
                id: '3',
                slug: 'test-structure',
                nom: 'Structure Test',
                ville: 'Paris',
                code_postal: '75001',
                type_structure: 'mairie'
            }],
            total: 1
        }});
    });

    await page.route('**/api/structures/test-structure', async route => {
        await route.fulfill({ json: {
            id: '3',
            slug: 'test-structure',
            nom: 'Structure Test Detail',
            ville: 'Paris'
        }});
    });

    // ACTUALITES
    await page.route('**/api/actualites?*', async route => {
        await route.fulfill({ json: {
            items: [{
                id: '4',
                slug: 'test-actu',
                titre: 'Actu Test',
                resume: 'Resume actu'
            }],
            total: 1
        }});
    });

    // SEARCH
     await page.route('**/api/search*', async route => {
        await route.fulfill({ json: { results: [], total: 0 } });
    });

    // HEALTH
    await page.route('**/api/health', async route => route.fulfill({ status: 200, json: { status: 'ok' } }));
  });

  test('a) Aides list -> detail -> refresh', async ({ page }) => {
    await page.goto('/aides');
    await expect(page.getByText('Aide Test Logement')).toBeVisible();

    // Click "Voir cette aide" inside the card
    await page.locator('.group').filter({ hasText: 'Aide Test Logement' }).getByRole('link').click();

    await expect(page).toHaveURL(/\/aide\/test-aide/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('b) Demarches list -> detail -> refresh', async ({ page }) => {
    await page.goto('/demarches');
    await expect(page.getByText('Demarche Test')).toBeVisible();

    // Check if card has link, usually generic card component
    const card = page.locator('article').or(page.locator('.group')).filter({ hasText: 'Demarche Test' });
    // Try to find a link inside or click the title if it's a link
    if (await card.getByRole('link').count() > 0) {
        await card.getByRole('link').first().click();
    } else {
        await card.click(); // Fallback
    }

    await expect(page).toHaveURL(/\/demarches\/test-demarche/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('c) Structures list -> detail -> refresh', async ({ page }) => {
      await page.goto('/annuaire');
      await expect(page.getByText('Structure Test')).toBeVisible();

      const card = page.locator('article').or(page.locator('.group')).filter({ hasText: 'Structure Test' });
      if (await card.getByRole('link').count() > 0) {
        await card.getByRole('link').first().click();
      } else {
          await card.click();
      }

      await expect(page).toHaveURL(/\/structures\/test-structure/);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await page.reload();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('d) Search q only', async ({ page }) => {
      await page.goto('/');
      const searchInput = page.getByRole('searchbox').or(page.getByPlaceholder(/Recherch/i));

      if (await searchInput.count() > 0 && await searchInput.first().isVisible()) {
          await searchInput.first().fill('logement');
          await searchInput.first().press('Enter');
          // Just check it doesn't crash
          await expect(page.locator('body')).not.toBeEmpty();
      }
  });

  test('h) 404 Handling', async ({ page }) => {
      await page.route('**/api/aides/slug-inexistant-12345', async route => {
          await route.fulfill({ status: 404, json: { error: 'Not found' } });
      });

      await page.goto('/aides/slug-inexistant-12345');
      await expect(page.locator('#root')).not.toBeEmpty();
  });

  test('g) Actualites not empty', async ({ page }) => {
      await page.goto('/actualites');
      await expect(page.getByText('Actu Test')).toBeVisible();
  });

  test('j) No white screen check (Home)', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('#root')).not.toBeEmpty();
      await expect(page.getByRole('heading').first()).toBeVisible();
  });
});
