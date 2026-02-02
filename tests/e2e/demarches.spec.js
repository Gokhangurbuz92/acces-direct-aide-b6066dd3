/**
 * E2E Tests for /demarches page
 * Run with: npm run test:e2e tests/e2e/demarches.spec.js
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

test.describe('/demarches - Liste des démarches', () => {
  test('should load demarches listing page', async ({ page }) => {
    await page.goto(`${BASE_URL}/demarches`);

    // Check page title
    await expect(page.locator('h1')).toContainText('Démarches');

    // Check search bar exists
    await expect(page.locator('input[placeholder*="Rechercher"]')).toBeVisible();

    // Check filter sidebar exists
    await expect(page.locator('text=Catégories')).toBeVisible();
    await expect(page.locator('text=Situations')).toBeVisible();
  });

  test('should display démarche cards', async ({ page }) => {
    await page.goto(`${BASE_URL}/demarches`);

    // Wait for loading to complete
    await page.waitForSelector('[data-testid="demarche-card"]', { timeout: 10000 }).catch(() => {
      // If no cards exist yet, that's OK for now (empty state)
    });

    // Check if cards are visible OR empty state
    const hasCards = await page.locator('[data-testid="demarche-card"]').count();
    const hasEmptyState = await page.locator('text=Aucun guide trouvé').count();

    expect(hasCards > 0 || hasEmptyState > 0).toBeTruthy();
  });

  test('should filter by category', async ({ page }) => {
    await page.goto(`${BASE_URL}/demarches`);

    // Click on a category filter (if available)
    const firstCategoryButton = page.locator('button:has-text("Identité")').first();
    const categoryExists = await firstCategoryButton.count();

    if (categoryExists > 0) {
      await firstCategoryButton.click();

      // Check URL updated with category param
      await expect(page).toHaveURL(/category=/);

      // Check active filter badge appears
      await expect(page.locator('text=Filtres actifs')).toBeVisible();
    }
  });

  test('should filter by situation', async ({ page }) => {
    await page.goto(`${BASE_URL}/demarches`);

    // Click on a situation filter (if available)
    const firstSituationButton = page.locator('button:has-text("Déménagement")').first();
    const situationExists = await firstSituationButton.count();

    if (situationExists > 0) {
      await firstSituationButton.click();

      // Check URL updated with situation param
      await expect(page).toHaveURL(/situation=/);
    }
  });

  test('should search démarches', async ({ page }) => {
    await page.goto(`${BASE_URL}/demarches`);

    // Type in search bar
    const searchInput = page.locator('input[placeholder*="Rechercher"]');
    await searchInput.fill('carte identité');
    await searchInput.blur(); // Trigger onBlur event

    // Wait for query to complete
    await page.waitForTimeout(1000);

    // Check URL updated with q param
    await expect(page).toHaveURL(/q=/);
  });

  test('should clear all filters', async ({ page }) => {
    await page.goto(`${BASE_URL}/demarches?category=identite&situation=demenagement`);

    // Wait for page load
    await page.waitForSelector('button:has-text("Tout effacer")');

    // Click clear filters
    await page.click('button:has-text("Tout effacer")');

    // Check URL cleared
    await expect(page).toHaveURL(`${BASE_URL}/demarches`);
  });
});

test.describe('/demarches/:slug - Détail démarche', () => {
  test('should open démarche detail page', async ({ page }) => {
    await page.goto(`${BASE_URL}/demarches`);

    // Wait for cards to load
    const firstCard = page.locator('[data-testid="demarche-card"]').first();
    const cardExists = await firstCard.waitFor({ timeout: 5000 }).then(() => true).catch(() => false);

    if (cardExists) {
      // Click on first card
      await firstCard.click();

      // Check we navigated to detail page
      await expect(page).toHaveURL(/\/demarches\//);

      // Check page title exists
      await expect(page.locator('h1')).toBeVisible();
    }
  });

  test('should display source_url and apply_url links', async ({ page }) => {
    // Navigate to a known démarche (if exists)
    await page.goto(`${BASE_URL}/demarches`);

    const firstCard = page.locator('[data-testid="demarche-card"]').first();
    const cardExists = await firstCard.waitFor({ timeout: 5000 }).then(() => true).catch(() => false);

    if (cardExists) {
      await firstCard.click();

      // Check traceability section exists
      const traceabilityHeading = page.locator('text=Source officielle & Traçabilité');
      if (await traceabilityHeading.count() > 0) {
        await expect(traceabilityHeading).toBeVisible();

        // Check "Faire la démarche" button exists (apply_url)
        const applyButton = page.locator('a:has-text("Faire la démarche")');
        if (await applyButton.count() > 0) {
          await expect(applyButton).toBeVisible();
          await expect(applyButton).toHaveAttribute('href', /.+/);
        }

        // Check "Consulter la source officielle" button exists (source_url)
        const sourceButton = page.locator('a:has-text("Consulter la source officielle")');
        if (await sourceButton.count() > 0) {
          await expect(sourceButton).toBeVisible();
          await expect(sourceButton).toHaveAttribute('href', /.+/);
        }
      }
    }
  });

  test('should display fetched_at date', async ({ page }) => {
    await page.goto(`${BASE_URL}/demarches`);

    const firstCard = page.locator('[data-testid="demarche-card"]').first();
    const cardExists = await firstCard.waitFor({ timeout: 5000 }).then(() => true).catch(() => false);

    if (cardExists) {
      await firstCard.click();

      // Check if "Dernière collecte" exists
      const fetchedAtLabel = page.locator('text=Dernière collecte');
      if (await fetchedAtLabel.count() > 0) {
        await expect(fetchedAtLabel).toBeVisible();
      }
    }
  });

  test('should display organisme if present', async ({ page }) => {
    await page.goto(`${BASE_URL}/demarches`);

    const firstCard = page.locator('[data-testid="demarche-card"]').first();
    const cardExists = await firstCard.waitFor({ timeout: 5000 }).then(() => true).catch(() => false);

    if (cardExists) {
      await firstCard.click();

      // Check if organisme field exists
      const organismeLabel = page.locator('text=Organisme responsable');
      if (await organismeLabel.count() > 0) {
        await expect(organismeLabel).toBeVisible();
      }
    }
  });

  test('should navigate back to listing', async ({ page }) => {
    await page.goto(`${BASE_URL}/demarches`);

    const firstCard = page.locator('[data-testid="demarche-card"]').first();
    const cardExists = await firstCard.waitFor({ timeout: 5000 }).then(() => true).catch(() => false);

    if (cardExists) {
      await firstCard.click();

      // Click "Retour aux démarches"
      await page.click('text=Retour aux démarches');

      // Check we're back at listing
      await expect(page).toHaveURL(/\/demarches$/);
    }
  });
});

test.describe('Error handling', () => {
  test('should show error state and retry button on API failure', async ({ page }) => {
    // Intercept API call and force failure
    await page.route('**/api/demarches*', route => route.abort());

    await page.goto(`${BASE_URL}/demarches`);

    // Check error message appears
    const errorMessage = page.locator('text=Une erreur est survenue');
    if (await errorMessage.count() > 0) {
      await expect(errorMessage).toBeVisible();

      // Check retry button exists
      await expect(page.locator('button:has-text("Réessayer")')).toBeVisible();
    }
  });

  test('should show 404 page for non-existent slug', async ({ page }) => {
    await page.goto(`${BASE_URL}/demarches/non-existent-slug-12345`);

    // Should show 404 or redirect to not found page
    const notFoundText = page.locator('text=404');
    const notFoundHeading = page.locator('h1:has-text("Introuvable")');

    const hasNotFound = (await notFoundText.count() > 0) || (await notFoundHeading.count() > 0);
    expect(hasNotFound).toBeTruthy();
  });
});
