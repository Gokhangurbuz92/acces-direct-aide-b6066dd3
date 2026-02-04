
import { test, expect } from '@playwright/test';

test.describe('Aides Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Mock Taxonomy
        await page.route('**/api/taxonomy', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ categories: [{ slug: 'logement', label: 'Logement' }], situations: [] })
            });
        });
    });

    test('should display filters and navigate to detail', async ({ page }) => {
        // 1. Mock Listing
        await page.route('**/api/aides*', async route => {
            const url = new URL(route.request().url());
            if (url.searchParams.get('slug')) {
                // Detail Mock
                 await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        id: '123',
                        slug: 'aide-test',
                        titre: 'Aide Test',
                        categorie: 'logement',
                        source_url: 'https://source.com',
                        apply_url: 'https://apply.com',
                        fetched_at: new Date().toISOString()
                    })
                });
                return;
            }

            // Listing Mock
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    items: [
                        { id: '123', slug: 'aide-test', titre: 'Aide Test', categorie: 'logement', summary_falc: 'Résumé' }
                    ],
                    total: 1,
                    facets: {
                        themes: { logement: 1 },
                        territoires: { national: 1 }
                    },
                    pagination: { page: 1, totalPages: 1 }
                })
            });
        });

        // 2. Visit Page
        await page.goto('/aides');
        await expect(page.getByText('Catalogue des aides')).toBeVisible();

        // 3. Verify Filters (Facets)
        await expect(page.getByRole('button', { name: 'logement' })).toBeVisible();

        // 4. Click Filter
        await page.getByRole('button', { name: 'logement' }).click();
        await expect(page).toHaveURL(/theme=logement/);
        await expect(page.getByText('Thème : logement')).toBeVisible();

        // 5. Click Card
        await page.getByTestId('aide-card-link-123').click();
        await expect(page).toHaveURL(/\/aides\/aide-test/);

        // 6. Verify Detail
        await expect(page.getByText('Aide Test', { exact: true }).first()).toBeVisible();

        // Verify Source Link (ExternalLink icon might make text matching tricky, check attributes)
        const sourceLink = page.locator('a[href="https://source.com"]');
        await expect(sourceLink).toBeVisible();
        await expect(sourceLink).toContainText('Source Officielle');

        // Verify Apply Button
        const applyLink = page.locator('a[href="https://apply.com"]').first();
        await expect(applyLink).toBeVisible();
        await expect(applyLink).toContainText('Faire ma demande');
    });
});
