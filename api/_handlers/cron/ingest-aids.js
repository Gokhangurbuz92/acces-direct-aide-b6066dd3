import { isCronAuthorized } from '../../_utils/cronAuth.js';
import crypto from 'crypto';
import { logger } from '../../lib/logger.js';
import * as Sentry from '@sentry/node';
import { runIngestion } from '../../lib/ingestion-pipeline.js';

export async function runIngestAids({ limit, runId, wipe = false, sources = 'all', dryRun = false }) {
    if (!runId) runId = crypto.randomUUID();

    logger.info('INGEST_AIDS_START', { runId, wipe, limit, sources, dryRun });

    try {
        // Use new ingestion pipeline
        const stats = await runIngestion({
            sources,
            dryRun
        });

        return stats;
    } catch (error) {
        logger.error('INGEST_AIDS_ERROR', { runId, error });
        throw error;
    }
}

export default async function handler(req, res) {
    if (!isCronAuthorized(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const wipe = req.query.wipe === 'true';
    const sources = req.query.sources || 'all';
    const dryRun = req.query.dryRun === 'true';
    const runId = crypto.randomUUID();

    try {
        const stats = await runIngestAids({ limit, runId, wipe, sources, dryRun });
        return res.status(200).json(stats);
    } catch (error) {
        logger.error('Ingest Aids Handler Error', { runId, error });
        Sentry.captureException(error, { extra: { runId } });
        return res.status(500).json({ error: error.message });
    }
}
