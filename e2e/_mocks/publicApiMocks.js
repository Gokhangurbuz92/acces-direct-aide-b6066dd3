// Mock Data Definitions
const MOCK_AIDES = {
    items: [
        {
            id: 'aide-1',
            slug: 'aide-test',
            titre: 'Aide Test',
            providerName: 'Test Provider',
            cest_quoi: 'Résumé facile.',
            categorie: 'logement',
            statut: 'publie',
            date_verification: '2026-01-10T10:00:00.000Z',
            provenance: {
                verifiedAt: '2026-01-10T10:00:00.000Z',
                fetchedAt: '2026-02-10T10:00:00.000Z',
                sourceUrl: 'https://www.service-public.fr/aide-test',
                sourceHost: 'www.service-public.fr'
            }
        }
    ],
    pagination: { total: 1, page: 1, pageSize: 10, totalPages: 1 }
};

const MOCK_AIDE_DETAIL = {
    id: 'aide-1',
    slug: 'aide-test',
    titre: 'Aide Test',
    providerName: 'Test Provider',
    cest_quoi: 'Description longue',
    categorie: 'logement',
    statut: 'publie',
    category: { name: 'Logement' },
    date_verification: '2026-01-10T10:00:00.000Z',
    provenance: {
        verifiedAt: '2026-01-10T10:00:00.000Z',
        fetchedAt: '2026-02-10T10:00:00.000Z',
        sourceUrl: 'https://www.service-public.fr/aide-test',
        sourceHost: 'www.service-public.fr'
    }
};

const MOCK_DEMARCHES = {
    items: [
        {
            id: 'demarche-1',
            slug: 'demarche-test',
            titre: 'Démarche Test',
            summary_falc: 'Résumé démarche.',
            statut: 'publie',
            date_verification: '2025-10-10T10:00:00.000Z',
            provenance: {
                verifiedAt: '2025-10-10T10:00:00.000Z',
                fetchedAt: '2026-02-10T10:00:00.000Z',
                sourceUrl: 'https://www.service-public.fr/demarche-test',
                sourceHost: 'www.service-public.fr'
            }
        }
    ],
    pagination: { total: 1, page: 1, pageSize: 10, totalPages: 1 }
};

const MOCK_DEMARCHE_DETAIL = {
    id: 'demarche-1',
    slug: 'demarche-test',
    titre: 'Démarche Test',
    summary_falc: 'Résumé démarche.',
    statut: 'publie',
    date_verification: '2025-10-10T10:00:00.000Z',
    provenance: {
        verifiedAt: '2025-10-10T10:00:00.000Z',
        fetchedAt: '2026-02-10T10:00:00.000Z',
        sourceUrl: 'https://www.service-public.fr/demarche-test',
        sourceHost: 'www.service-public.fr'
    }
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
            type_structure: 'association',
            is_pro_enabled: true,
            date_verification: '2025-07-10T10:00:00.000Z',
            provenance: {
                verifiedAt: '2025-07-10T10:00:00.000Z',
                fetchedAt: '2026-02-10T10:00:00.000Z',
                sourceUrl: 'https://www.bas-rhin.fr/structure-test',
                sourceHost: 'www.bas-rhin.fr'
            }
        }
    ],
    pagination: { total: 1, page: 1, pageSize: 10, totalPages: 1 }
};

const MOCK_STRUCTURE_DETAIL = {
    id: 'struct-1',
    slug: 'structure-test',
    nom: 'Structure Test',
    adresse: '1 rue Test',
    ville: 'Testville',
    statut: 'actif',
    type_structure: 'association',
    is_pro_enabled: true,
    proServices: [],
    date_verification: '2025-07-10T10:00:00.000Z',
    provenance: {
        verifiedAt: '2025-07-10T10:00:00.000Z',
        fetchedAt: '2026-02-10T10:00:00.000Z',
        sourceUrl: 'https://www.bas-rhin.fr/structure-test',
        sourceHost: 'www.bas-rhin.fr'
    }
};

const MOCK_ACTUALITES = {
    items: [
        {
            id: 'actu-1',
            slug: 'actu-test',
            titre: 'Actualité Test',
            resume: 'Résumé actu.',
            type_actu: 'info',
            date_publication: new Date().toISOString(),
            published_at: new Date().toISOString(),
            est_important: false,
            provenance: {
                verifiedAt: null,
                fetchedAt: '2026-02-10T10:00:00.000Z',
                sourceUrl: 'https://www.service-public.fr/actualite-test',
                sourceHost: 'www.service-public.fr'
            }
        }
    ],
    pagination: { total: 1, page: 1, pageSize: 10, totalPages: 1 }
};

const MOCK_ACTUALITE_DETAIL = {
    id: 'actu-1',
    slug: 'actu-test',
    titre: 'Actualité Test',
    contenu: 'Contenu actu',
    type_actu: 'info',
    date_publication: new Date().toISOString(),
    published_at: new Date().toISOString(),
    provenance: {
        verifiedAt: null,
        fetchedAt: '2026-02-10T10:00:00.000Z',
        sourceUrl: 'https://www.service-public.fr/actualite-test',
        sourceHost: 'www.service-public.fr'
    }
};

/**
 * Configure tous les mocks API publics nécessaires pour les tests E2E
 * @param {import('@playwright/test').Page} page
 */
export async function setupPublicMocks(page) {
    // Aides
    await page.route('**/api/aides**', async route => {
        const url = route.request().url();
        if (url.includes('aide-test')) return route.fulfill({ json: MOCK_AIDE_DETAIL });
        return route.fulfill({ json: MOCK_AIDES });
    });

    // Démarches
    await page.route('**/api/demarches**', async route => {
        const url = route.request().url();
        if (url.includes('demarche-test')) return route.fulfill({ json: MOCK_DEMARCHE_DETAIL });
        return route.fulfill({ json: MOCK_DEMARCHES });
    });

    // Structures
    await page.route('**/api/structures**', async route => {
        const url = route.request().url();
        if (url.includes('structure-test')) return route.fulfill({ json: MOCK_STRUCTURE_DETAIL });
        return route.fulfill({ json: MOCK_STRUCTURES });
    });

    // Actualités
    await page.route('**/api/actualites**', async route => {
        const url = route.request().url();
        if (url.includes('actu-test')) return route.fulfill({ json: MOCK_ACTUALITE_DETAIL });
        return route.fulfill({ json: MOCK_ACTUALITES });
    });

    // Mocks techniques et utilitaires
    await page.route('**/api/public/stats', async route => route.fulfill({ json: {} }));
    await page.route('**/api/taxonomy', async route => route.fulfill({ json: { categories: [{ slug: 'logement', label: 'Logement', count: 1 }], situations: [] } }));
    await page.route('**/api/public/suggest-structure', async route => route.fulfill({ json: [] }));
    await page.route('**/api/guides*', async route => route.fulfill({ json: [] }));
    await page.route('**/api/tools*', async route => route.fulfill({ json: [] }));
    await page.route('**/api/dispositifs*', async route => route.fulfill({ json: [] }));
}

export const PUBLIC_MOCKS_DATA = {
    aides: MOCK_AIDES,
    aideDetail: MOCK_AIDE_DETAIL,
    demarches: MOCK_DEMARCHES,
    demarcheDetail: MOCK_DEMARCHE_DETAIL,
    structures: MOCK_STRUCTURES,
    structureDetail: MOCK_STRUCTURE_DETAIL,
    actualites: MOCK_ACTUALITES,
    actualiteDetail: MOCK_ACTUALITE_DETAIL
};
