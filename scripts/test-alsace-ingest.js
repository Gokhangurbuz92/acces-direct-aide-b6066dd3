// import fetch from 'node-fetch'; // rely on global fetch
import crypto from 'crypto';

// If node-fetch is not installed, we can rely on global fetch in Node 18+
// To be safe, we check availability.
const fetcher = global.fetch || fetch;

const DATASETS = [
    {
        name: "Lieux de solidarité (Strasbourg)",
        url: "https://data.strasbourg.eu/api/records/1.0/search/?dataset=lieux_solidarite&rows=10"
        // Note: Dataset ID might need adjustment, this is a likely candidate or we fallback to generic search
    },
    {
        name: "CMS Strasbourg",
        url: "https://data.strasbourg.eu/api/records/1.0/search/?dataset=lieux_unites_territoriales_centres_medico_sociaux&rows=10"
    }
];

function slugify(text) {
    if (!text) return '';
    return text.toString().toLowerCase().trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

async function runDryRun() {
    console.log("🔍 TESTING ALSACE INGESTION (DRY RUN)\n");

    for (const source of DATASETS) {
        console.log(`\n--- Fetching Source: ${source.name} ---`);
        console.log(`URL: ${source.url}`);

        try {
            const res = await fetcher(source.url);
            if (!res.ok) {
                console.error(`❌ Failed: ${res.status} ${res.statusText}`);
                continue;
            }

            const data = await res.json();
            console.log(`✅ Connections OK. Found ${data.nhits || 0} hits.`);

            const records = data.records || [];
            if (records.length === 0) {
                console.log("⚠️ No records found.");
                continue;
            }

            console.log(`   Processing first 2 records for preview...\n`);

            for (const record of records.slice(0, 2)) {
                const f = record.fields;

                // MAPPING LOGIC
                const nom = f.name || f.nom || f.raison_sociale || "Nom Inconnu";
                const adresse = [f.adresse_num, f.adresse_lib, f.adresse_cplt].filter(Boolean).join(' ');
                const ville = f.commune || f.ville || "Strasbourg";
                const cp = f.code_postal || f.cp;
                const email = f.mail || f.email;
                const tel = f.tel || f.telephone;
                const site = f.url || f.site_internet;

                // Dedupe Hash
                const rawContent = `${nom}${adresse}${ville}`;
                const hash = crypto.createHash('md5').update(rawContent).digest('hex');
                const slug = slugify(nom) + '-' + hash.substring(0, 6);

                console.log(`   🔸 [Structure Candidate]`);
                console.log(`      Nom:       ${nom}`);
                console.log(`      Adresse:   ${adresse} ${cp} ${ville}`);
                console.log(`      Tel:       ${tel}`);
                console.log(`      Email:     ${email}`);
                console.log(`      Lat/Lon:   ${f.geo_point_2d ? f.geo_point_2d.join(', ') : 'null'}`);
                console.log(`      UID Hash:  ${hash}`);
                console.log(`      Slug:      ${slug}`);
                console.log(`      STATUS:    pending (would create)`);
                console.log("");
            }

        } catch (err) {
            console.error(`❌ Error: ${err.message}`);
        }
    }
}

runDryRun();
