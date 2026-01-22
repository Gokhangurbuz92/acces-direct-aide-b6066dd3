
import http from 'http';

function fetchJson(path) {
    return new Promise((resolve, reject) => {
        http.get(`http://localhost:3000${path}`, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        }).on('error', reject);
    });
}

async function verify() {
    console.log("Verifying Lot 7 APIs (Polished)...");

    // 1. Guides List
    const guides = await fetchJson('/api/guides');
    console.log(`GET /api/guides: Status ${guides.status}, Count: ${guides.body.length}`);
    if (guides.status !== 200 || !Array.isArray(guides.body)) throw new Error("Guides list failed");

    // 2. Guide Detail (Path Param)
    const slug = guides.body[0].slug;
    const guide = await fetchJson(`/api/guides/${slug}`);
    console.log(`GET /api/guides/${slug}: Status ${guide.status}, Title: ${guide.body.titre}`);
    if (guide.status !== 200 || !guide.body.id) throw new Error("Guide detail (slug) failed");

    // 3. Facets
    const facets = await fetchJson('/api/guides/facets');
    console.log(`GET /api/guides/facets: Status ${facets.status}, Categories: ${facets.body.categories?.length}`);
    if (facets.status !== 200 || !Array.isArray(facets.body.categories)) throw new Error("Facets failed");

    // 4. Tools List with Filter
    const tools = await fetchJson('/api/tools?type=numerique');
    console.log(`GET /api/tools?type=numerique: Status ${tools.status}, Count: ${tools.body.length}`);
    if (tools.status !== 200 || !Array.isArray(tools.body)) throw new Error("Tools list failed");
    if (tools.body.length > 0 && tools.body[0].type !== 'numerique') throw new Error("Filter failed");

    console.log("✅ Lot 7 Polished Verification Passed");
}

verify().catch(e => {
    console.error("❌ Verification Failed:", e);
    process.exit(1);
});
