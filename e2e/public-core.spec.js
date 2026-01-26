import { test, expect } from '@playwright/test';

// Mock Data
const MOCK_AIDES = {
    items: [
        {
            id: 'aide-1',
            slug: 'aide-test',
            titre: 'Aide Test',
            providerName: 'Test Provider',
            cest_quoi: 'Résumé facile.',
            categorie: 'logement',
            statut: 'publie'
        }
    ],
    pagination: { total: 1, page: 1, pageSize: 10, totalPages: 1 }
};

const MOCK_AIDE_DETAIL = {
    id: 'aide-1',
    slug: 'aide-test',
    titre: 'Aide Test Detail',
    providerName: 'Test Provider',
    cest_quoi: 'Description longue',
    categorie: 'logement',
    statut: 'publie',
    category: { name: 'Logement' }
};

const MOCK_DEMARCHES = {
    items: [
        {
            id: 'demarche-1',
            slug: 'demarche-test',
            titre: 'Démarche Test',
            summary_falc: 'Résumé démarche.',
            statut: 'publie'
        }
    ],
    pagination: { total: 1, page: 1, pageSize: 10, totalPages: 1 }
};

const MOCK_DEMARCHE_DETAIL = {
    id: 'demarche-1',
    slug: 'demarche-test',
    titre: 'Démarche Test Detail',
    statut: 'publie'
};

const MOCK_STRUCTURES = {
    items: [
        {
            id: 'struct-1',
            slug: 'structure-test',
            nom: 'Structure Test',
            adresse: '1 rue Test',
            ville: 'Testville',
            statut: 'actif',
            type_structure: 'association'
        }
    ],
    pagination: { total: 1, page: 1, pageSize: 10, totalPages: 1 }
};

const MOCK_STRUCTURE_DETAIL = {
    id: 'struct-1',
    slug: 'structure-test',
    nom: 'Structure Test Detail',
    adresse: '1 rue Test',
    ville: 'Testville',
    statut: 'actif',
    type_structure: 'association',
    proServices: []
};

// Actualites returns Array directly
const MOCK_ACTUALITES = [
    {
        id: 'actu-1',
        slug: 'actu-test',
        titre: 'Actualité Test',
        resume: 'Résumé actu.',
        type_actu: 'info',
        date_publication: new Date().toISOString(),
        published_at: new Date().toISOString(),
        est_important: false
    }
];

const MOCK_ACTUALITE_DETAIL = {
    id: 'actu-1',
    slug: 'actu-test',
    titre: 'Actualité Test Detail',
    contenu: 'Contenu actu',
    date_publication: new Date().toISOString(),
    published_at: new Date().toISOString()
};

test.describe('Public Core Routes', () => {

    test.beforeEach(async ({ page }) => {
        // Mock API Responses (using robust globs)
        await page.route('**/api/aides*', async route => {
            const url = route.request().url();
            if (url.includes('aide-test')) return route.fulfill({ json: MOCK_AIDE_DETAIL });
            return route.fulfill({ json: MOCK_AIDES });
        });

        await page.route('**/api/demarches*', async route => {
            const url = route.request().url();
            if (url.includes('demarche-test')) return route.fulfill({ json: MOCK_DEMARCHE_DETAIL });
            return route.fulfill({ json: MOCK_DEMARCHES });
        });

        await page.route('**/api/structures*', async route => {
            const url = route.request().url();
            if (url.includes('structure-test')) return route.fulfill({ json: MOCK_STRUCTURE_DETAIL });
            return route.fulfill({ json: MOCK_STRUCTURES });
        });

        await page.route('**/api/actualites*', async route => {
            const url = route.request().url();
            if (url.includes('actu-test')) return route.fulfill({ json: MOCK_ACTUALITE_DETAIL });
            return route.fulfill({ json: MOCK_ACTUALITES });
        });

        // Mock Stats/Taxonomy/Suggestions/Guides to avoid errors
        await page.route('**/api/public/stats', async route => route.fulfill({ json: {} }));
        await page.route('**/api/taxonomy', async route => route.fulfill({ json: { categories: [], situations: [] } }));
        await page.route('**/api/public/suggest-structure', async route => route.fulfill({ json: [] }));
        await page.route('**/api/guides*', async route => route.fulfill({ json: [] }));
        await page.route('**/api/tools*', async route => route.fulfill({ json: [] }));
        await page.route('**/api/dispositifs*', async route => route.fulfill({ json: [] }));
    });

    test('Home page loads', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/AccesDirect|Aide/i);
    });

    test('Aides list and detail navigation', async ({ page }) => {
        await page.goto('/aides');
        await expect(page.getByRole('heading', { name: 'Aide Test' })).toBeVisible();

        await page.getByLabel('Voir l\'aide Aide Test').click();
        await expect(page.getByRole('heading', { name: 'Aide Test Detail' })).toBeVisible();
    });

    test('Demarches list and detail navigation', async ({ page }) => {
        await page.goto('/demarches');
        await expect(page.getByRole('heading', { name: 'Démarche Test' })).toBeVisible();

        await page.getByRole('link', { name: /Démarrer|Voir|Consulter/i }).first().click();
        await expect(page.getByRole('heading', { name: 'Démarche Test Detail' })).toBeVisible();
    });

    test('Structures list and detail navigation', async ({ page }) => {
        await page.goto('/annuaire');
        await expect(page.getByRole('heading', { name: 'Structure Test' })).toBeVisible();

        // Use "Plus d'infos" link as the card title is not clickable
        await page.getByRole('link', { name: "Plus d'infos" }).first().click();
        await expect(page.getByRole('heading', { name: 'Structure Test Detail' })).toBeVisible();
    });

    test('Actualites list and detail navigation', async ({ page }) => {
        await page.goto('/actualites');
        await expect(page.getByRole('heading', { name: 'Actualité Test' })).toBeVisible();

        // Actualites uses title as link in one place, or "Lire la suite"
        await page.getByRole('heading', { name: 'Actualité Test' }).click();
        await expect(page.getByRole('heading', { name: 'Actualité Test Detail' })).toBeVisible();
    });

});
