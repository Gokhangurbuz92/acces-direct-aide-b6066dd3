import { test, expect } from '@playwright/test';

test.setTimeout(60000);

test.setTimeout(60000);

test.describe('Public Navigation Smoke Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Mock Taxonomy (needed for filters)
    await page.route('**/api/taxonomy', async route => {
      await route.fulfill({
        json: {
          categories: [{ slug: 'logement', label: 'Logement', count: 1 }],
          situations: []
        }
      });
    });
  });

  test('Aides Flow: List -> Detail -> Refresh -> Back', async ({ page }) => {
    // Mock API for List and Detail
    await page.route('**/api/aides*', async route => {
      const url = new URL(route.request().url());
      if (url.searchParams.has('slug')) {
        await route.fulfill({
          json: {
            id: '123',
            slug: 'aide-test',
            titre: 'Aide Test',
            categorie: 'logement',
            cest_quoi: 'Ceci est une aide de test.',
            statut: 'publie',
            published_at: new Date().toISOString()
          }
        });
      } else {
        await route.fulfill({
          json: {
            items: [{
              id: '123',
              slug: 'aide-test',
              titre: 'Aide Test',
              categorie: 'logement',
              cest_quoi: 'Description courte',
              statut: 'publie',
              published_at: new Date().toISOString()
            }],
            pagination: { total: 1, page: 1, pageSize: 12, totalPages: 1 }
          }
        });
      }
    });

    await page.goto('/aides');
    await expect(page.getByText('Aide Test')).toBeVisible();

    await page.getByRole('link', { name: 'Voir l\'aide Aide Test' }).click();
    await expect(page).toHaveURL(/\/aides\/aide-test/);
    await expect(page.getByRole('heading', { name: 'Aide Test' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Aide Test' })).toBeVisible();

    await page.getByRole('link', { name: 'Retour aux aides' }).click();
    await expect(page).toHaveURL(/\/aides/);
  });

  test('Demarches Flow: List -> Detail -> Refresh -> Back', async ({ page }) => {
    await page.route('**/api/demarches*', async route => {
      const url = new URL(route.request().url());
      if (url.searchParams.has('slug')) {
        await route.fulfill({
          json: {
            id: '456',
            slug: 'demarche-test',
            titre: 'Démarche Test',
            categorie: 'logement',
            description_courte: 'Description démarche',
            statut: 'publie',
            published_at: new Date().toISOString(),
            etapes: [],
            documents_necessaires: []
          }
        });
      } else {
        await route.fulfill({
          json: {
            items: [{
              id: '456',
              slug: 'demarche-test',
              titre: 'Démarche Test',
              categorie: 'logement',
              description_courte: 'Description démarche',
              statut: 'publie',
              published_at: new Date().toISOString()
            }],
            pagination: { total: 1, page: 1, pageSize: 12, totalPages: 1 }
          }
        });
      }
    });

    await page.goto('/demarches');
    await expect(page.getByText('Démarche Test')).toBeVisible();

    await page.getByRole('link', { name: 'Démarrer la démarche' }).click();
    await expect(page).toHaveURL(/\/demarches\/demarche-test/);
    await expect(page.getByRole('heading', { name: 'Démarche Test' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Démarche Test' })).toBeVisible();

    await page.getByRole('link', { name: 'Retour aux démarches' }).click();
    await expect(page).toHaveURL(/\/demarches/);
  });

  test('Structures Flow: List -> Detail -> Refresh -> Back', async ({ page }) => {
    await page.route('**/api/structures*', async route => {
      const url = new URL(route.request().url());
      if (url.searchParams.has('slug')) {
        await route.fulfill({
          json: {
            id: '789',
            slug: 'structure-test',
            nom: 'Structure Test',
            type_structure: 'association',
            statut: 'actif',
            ville: 'Strasbourg',
            code_postal: '67000'
          }
        });
      } else {
        // Note: StructureCard uses structure.slug logic
        await route.fulfill({
          json: {
            items: [{
              id: '789',
              slug: 'structure-test',
              nom: 'Structure Test',
              type_structure: 'association',
              statut: 'actif',
              ville: 'Strasbourg',
              code_postal: '67000'
            }],
            pagination: { total: 1, page: 1, pageSize: 12, totalPages: 1 }
          }
        });
      }
    });

    await page.goto('/structures');
    await expect(page.getByText('Structure Test')).toBeVisible();

    await page.getByRole('link', { name: 'Plus d\'infos' }).click();
    await expect(page).toHaveURL(/\/structures\/structure-test/);
    await expect(page.getByRole('heading', { name: 'Structure Test' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Structure Test' })).toBeVisible();

    await page.getByRole('link', { name: 'Retour à l\'annuaire' }).click();
    await expect(page).toHaveURL(/\/structures/);
  });

});
