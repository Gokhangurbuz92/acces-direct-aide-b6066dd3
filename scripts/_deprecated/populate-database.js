#!/usr/bin/env node
/**
 * Master population script - runs all seeds in order
 * Usage: node --loader tsx scripts/populate-database.js
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const seeds = [
    { name: 'Taxonomy', script: 'scripts/seed-taxonomy.js' },
    { name: 'Aides', script: 'scripts/seed-minimum-aides.js' },
    { name: 'Démarches', script: 'scripts/seed-minimum-demarches.js' },
    { name: 'Structures', script: 'scripts/seed-minimum-structures.js' },
];

async function runSeed(seed) {
    console.log(`\n📦 Running ${seed.name} seed...`);
    try {
        const { stdout, stderr } = await execAsync(`node --loader tsx ${seed.script}`, {
            cwd: process.cwd(),
        });
        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);
        console.log(`✅ ${seed.name} seed complete`);
        return { name: seed.name, success: true };
    } catch (error) {
        console.error(`❌ ${seed.name} seed failed:`, error.message);
        return { name: seed.name, success: false, error: error.message };
    }
}

async function main() {
    console.log('🚀 Starting database population...\n');
    console.log('This will seed:');
    seeds.forEach((s) => console.log(`  - ${s.name}`));

    const results = [];
    for (const seed of seeds) {
        const result = await runSeed(seed);
        results.push(result);
        if (!result.success) {
            console.log('\n⚠️  Stopping due to error');
            break;
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Summary:');
    results.forEach((r) => {
        const icon = r.success ? '✅' : '❌';
        console.log(`${icon} ${r.name}: ${r.success ? 'Success' : r.error}`);
    });

    const allSuccess = results.every((r) => r.success);
    if (allSuccess) {
        console.log('\n🎉 All seeds completed successfully!');
        process.exit(0);
    } else {
        console.log('\n❌ Some seeds failed');
        process.exit(1);
    }
}

main().catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});
