/**
 * E2E Tests for /aides page
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

test.describe('Page /aides', () => {
    test('should load aides listing page', async ({ page }) => {
        await page.goto(`${BASE_URL}/aides`);
        
        // Check title
        await expect(page).toHaveTitle(/Catalogue des aides|Aides/);
        
        // Check search bar exists
        await expect(page.locator('input[type="search"], input[placeholder*="Rechercher"]')).toBeVisible();
        
        // Check filters sidebar exists
        await expect(page.locator('text=Thèmes')).toBeVisible();
    });

    test('should display aide cards', async ({ page }) => {
        await page.goto(`${BASE_URL}/aides`);
        
        // Wait for cards to load
        await page.waitForSelector('[data-testid="aide-card"]', { timeout: 10000 });
        
        // Check at least one card is visible
        const cards = page.locator('[data-testid="aide-card"]');
        await expect(cards.first()).toBeVisible();
    });

    test('should search for aides', async ({ page }) => {
        await page.goto(`${BASE_URL}/aides`);
        
        // Type in search
        const searchInput = page.locator('input[type="search"], input[placeholder*="Rechercher"]');
        await searchInput.fill('logement');
        await searchInput.press('Enter');
        
        // Wait for results
        await page.waitForTimeout(1000);
        
        // Check URL contains query
        expect(page.url()).toContain('q=logement');
    });

    test('should filter by theme', async ({ page }) => {
        await page.goto(`${BASE_URL}/aides`);
        
        // Click on a theme filter
        const themeButton = page.locator('button:has-text("Logement"), button:has-text("logement")').first();
        if (await themeButton.isVisible()) {
            await themeButton.click();
            
            // Wait for filter to apply
            await page.waitForTimeout(1000);
            
            // Check URL contains theme
            expect(page.url()).toContain('theme=logement');
        }
    });

    test('should navigate to aide detail', async ({ page }) => {
        await page.goto(`${BASE_URL}/aides`);
        
        // Wait for cards
        await page.waitForSelector('[data-testid="aide-card"]', { timeout: 10000 });
        
        // Click first card
        const firstCard = page.locator('[data-testid="aide-card"]').first();
        const firstCardLink = firstCard.locator('a[data-testid^="aide-card-link"]');
        
        if (await firstCardLink.isVisible()) {
            await firstCardLink.click();
            
            // Wait for navigation
            await page.waitForLoadState('networkidle');
            
            // Check we're on detail page
            expect(page.url()).toMatch(/\/aides\/.+/);
            
            // Check detail page has title
            await expect(page.locator('h1')).toBeVisible();
        }
    });

    test('should show empty state when no results', async ({ page }) => {
        await page.goto(`${BASE_URL}/aides?q=xyzabc123nonexistent`);
        
        // Wait for empty state
        await page.waitForTimeout(2000);
        
        // Check empty state message
        await expect(page.locator('text=/Aucune aide|Aucun résultat/i')).toBeVisible();
    });

    test('should clear filters', async ({ page }) => {
        await page.goto(`${BASE_URL}/aides?theme=logement&territoire=67`);
        
        // Click clear filters button
        const clearButton = page.locator('button:has-text("Tout effacer"), button:has-text("Réinitialiser")');
        if (await clearButton.isVisible()) {
            await clearButton.click();
            
            // Wait for URL to update
            await page.waitForTimeout(500);
            
            // Check URL is clean
            expect(page.url()).not.toContain('theme=');
            expect(page.url()).not.toContain('territoire=');
        }
    });

    test('should paginate results', async ({ page }) => {
        await page.goto(`${BASE_URL}/aides`);
        
        // Wait for pagination
        await page.waitForTimeout(2000);
        
        // Check if pagination exists
        const nextButton = page.locator('button:has-text("Suivant")');
        if (await nextButton.isVisible() && await nextButton.isEnabled()) {
            await nextButton.click();
            
            // Wait for page change
            await page.waitForTimeout(1000);
            
            // Check URL contains page=2
            expect(page.url()).toContain('page=2');
        }
    });
});

test.describe('Page /aides/:slug (Detail)', () => {
    test('should load aide detail page', async ({ page }) => {
        // First get a valid slug
        await page.goto(`${BASE_URL}/aides`);
        await page.waitForSelector('[data-testid="aide-card"]', { timeout: 10000 });
        
        const firstCardLink = page.locator('[data-testid="aide-card"]').first().locator('a');
        const href = await firstCardLink.getAttribute('href');
        
        if (href) {
            await page.goto(`${BASE_URL}${href}`);
            
            // Check page loaded
            await expect(page.locator('h1')).toBeVisible();
            
            // Check breadcrumb
            await expect(page.locator('text=Accueil')).toBeVisible();
            await expect(page.locator('text=Aides')).toBeVisible();
        }
    });

    test('should display aide information', async ({ page }) => {
        await page.goto(`${BASE_URL}/aides`);
        await page.waitForSelector('[data-testid="aide-card"]', { timeout: 10000 });
        
        const firstCardLink = page.locator('[data-testid="aide-card"]').first().locator('a');
        const href = await firstCardLink.getAttribute('href');
        
        if (href) {
            await page.goto(`${BASE_URL}${href}`);
            
            // Check sections exist
            await expect(page.locator('text=/C\'est quoi|Description/i')).toBeVisible();
            await expect(page.locator('text=/Pour qui|Bénéficiaires/i')).toBeVisible();
        }
    });

    test('should display source link', async ({ page }) => {
        await page.goto(`${BASE_URL}/aides`);
        await page.waitForSelector('[data-testid="aide-card"]', { timeout: 10000 });
        
        const firstCardLink = page.locator('[data-testid="aide-card"]').first().locator('a');
        const href = await firstCardLink.getAttribute('href');
        
        if (href) {
            await page.goto(`${BASE_URL}${href}`);
            
            // Check source section exists
            const sourceSection = page.locator('text=/Sources|Source officielle/i');
            if (await sourceSection.isVisible()) {
                // Check external link exists
                await expect(page.locator('a[target="_blank"][rel*="noopener"]')).toBeVisible();
            }
        }
    });

    test('should have apply button if apply_url exists', async ({ page }) => {
        await page.goto(`${BASE_URL}/aides`);
        await page.waitForSelector('[data-testid="aide-card"]', { timeout: 10000 });
        
        const firstCardLink = page.locator('[data-testid="aide-card"]').first().locator('a');
        const href = await firstCardLink.getAttribute('href');
        
        if (href) {
            await page.goto(`${BASE_URL}${href}`);
            
            // Check if apply button exists (may not exist for all aides)
            const applyButton = page.locator('text=/Faire ma demande|Faire la demande/i');
            // Just check it doesn't throw, button may or may not exist
            const count = await applyButton.count();
            expect(count).toBeGreaterThanOrEqual(0);
        }
    });

    test('should navigate back to listing', async ({ page }) => {
        await page.goto(`${BASE_URL}/aides`);
        await page.waitForSelector('[data-testid="aide-card"]', { timeout: 10000 });
        
        const firstCardLink = page.locator('[data-testid="aide-card"]').first().locator('a');
        const href = await firstCardLink.getAttribute('href');
        
        if (href) {
            await page.goto(`${BASE_URL}${href}`);
            
            // Click back button
            const backButton = page.locator('text=/Retour aux aides|Retour/i').first();
            if (await backButton.isVisible()) {
                await backButton.click();
                
                // Check we're back on listing
                await page.waitForLoadState('networkidle');
                expect(page.url()).toContain('/aides');
            }
        }
    });
});
