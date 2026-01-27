export async function setupAdminMocks(page) {
    // In-memory DB
    let aides = [];

    // Auth
    await page.route('**/api/auth/login', async route => {
        return route.fulfill({
            json: {
                token: 'fake-token',
                user: { email: 'admin@accesdirectaide.fr', role: 'admin' }
            }
        });
    });

    await page.route('**/api/auth/me', async route => {
        return route.fulfill({
            json: { user: { email: 'admin@accesdirectaide.fr', role: 'admin' } }
        });
    });

    // Taxonomy
    await page.route('**/api/taxonomy', async route => {
        return route.fulfill({
            json: {
                categories: [{ slug: 'logement', label: 'Logement' }],
                situations: []
            }
        });
    });

    // Aides CRUD (Unified Admin & Public)
    await page.route('**/api/aides*', async route => {
        const req = route.request();
        const url = new URL(req.url());
        const method = req.method();

        // LIST
        if (method === 'GET' && !url.searchParams.get('id') && !url.searchParams.get('slug')) {
            // If public (not admin), might filter by statut?
            // But for smoke test, we just return all or filter if needed?
            // Admin smoke test verifies "Brouillon" THEN "Publié".
            // Public check verifies "Publié".
            // The mock should strictly respect filter if simpler?
            // Or just return everything?
            // Client filters via query params. Mock usually ignores them unless coded.
            // Let's implement basic filtering if possible, or just return all and let Client/UI handle it?
            // UI might filter client side if API doesn't? No, API does.
            // IF API returns filtered list, UI shows it.
            // If I return ALL, Admin UI shows all. Public UI shows all?
            // Public UI usually calls with `statut=publie` equivalent (Actually `api/_handlers/aides.js` defaults to public).
            // But client.js helper handles filtering?
            // Let's just return ALL items for simplicity in mock, assuming test environment is clean.
            // Wait, test expects "Brouillon" in Admin, then "Publié".
            // Public View: `await page.goto('/aides'); await expect... toBeVisible`.
            // If I return the item, it will be visible.
            return route.fulfill({
                json: {
                    items: aides,
                    pagination: { total: aides.length, page: 1, pageSize: 10, totalPages: 1 }
                }
            });
        }

        // GET ONE
        if (method === 'GET' && (url.searchParams.get('id') || url.searchParams.get('slug'))) {
            const id = url.searchParams.get('id');
            const slug = url.searchParams.get('slug');
            const item = aides.find(a => (id && a.id === id) || (slug && a.slug === slug));

            if (item) return route.fulfill({ json: item });
            return route.fulfill({ status: 404, json: { error: 'Not found' } });
        }

        // CREATE
        if (method === 'POST') {
            const body = await req.postDataJSON();
            const newAide = {
                ...body,
                id: 'generated-id-' + Date.now(),
                slug: body.slug || `slug-${Date.now()}`,
                statut: body.statut || 'brouillon',
                category: { name: 'Logement', label: 'Logement', slug: 'logement' }, // Mock relation
                situations: []
            };
            aides.push(newAide);
            return route.fulfill({ status: 201, json: newAide });
        }

        // UPDATE (PUT) - Publish uses this
        // Client PUTs to /api/aides?id=...
        if (method === 'PUT') {
            const id = url.searchParams.get('id');
            const body = await req.postDataJSON();
            const idx = aides.findIndex(a => a.id === id);
            if (idx !== -1) {
                aides[idx] = { ...aides[idx], ...body, updatedAt: new Date().toISOString() };
                return route.fulfill({ json: aides[idx] });
            }
            return route.fulfill({ status: 404 });
        }

        // DELETE
        if (method === 'DELETE') {
            const id = url.searchParams.get('id');
            const idx = aides.findIndex(a => a.id === id);
            if (idx !== -1) {
                aides.splice(idx, 1);
                return route.fulfill({ json: { success: true } });
            }
            return route.fulfill({ status: 404 });
        }

        return route.continue();
    });
}
