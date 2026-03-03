import { checkRateLimit, getClientIp, getRateLimitStatus } from '../../_utils/rateLimit.js';
import prisma from '../../_utils/prisma.js';
import { verifyAdmin } from '../../_utils/auth.js';
/**
 * @param {import('../../_utils/http-types').ApiRequest} req
 * @param {import('../../_utils/http-types').ApiResponse} res
 */

export default async function handler(req, res) {
    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit('ADMIN_API', ip);
    if (!rateLimit.allowed) {
        return res.status(getRateLimitStatus(rateLimit)).json(rateLimit.error);
    }

    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    if (!verifyAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

    const { entity } = req.query;
    const model = prisma[entity?.toLowerCase()];
    if (!model) return res.status(400).json({ error: 'Invalid entity' });

    try {
        const items = await model.findMany({
            orderBy: { updatedAt: 'desc' }
        });

        if (items.length === 0) {
             res.setHeader('Content-Type', 'text/csv');
             return res.send('');
        }

        const headers = Object.keys(items[0]);
        const csvRows = [headers.join(',')];

        for (const item of items) {
            const values = headers.map(header => {
                const val = item[header];
                if (val === null || val === undefined) return '';
                if (Array.isArray(val)) return `"${val.join(',')}"`;
                if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
                if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
                if (val instanceof Date) return val.toISOString();
                return val;
            });
            csvRows.push(values.join(','));
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${entity}-${new Date().toISOString()}.csv"`);
        res.status(200).send(csvRows.join('\n'));

    } catch (e) {
        res.status(500).json({ error: 'Export failed', details: e.message });
    }
}
