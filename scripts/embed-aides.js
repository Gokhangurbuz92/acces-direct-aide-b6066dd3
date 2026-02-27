#!/usr/bin/env node

/**
 * embed-aides.js
 *
 * Backfill script: generates embeddings for all Aides that don't have one yet.
 * Uses Gemini text-embedding-004 (768 dimensions) and writes vectors via raw SQL.
 *
 * Usage:
 *   GEMINI_API_KEY=xxx node scripts/embed-aides.js
 *
 * Pre-requisite: pgvector extension must be enabled on the database:
 *   CREATE EXTENSION IF NOT EXISTS vector;
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const BATCH_DELAY_MS = 250; // Delay between API calls to respect rate limits
const prisma = new PrismaClient();

async function main() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY (or GOOGLE_API_KEY) is required.');
        process.exit(1);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const embedModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

    // Ensure pgvector extension exists
    try {
        await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector');
        console.log('✅ pgvector extension ready');
    } catch (err) {
        console.error('⚠️  Could not enable pgvector extension:', err.message);
        console.error('   Make sure your PostgreSQL has pgvector installed.');
        process.exit(1);
    }

    // Find aides without embeddings via raw SQL (Prisma can't filter on Unsupported types)
    const aides = await prisma.$queryRawUnsafe(`
        SELECT id, titre, cest_quoi, pour_qui, ce_que_ca_aide, summary_falc
        FROM "Aide"
        WHERE embedding IS NULL
        ORDER BY "updatedAt" DESC
    `);

    if (!aides.length) {
        console.log('✅ All aides already have embeddings. Nothing to do.');
        return;
    }

    console.log(`🚀 Found ${aides.length} aides without embeddings. Starting backfill...\n`);

    let success = 0;
    let failed = 0;

    for (let i = 0; i < aides.length; i++) {
        const aide = aides[i];

        // Build text to embed from real fields
        const parts = [aide.titre];
        if (aide.cest_quoi) parts.push(aide.cest_quoi);
        if (aide.pour_qui) parts.push(aide.pour_qui);
        if (aide.ce_que_ca_aide) parts.push(aide.ce_que_ca_aide);
        if (aide.summary_falc) parts.push(aide.summary_falc);
        const textToEmbed = parts.join('\n');

        try {
            const result = await embedModel.embedContent(textToEmbed);
            const vector = result.embedding.values;
            const vectorStr = `[${vector.join(',')}]`;

            await prisma.$executeRawUnsafe(
                `UPDATE "Aide" SET embedding = $1::vector WHERE id = $2`,
                vectorStr,
                aide.id
            );

            success++;
            const pct = ((i + 1) / aides.length * 100).toFixed(0);
            process.stdout.write(`\r  [${pct}%] ${success} indexed, ${failed} failed — ${aide.titre.slice(0, 50)}`);

            // Rate limit delay
            await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
        } catch (err) {
            failed++;
            console.error(`\n  ❌ Failed: ${aide.titre} — ${err.message}`);

            // If rate limited, wait longer
            if (err.message?.includes('429') || err.message?.includes('quota')) {
                console.warn('  ⏳ Rate limited. Waiting 60s...');
                await new Promise(r => setTimeout(r, 60_000));
                i--; // Retry this aide
            }
        }
    }

    console.log(`\n\n🎉 Backfill complete: ${success} indexed, ${failed} failed out of ${aides.length} total.`);
}

main()
    .catch(err => {
        console.error('Fatal error:', err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
