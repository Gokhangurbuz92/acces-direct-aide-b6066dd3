import { PrismaClient } from '@prisma/client';
import Busboy from 'busboy';
import { parse } from 'csv-parse/sync';
import { verifyAdmin } from '../../_utils/auth.js';

const prisma = new PrismaClient();

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!verifyAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

    const busboy = Busboy({ headers: req.headers });
    let fileBuffer = null;
    let entityType = null;

    return new Promise((resolve) => {
        busboy.on('field', (fieldname, val) => {
            if (fieldname === 'entity') entityType = val;
        });

        busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
            if (fieldname === 'file') {
                 const chunks = [];
                 file.on('data', (data) => chunks.push(data));
                 file.on('end', () => {
                     fileBuffer = Buffer.concat(chunks);
                 });
            } else {
                file.resume();
            }
        });

        busboy.on('finish', async () => {
            if (!fileBuffer || !entityType) {
                res.status(400).json({ error: 'File and entity field required' });
                return resolve();
            }

            const modelName = entityType.toLowerCase();
            const model = prisma[modelName];
            if (!model) {
                res.status(400).json({ error: 'Invalid entity type' });
                return resolve();
            }

            try {
                const records = parse(fileBuffer, {
                    columns: true,
                    skip_empty_lines: true,
                    trim: true
                });

                const report = { total: records.length, created: 0, updated: 0, errors: [] };

                for (const [index, row] of records.entries()) {
                    try {
                        const data = { ...row };

                        // Cleanup and Type Conversion
                        Object.keys(data).forEach(k => {
                            if (data[k] === '') data[k] = null;
                        });

                        // Basic Type Inference
                        if (data.quality_score) data.quality_score = parseInt(data.quality_score);
                        if (data.est_urgent) data.est_urgent = data.est_urgent === 'true';
                        if (data.mots_cles && typeof data.mots_cles === 'string') data.mots_cles = data.mots_cles.split(',').map(s=>s.trim());
                        if (data.documents_necessaires && typeof data.documents_necessaires === 'string') data.documents_necessaires = data.documents_necessaires.split(',').map(s=>s.trim());

                        data.updatedBy = 'admin-import';

                        const where = {};
                        if (data.id) where.id = data.id;
                        else if (data.slug) where.slug = data.slug;

                        if (where.id || where.slug) {
                             const exists = await model.findFirst({ where });
                             if (exists) {
                                 delete data.id;
                                 await model.update({ where: { id: exists.id }, data });
                                 report.updated++;
                             } else {
                                 await model.create({ data });
                                 report.created++;
                             }
                        } else {
                             await model.create({ data });
                             report.created++;
                        }

                    } catch (e) {
                        report.errors.push({ row: index + 1, error: e.message });
                    }
                }

                res.status(200).json(report);
                resolve();

            } catch (e) {
                res.status(500).json({ error: 'CSV Parsing failed', details: e.message });
                resolve();
            }
        });

        req.pipe(busboy);
    });
}
