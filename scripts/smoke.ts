import fetch from 'node-fetch';

const BASE_URL = process.env.DEPLOY_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET;

async function testEndpoint(path: string, options: any = {}) {
    console.log(`Testing ${path}...`);
    const response = await fetch(`${BASE_URL}${path}`, options);
    if (!response.ok) {
        console.error(`FAILED: ${path} (Status: ${response.status})`);
        const text = await response.text();
        console.error(text.substring(0, 200));
        return null;
    }
    const data = await response.json();
    console.log(`SUCCESS: ${path}`);
    return data;
}

async function smokeTest() {
    console.log('--- RUNNING SMOKE TESTS ---');

    // 1. Taxonomy
    const taxonomy = await testEndpoint('/api/taxonomy');
    if (taxonomy) {
        console.log(`- Categories: ${taxonomy.categories?.length}`);
        console.log(`- Situations: ${taxonomy.situations?.length}`);
    }

    // 2. Aides
    const aides = await testEndpoint('/api/aides?q=logement&pageSize=2');
    if (aides) {
        console.log(`- Aides found: ${aides.pagination?.total}`);
        if (aides.items?.length > 0) console.log(`- Sample: ${aides.items[0].titre}`);
    }

    // 3. Démarches
    const demarches = await testEndpoint('/api/demarches?category=justice&pageSize=2');
    if (demarches) {
        console.log(`- Démarches found: ${demarches.pagination?.total}`);
    }

    // 4. Structures
    const structures = await testEndpoint('/api/structures?city=Strasbourg&pageSize=2');
    if (structures) {
        console.log(`- Structures found: ${structures.pagination?.total}`);
    }

    // 5. Pipeline (if secret available)
    if (CRON_SECRET) {
        const pipeline = await testEndpoint(`/api/cron/pipeline?secret=${CRON_SECRET}`);
        if (pipeline) {
            console.log(`- Pipeline results: ${JSON.stringify(pipeline)}`);
        }
    }

    console.log('--- SMOKE TESTS COMPLETED ---');
}

smokeTest().catch(console.error);
