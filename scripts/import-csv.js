import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import slugify from '@sindresorhus/slugify';

const prisma = new PrismaClient();

async function importCsv(type, filePath) {
    console.log(`📂 Importing ${type} from ${filePath}...`);

    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
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

            // Map and cleanup data based on type
            const data = mapData(type, row);

            if (type === 'aide') {
                await prisma.aide.upsert({
                    where: { slug: data.slug },
                    update: data,
                    create: data
                });
            } else if (type === 'demarche') {
                await prisma.demarche.upsert({
                    where: { slug: data.slug },
                    update: data,
                    create: data
                });
            } else if (type === 'structure') {
                await prisma.structure.upsert({
                    where: { slug: data.slug },
                    update: data,
                    create: data
                });
            } else if (type === 'dispositif') {
                await prisma.dispositif.upsert({
                    where: { slug: data.slug },
                    update: data,
                    create: data
                });
            }

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

    // Auto-generate slug if missing
    if (!data.slug && data.titre) data.slug = slugify(data.titre);
    if (!data.slug && data.nom) data.slug = slugify(data.nom);

    // Handle arrays (separated by |)
    const arrayFields = ['territoires', 'departements', 'audiences', 'situations_vie', 'documents_necessaires', 'mots_cles', 'services', 'publics_accueillis', 'categories_aidees', 'public'];
    arrayFields.forEach(field => {
        if (data[field]) {
            data[field] = data[field].split('|').map(s => s.trim()).filter(Boolean);
        } else if (Object.prototype.hasOwnProperty.call(row, field)) {
            data[field] = [];
        }
    });

    // Handle JSON (etapes, liens)
    ['etapes', 'liens'].forEach(jsonField => {
        if (data[jsonField] && typeof data[jsonField] === 'string') {
            try {
                // If it looks like JSON
                if (data[jsonField].trim().startsWith('[')) {
                    // Hack: Allow single quotes in CSV for JSON to avoid escaping hell
                    const distinctJson = data[jsonField].replace(/'/g, '"');
                    data[jsonField] = JSON.parse(distinctJson);
                }
            } catch (e) {
                console.warn(`Failed to parse JSON for ${jsonField}`, e.message);
                data[jsonField] = null;
            }
        }
    });

    // Handle Booleans
    if (data.est_urgent) data.est_urgent = data.est_urgent === 'true';
    if (data.accessibilite_pmr) data.accessibilite_pmr = data.accessibilite_pmr === 'true';
    if (data.is_pro_enabled) data.is_pro_enabled = data.is_pro_enabled === 'true';

    return data;
}

// Usage: node scripts/import-csv.js <type> <path>
const args = process.argv.slice(2);
if (args.length >= 2) {
    importCsv(args[0], args[1])
        .catch(err => console.error(err))
        .finally(() => prisma.$disconnect());
} else {
    console.log('Usage: node scripts/import-csv.js <type: aide|demarche|structure|dispositif> <path/to/file.csv>');
}
