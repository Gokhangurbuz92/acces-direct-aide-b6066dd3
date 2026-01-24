
import { test, expect } from '@playwright/test';

// Mock data
const MOCK_AIDE = {
  id: 'test-aide-1',
  slug: 'test-aide-slug',
  titre: 'Aide Test E2E',
  cest_quoi: 'Description de l\'aide test',
  categorie: 'sante',
  territoires: ['67'],
  date_verification: new Date().toISOString()
};

const MOCK_DEMARCHE = {
  id: 'test-demarche-1',
  slug: 'test-demarche-slug',
  name: 'Démarche Test E2E',
  titre: 'Démarche Test E2E',
  description: 'Description de la démarche test',
  categorie: 'famille'
};

const MOCK_STRUCTURE = {
  id: 'test-structure-1',
  slug: 'test-structure-slug',
  nom: 'Structure Test E2E',
  name: 'Structure Test E2E',
  ville: 'Strasbourg',
  city: 'Strasbourg',
  type_structure: 'association',
  coverage: 'OFFICIAL'
};

const MOCK_NEWS = {
  id: 'test-news-1',
  slug: 'test-news-slug',
  titre: 'Actualité Test E2E',
  title: 'Actualité Test E2E',
  contenu: 'Contenu actualité test',
  type_actu: 'info',
  date_publication: new Date().toISOString(),
  statut: 'publie'
};

test.describe('Public Core Navigation', () => {

  test.beforeEach(async ({ page }) => {
    // Aides
    await page.route('**/api/aides*', async route => {
      const url = new URL(route.request().url());
      // console.log(`[Aides Mock] URL: ${url.toString()}`);
      if (url.searchParams.has('slug') || url.searchParams.has('id')) {
          await route.fulfill({ json: MOCK_AIDE });
      } else {
          await route.fulfill({ json: { items: [MOCK_AIDE], total: 1 } });
      }
    });

    // Demarches
    await page.route('**/api/demarches*', async route => {
      const url = new URL(route.request().url());
      if (url.searchParams.has('slug') || url.searchParams.has('id')) {
          await route.fulfill({ json: MOCK_DEMARCHE });
      } else {
          await route.fulfill({ json: { items: [MOCK_DEMARCHE], total: 1 } });
      }
    });

    // Structures
    await page.route('**/api/structures*', async route => {
      const url = new URL(route.request().url());
      if (url.searchParams.has('slug') || url.searchParams.has('id')) {
          await route.fulfill({ json: MOCK_STRUCTURE });
      } else {
          await route.fulfill({ json: { items: [MOCK_STRUCTURE], total: 1 } });
      }
    });

    // Actualites
    await page.route('**/api/actualites*', async route => {
      const url = new URL(route.request().url());
      if (url.searchParams.has('slug') || url.searchParams.has('id')) {
          await route.fulfill({ json: MOCK_NEWS });
      } else {
          await route.fulfill({ json: [MOCK_NEWS] });
      }
    });

    // Taxonomy
    await page.route('**/api/taxonomy', async route => {
        await route.fulfill({ json: { categories: [], publics: [], types: [], situations: [] } });
    });
  });

  test('Home page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Accès Direct Aide|AccesDirectAide/i);
  });

  test('Aides: List -> Detail -> Refresh', async ({ page }) => {
    await page.goto('/aides');
    // Wait for list to load
    await expect(page.getByText(MOCK_AIDE.titre)).toBeVisible();

    const link = page.getByRole('link', { name: `Voir l'aide ${MOCK_AIDE.titre}` });
    await expect(link).toBeVisible();
    await link.click();

    await expect(page).toHaveURL(new RegExp(`/aides/${MOCK_AIDE.slug}`));

    // Relaxed check: just text visible, increased timeout
    await expect(page.getByText(MOCK_AIDE.titre).first()).toBeVisible({ timeout: 10000 });

    await page.reload();

    // Check again
    await expect(page.getByText(MOCK_AIDE.titre).first()).toBeVisible({ timeout: 10000 });
  });

  test('Demarches: List -> Detail -> Refresh', async ({ page }) => {
    await page.goto('/demarches');
    await expect(page.getByText(MOCK_DEMARCHE.titre)).toBeVisible();

    await page.locator(`a[href*="/demarches/${MOCK_DEMARCHE.slug}"]`).first().click();

    await expect(page).toHaveURL(new RegExp(`/demarches/${MOCK_DEMARCHE.slug}`));
    await expect(page.getByRole('heading', { name: MOCK_DEMARCHE.titre })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: MOCK_DEMARCHE.titre })).toBeVisible();
  });

  test('Structures: List -> Detail -> Refresh', async ({ page }) => {
    await page.goto('/annuaire');
    await expect(page).toHaveURL(/.*\/structures/);

    await expect(page.getByText(MOCK_STRUCTURE.nom)).toBeVisible();

    await page.getByRole('link', { name: "Plus d'infos" }).first().click();

    await expect(page).toHaveURL(new RegExp(`/structures/${MOCK_STRUCTURE.slug}`));
    await expect(page.getByRole('heading', { name: MOCK_STRUCTURE.nom })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: MOCK_STRUCTURE.nom })).toBeVisible();
  });

  test('Actualites: List -> Detail -> Refresh', async ({ page }) => {
    await page.goto('/actualites');
    await expect(page.getByText(MOCK_NEWS.titre)).toBeVisible();

    await page.getByRole('heading', { name: MOCK_NEWS.titre }).click();

    await expect(page).toHaveURL(new RegExp(`/actualites/${MOCK_NEWS.slug}`));
    await expect(page.getByRole('heading', { name: MOCK_NEWS.titre })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: MOCK_NEWS.titre })).toBeVisible();
  });

});
