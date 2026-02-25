import { test, expect } from './fixtures.js';

test.setTimeout(60000);

test('Public Booking Flow', async ({ page }) => {
  // Mock Structure for Booking
  await page.route('**/api/structures*', async route => {
    await route.fulfill({
      json: {
        items: [{
          id: 'dummy-123',
          slug: 'structure-test',
          nom: 'Structure Test',
          statut: 'actif',
          proServices: [{ id: 'svc-1', nom: 'Service Test' }]
        }],
        pagination: { total: 1 }
      }
    });
  });

  // Mock Availability
  await page.route('**/api/public/availability*', async route => route.fulfill({ json: [] }));

  // Mock Taxonomy to avoid errors if prompted
  await page.route('**/api/taxonomy', async route => route.fulfill({ json: { categories: [], situations: [] } }));


  // Use correct route from pages/index.jsx
  await page.goto('/appointments/request?structure_id=dummy-123');

  // Check title
  await expect(page.getByText('Choisir un créneau')).toBeVisible();

  // Check form fields
  await expect(page.getByLabel('Prénom')).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
});

test('Pro Login Flow', async ({ page }) => {
  // Use correct route
  await page.goto('/pro/login');

  // Use correct heading from ProLogin.jsx
  await expect(page.getByText('AccesDirect Pro')).toBeVisible();
  // Or by role if you prefer strictness:
  // await expect(page.getByRole('heading', { name: 'AccesDirect Pro' })).toBeVisible();
});