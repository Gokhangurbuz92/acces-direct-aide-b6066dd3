
import { syncAllFeeds } from '../lib/rss-service.js';

export default async function handler(req, res) {
    // Simple auth check for Vercel Cron
    const authHeader = req.headers.authorization;
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('Starting RSS sync cron job...');
    try {
        const results = await syncAllFeeds();
        res.status(200).json({
            success: true,
            timestamp: new Date().toISOString(),
            results
        });
    } catch (err) {
        console.error('RSS sync cron failed:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
}
