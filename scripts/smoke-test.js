const API_URL = 'http://localhost:3000';

async function checkEndpoint(name, url) {
    console.log(`Checking ${name} (${url})...`);
    try {
        const res = await fetch(url);
        if (res.status !== 200) {
            console.error(`❌ ${name} failed: Status ${res.status}`);
            return null;
        }
        const data = await res.json();
        console.log(`✅ ${name} OK. Items: ${Array.isArray(data.items) ? data.items.length : (Array.isArray(data) ? data.length : 'N/A')}`);
        return data;
    } catch (e) {
        console.error(`❌ ${name} failed: ${e.message}`);
        return null;
    }
}

async function run() {
    console.log("Starting API Smoke Test...");

    // Check Aides
    const aides = await checkEndpoint('Aides List', `${API_URL}/api/aides`);
    if (aides && aides.items && aides.items.length > 0) {
        const first = aides.items[0];
        // Check Detail by Slug or ID
        // Note: API handler now supports id or slug.
        // If slug is present, let's try ?slug=...
        // If only id, ?id=...
        // Frontend uses filter({ slug }) or filter({ id }).
        const detailUrl = first.slug
            ? `${API_URL}/api/aides?slug=${first.slug}`
            : `${API_URL}/api/aides?id=${first.id}`;

        await checkEndpoint('Aide Detail', detailUrl);
    }

    // Check Structures
    const structures = await checkEndpoint('Structures List', `${API_URL}/api/structures`);
    if (structures && structures.items && structures.items.length > 0) {
        const first = structures.items[0];
        const detailUrl = first.slug
            ? `${API_URL}/api/structures?slug=${first.slug}`
            : `${API_URL}/api/structures?id=${first.id}`;
        await checkEndpoint('Structure Detail', detailUrl);
    }

    // Check Actualites
    const news = await checkEndpoint('Actualites List', `${API_URL}/api/actualites`);
    // actualites endpoint returns array directly (from my reading of handler, unless changed)
    // api/_handlers/actualites.js returns items (array) if no id/slug.
    // Wait, let's check handler again.
    // return res.status(200).json(items);
    // So it is an array.
    const newsItems = Array.isArray(news) ? news : news.items;

    if (newsItems && newsItems.length > 0) {
        const first = newsItems[0];
        const detailUrl = first.slug
            ? `${API_URL}/api/actualites?slug=${first.slug}`
            : `${API_URL}/api/actualites?id=${first.id}`;
        await checkEndpoint('Actualite Detail', detailUrl);
    }

    // Check Demarches
    const demarches = await checkEndpoint('Demarches List', `${API_URL}/api/demarches`);
    if (demarches && demarches.items && demarches.items.length > 0) {
        const first = demarches.items[0];
        const detailUrl = first.slug
            ? `${API_URL}/api/demarches?slug=${first.slug}`
            : `${API_URL}/api/demarches?id=${first.id}`;
        await checkEndpoint('Demarche Detail', detailUrl);
    }

    console.log("Smoke Test Complete.");
}

run().catch(e => console.error(e));
