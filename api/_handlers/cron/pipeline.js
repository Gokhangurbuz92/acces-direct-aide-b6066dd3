// api/_handlers/cron/pipeline.js
/* global process */
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import Pipeline from '../../ingest/Pipeline.js';
import NationalAidesConnector from '../../ingest/connectors/NationalAidesConnector.js';
import AlsaceStructuresConnector from '../../ingest/connectors/AlsaceStructuresConnector.js';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    // 1. Authorization
    if (!process.env.CRON_SECRET) {
        console.error("CRITICAL: CRON_SECRET environment variable is not defined.");
        return res.status(500).json({ error: 'Server configuration error' });
    }

    // Hybrid Auth Support
    let isAuthorized = false;

    // A. Query Param (Legacy)
    const secretQuery = req.query?.secret || new URL(req.url, `http://${req.headers.host}`).searchParams.get('secret');
    if (secretQuery === process.env.CRON_SECRET) isAuthorized = true;

    // B. Header (Standard)
    const authHeader = req.headers['authorization'];
    if (authHeader === `Bearer ${process.env.CRON_SECRET}`) isAuthorized = true;

    // C. Vercel Cron
    const vercelCronHeader = req.headers['x-vercel-cron'];
    if (vercelCronHeader === '1') isAuthorized = true;

    if (!isAuthorized) {
        console.warn("Unauthorized Pipeline Attempt");
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const runId = crypto.randomUUID();
    const globalStats = {
        runs: [],
        total_created: 0,
        total_updated: 0,
        errors: []
    };

    try {
        // --- PILOT 1: National Aides ---
        const natConnector = new NationalAidesConnector();
        const natPipeline = new Pipeline(natConnector.getName(), natConnector);
        const natStats = await natPipeline.run();
        globalStats.runs.push({ source: natConnector.getName(), stats: natStats });
        globalStats.total_created += natStats.created;
        globalStats.total_updated += natStats.updated;

        // --- PILOT 2: Alsace Structures ---
        const alsConnector = new AlsaceStructuresConnector();
        const alsPipeline = new Pipeline(alsConnector.getName(), alsConnector);
        const alsStats = await alsPipeline.run();
        globalStats.runs.push({ source: alsConnector.getName(), stats: alsStats });
        globalStats.total_created += alsStats.created;
        globalStats.total_updated += alsStats.updated;

        // Log global run success (optional, individual runs are already logged by Pipeline)

    } catch (globalErr) {
        console.error("Global Pipeline Error:", globalErr);
        return res.status(500).json({ error: globalErr.message });
    }

    return res.status(200).json(globalStats);
}
