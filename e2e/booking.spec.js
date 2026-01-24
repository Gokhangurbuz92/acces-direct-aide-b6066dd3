
import { test, expect } from '@playwright/test';

// Use a known existing structure ID or mock it?
// We need the dev server running for this.
// Assuming dev server is at localhost:3000

test('Public Booking Flow', async ({ page }) => {
  // 1. Visit a structure detail page (we need a structure ID that has pro enabled)
  // This is tricky without seeding data.
  // Let's assume the "backend flow test" created a structure? No, that script cleans up (or tries to).
  // We can't rely on transient data.
  // We will test the UI components mount and navigate correctly, mocking the API if possible.

  // Actually, we can just check if the "AppointmentRequest" page loads given a dummy ID.
  await page.goto('http://localhost:3000/rdv?structure_id=dummy-123');

  // Check title
  await expect(page.getByText('Choisir un créneau')).toBeVisible();

  // Check form fields
  await expect(page.getByLabel('Prénom')).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
});

test('Pro Login Flow', async ({ page }) => {
  await page.goto('http://localhost:3000/pro/login');
  await expect(page.getByRole('heading', { name: 'Espace Professionnel' })).toBeVisible();
});
