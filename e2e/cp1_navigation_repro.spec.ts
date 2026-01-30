import { test, expect } from '@playwright/test';

test('CP1: Navigation Listing -> Detail', async ({ page }) => {
    // 1. Go to listing page
    await page.goto('/aides');
    await expect(page.getByRole('heading', { level: 1, name: /Aides/i })).toBeVisible();

    // 2. Click the first aide card
    // Use specific selector for the card's main link
    // The card has a link with aria-label starting with "Voir l'aide"
    const cardLink = page.getByRole('link', { name: /^Voir l'aide/ }).first();
    await expect(cardLink).toBeVisible();

    const href = await cardLink.getAttribute('href');
    console.log('Navigating to:', href);

    await cardLink.click();

    // 3. Verify Detail Page
    // Should have an H1 that matches the card title ideally, or at least not 404
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });

    // Verify we are not on 404
    const heading = await page.locator('h1').innerText();
    if (heading.includes('Page non trouvée')) {
        throw new Error(`Navigation failed - 404 Page Not Found on ${href}`);
    }
    console.log('Successfully navigated to:', heading);
});
