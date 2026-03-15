import { db } from '../src/db/index.js';
import { Aide, Demarche, Structure, Dispositif } from '../src/db/schema.js';
import fs from 'fs';
import slugify from '@sindresorhus/slugify';

const MODEL_TABLE = {
    aide: Aide,
    demarche: Demarche,
    structure: Structure,
    dispositif: Dispositif,
};

async function importCsv(type, filePath) {
    console.log(`📂 Importing ${type} from ${filePath}...`);

    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        return;
    }

    const table = MODEL_TABLE[type];
    if (!table) {
        console.error(`❌ Unknown type: ${type}. Valid: ${Object.keys(MODEL_TABLE).join(', ')}`);
        return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    let createdCount = 0;
    let errorCount = 0;

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        try {
            const values = parseCsvLine(lines[i]);
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index];
            });

            const data = mapData(type, row);

            await db.insert(table).values(data).onConflictDoUpdate({
                target: [table.slug],
                set: data,
            });

            createdCount++;
        } catch (err) {
            console.error(`❌ Error on line ${i + 1}:`, err.message);
            errorCount++;
        }
    }

    console.log(`✅ Finished: ${createdCount} created/updated, ${errorCount} errors.`);
}

function parseCsvLine(line) {
    const result = [];
    let startValueIndex = 0;
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
            inQuotes = !inQuotes;
        } else if (line[i] === ',' && !inQuotes) {
            result.push(line.substring(startValueIndex, i).replace(/^"|"$/g, '').trim());
            startValueIndex = i + 1;
        }
    }
    result.push(line.substring(startValueIndex).replace(/^"|"$/g, '').trim());
    return result;
}

function mapData(type, row) {
    const data = { ...row };

    if (!data.slug && data.titre) data.slug = slugify(data.titre);
    if (!data.slug && data.nom) data.slug = slugify(data.nom);

    const arrayFields = ['territoires', 'departements', 'audiences', 'situations_vie', 'documents_necessaires', 'mots_cles', 'services', 'publics_accueillis', 'categories_aidees', 'public'];
    arrayFields.forEach(field => {
        if (data[field]) {
            data[field] = data[field].split('|').map(s => s.trim()).filter(Boolean);
        } else if (Object.prototype.hasOwnProperty.call(row, field)) {
            data[field] = [];
        }
    });

    ['etapes', 'liens'].forEach(jsonField => {
        if (data[jsonField] && typeof data[jsonField] === 'string') {
            try {
                if (data[jsonField].trim().startsWith('[')) {
                    const distinctJson = data[jsonField].replace(/'/g, '"');
                    data[jsonField] = JSON.parse(distinctJson);
                }
            } catch (e) {
                console.warn(`Failed to parse JSON for ${jsonField}`, e.message);
                data[jsonField] = null;
            }
        }
    });

    if (data.est_urgent) data.est_urgent = data.est_urgent === 'true';
    if (data.accessibilite_pmr) data.accessibilite_pmr = data.accessibilite_pmr === 'true';
    if (data.is_pro_enabled) data.is_pro_enabled = data.is_pro_enabled === 'true';

    return data;
}

// Usage: node scripts/import-csv.js <type> <path>
const args = process.argv.slice(2);
if (args.length >= 2) {
    importCsv(args[0], args[1])
        .catch(err => console.error(err));
} else {
    console.log('Usage: node scripts/import-csv.js <type: aide|demarche|structure|dispositif> <path/to/file.csv>');
}
