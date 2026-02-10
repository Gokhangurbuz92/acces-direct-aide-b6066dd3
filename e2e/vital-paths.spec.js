import { test, expect } from '@playwright/test';

test.describe('Vital Paths', () => {

  test.beforeEach(async ({ page }) => {
    // Global mocks
    await page.route(/\/api\/taxonomy/, async route => {
      await route.fulfill({ json: { categories: [], situations: [] } });
    });

    // Catch-all for noise
    await page.route(/\/api\/aides.*est_urgent=true/, async route => {
       await route.fulfill({ json: { items: [], pagination: { total: 0 } } });
    });
    await page.route(/\/api\/actualites/, async route => {
        await route.fulfill({ json: { items: [], pagination: { total: 0 } } });
    });
  });

  test('Search Aides', async ({ page }) => {
    await page.route(/\/api\/aides/, async route => {
      const url = route.request().url();
      console.log('Intercepted Aides:', url);
      // Always return result for this test, ignore Home page noise if any leaks through regex
      if (url.includes('est_urgent')) {
          return route.fulfill({ json: { items: [], pagination: { total: 0 } } });
      }
      const json = { items: [{ id: '1', titre: 'Aide Test', slug: 'aide-test', cest_quoi: 'Desc', statut: 'publie', categorie: 'logement' }], pagination: { total: 1, totalPages: 1, page: 1 } };
      await route.fulfill({ json });
    });

    await page.goto('/aides?q=test');
    await expect(page.getByText('Aide Test')).toBeVisible();
  });

  test('Search Structures', async ({ page }) => {
    await page.route(/\/api\/structures/, async route => {
      const json = { items: [{ id: 's1', nom: 'Structure Test', slug: 'structure-test', ville: 'Strasbourg' }], pagination: { total: 1, totalPages: 1, page: 1 } };
      await route.fulfill({ json });
    });

    await page.goto('/annuaire?q=test');
    await expect(page.getByText('Structure Test')).toBeVisible();
  });

  test('Aide Detail', async ({ page }) => {
    await page.route(/\/api\/aides/, async route => {
      console.log('Intercepted Aide Detail:', route.request().url());
      const json = { id: '1', titre: 'Aide Detail', slug: 'aide-detail', cest_quoi: 'Full Desc', statut: 'publie', categorie: 'sante' };
      await route.fulfill({ json });
    });

    await page.goto('/aide/aide-detail');
    await expect(page.getByRole('heading', { name: 'Aide Detail' })).toBeVisible();
  });

  test('Structure Detail', async ({ page }) => {
    await page.route(/\/api\/structures/, async route => {
        const json = {
            id: 's1',
            nom: 'Structure Detail',
            slug: 'structure-detail',
            proServices: [],
            type_structure: 'mairie',
            is_pro_enabled: false
        };
        await route.fulfill({ json });
    });

    await page.goto('/structures/structure-detail');
    await expect(page.getByRole('heading', { name: 'Structure Detail' })).toBeVisible();
  });

  test('Public Appointment Flow', async ({ page }) => {
      // Specific mock for Structure in this test
      await page.route(/\/api\/structures/, async route => {
        const url = route.request().url();
        console.log('Appt Flow Structure URL:', url);
        // AppointmentRequest expects Array!
        const json = [{ id: 's1', nom: 'Mairie Test', slug: 'mairie-test', proServices: [{ name: 'Rendez-vous' }], is_pro_enabled: true }];
        await route.fulfill({ json });
      });

      await page.route(/\/api\/public\/availability/, async route => {
          const start = new Date();
          start.setHours(start.getHours() + 24);
          const json = [{ start: start.toISOString(), end: start.toISOString() }];
          await route.fulfill({ json });
      });

      await page.route(/\/api\/appointments/, async route => {
          await route.fulfill({ json: { success: true } });
      });

      await page.goto('/appointmentrequest?structure_id=s1');
      await expect(page.getByText('Choisir un créneau')).toBeVisible();

      await page.getByRole('button', { name: /\d{2}:\d{2}/ }).first().click();

      // Wait for selection to be registered (UI update)
      await expect(page.getByText(/RDV sélectionné/)).toBeVisible();

      // Inputs might not be linked to labels via ID, so using role order
      const inputs = page.getByRole('textbox');
      await inputs.nth(0).fill('John');
      await inputs.nth(1).fill('Doe');
      await inputs.nth(2).fill('john@doe.com');

      await page.getByRole('button', { name: /confirmer/i }).click();

      await expect(page.getByText(/confirmé/i)).toBeVisible();
  });

  // Re-include others as passed
  test('Home Page loads and shows search', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /rechercher/i })).toBeVisible();
  });

  test('Pro Login', async ({ page }) => {
    await page.route(/\/api\/pro\/auth\/login/, async route => {
      await route.fulfill({ json: { token: 'fake-jwt', user: { email: 'pro@test.com' } } });
    });
    await page.route(/\/api\/pro\/me/, async route => {
       await route.fulfill({ json: { email: 'pro@test.com', role: 'PRO' } });
    });

    await page.goto('/pro/login');
    await page.getByLabel(/email/i).fill('pro@test.com');
    await page.getByLabel(/mot de passe/i).fill('password');
    await page.getByRole('button', { name: /se connecter/i }).click();

    await expect(page).toHaveURL(/\/pro\/dashboard/);
  });

  test('Pro Dashboard Access', async ({ page }) => {
     await page.route(/\/api\/pro\/me/, async route => {
       await route.fulfill({ json: { email: 'pro@test.com', role: 'PRO' } });
    });
    await page.addInitScript(() => {
        localStorage.setItem('pro_token', 'fake-jwt');
    });
    await page.goto('/pro/dashboard');
    await expect(page).toHaveURL(/\/pro\/dashboard/);
  });

  test('Contact Page Flow', async ({ page }) => {
      await page.route(/\/api\/contact/, async route => {
          await route.fulfill({ json: { success: true } });
      });
      await page.goto('/contact');
      await expect(page.getByRole('heading', { name: /contact/i })).toBeVisible();
  });

  test('404 Handling', async ({ page }) => {
      await page.goto('/page-qui-n-existe-pas');
      await expect(page).toHaveURL(/\/home|\/$/);
  });

});
