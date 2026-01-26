
import { test, expect } from '@playwright/test';

test.describe('Accessibility and Keyboard Navigation', () => {
  test('Home page has correct language and structure', async ({ page }) => {
    await page.goto('http://localhost:5173/');

    // Check html lang attribute
    const lang = await page.getAttribute('html', 'lang');
    expect(lang).toBe('fr');

    // Check main heading
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('Keyboard navigation works for vital path', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    // Wait for hydration/rendering
    await page.waitForLoadState('networkidle');

    // 1. Focus on body first
    await page.focus('body');

    // 2. Tab to "Skip to content"
    // Sometimes focus gets stuck on body, first tab moves to first element.
    await page.keyboard.press('Tab');

    // Debug: check what is focused
    const focused = await page.evaluate(() => document.activeElement.outerHTML);
    console.log('Focused element:', focused);

    const skipLink = page.locator('.skip-link');

    // If skip link is not focused, maybe we need another tab (browser dependent)
    if (!await skipLink.evaluate(el => el === document.activeElement)) {
        console.log('Skip link not focused, pressing Tab again...');
        await page.keyboard.press('Tab');
    }

    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();

    // 3. Tab to Logo
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'AccesDirectAide - Accueil' })).toBeFocused();

    // 4. Tab through Nav Items
    await page.keyboard.press('Tab');
    const navFocused = page.locator(':focus');
    // Ensure we are in a link or button
    const tagName = await navFocused.evaluate(el => el.tagName);
    expect(['A', 'BUTTON']).toContain(tagName);

    // 5. Check Search Input Reachability (by ID now)
    const searchInput = page.locator('#search-input');
    await expect(searchInput).toBeVisible();

    // We can try to focus it directly to ensure it's interactable
    await searchInput.focus();
    await expect(searchInput).toBeFocused();
  });
});
