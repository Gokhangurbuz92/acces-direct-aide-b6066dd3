
import { test, expect } from '@playwright/test';

// Use a known existing structure ID or mock it?
// We need the dev server running for this.
// Assuming dev server is at localhost:3000

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

  // Mock Taxonomy/Slots/etc to avoid blocking errors
  // Note: Component fetches /api/public/availability (singular)
  // And expects an array of slots.
  await page.route('**/api/public/availability*', async route => route.fulfill({ json: [] }));

  await page.goto('/appointmentrequest?structure_id=dummy-123');

  // Check title (Update expectation if necessary based on real UI)
  // If the page shows "Structure Test", check for that too.
  await expect(page.getByText('Choisir un créneau')).toBeVisible();

  // Check form fields
  await expect(page.getByLabel('Prénom')).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
});

test('Pro Login Flow', async ({ page }) => {
  await page.goto('/pro/login');
  await expect(page.getByText('AccesDirect Pro')).toBeVisible();
});
