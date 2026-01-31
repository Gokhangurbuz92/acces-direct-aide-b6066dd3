import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyActualites() {
    console.log('🚀 Starting Actualités System Verification...');
    console.log('');

    try {
        // 1. Check RSS Sources
        console.log('📡 Checking RSS Sources...');
        const sources = await prisma.rssSource.findMany();
        const enabledSources = sources.filter(s => s.enabled);
        
        console.log(`  Total sources: ${sources.length}`);
        console.log(`  Enabled sources: ${enabledSources.length}`);
        
        if (enabledSources.length === 0) {
            console.log('  ⚠️  No enabled RSS sources found. Run: node scripts/seed-rss-sources.js');
        } else {
            console.log('  ✅ RSS sources configured');
            enabledSources.forEach(s => {
                console.log(`    - ${s.name} (${s.trust_level})`);
            });
        }
        console.log('');

        // 2. Check Actualités count
        console.log('📊 Checking Actualités...');
        const totalCount = await prisma.actualite.count();
        const publishedCount = await prisma.actualite.count({ 
            where: { statut: 'publie' } 
        });
        
        console.log(`  Total: ${totalCount}`);
        console.log(`  Published: ${publishedCount}`);
        
        if (publishedCount === 0) {
            console.log('  ⚠️  No published actualités. Run: node scripts/trigger-rss-ingestion.js');
        } else {
            console.log('  ✅ Actualités populated');
        }
        console.log('');

        // 3. Check recent items
        if (publishedCount > 0) {
            console.log('📰 Recent Actualités:');
            const recent = await prisma.actualite.findMany({
                where: { statut: 'publie' },
                orderBy: { date_publication: 'desc' },
                take: 5,
                select: {
                    titre: true,
                    categorie: true,
                    score_fiabilite: true,
                    source_nom: true,
                    date_publication: true,
                }
            });

            recent.forEach((item, i) => {
                console.log(`  ${i + 1}. ${item.titre.substring(0, 60)}...`);
                console.log(`     Category: ${item.categorie}, Score: ${item.score_fiabilite}, Source: ${item.source_nom}`);
            });
            console.log('');
        }

        // 4. Check categories distribution
        if (publishedCount > 0) {
            console.log('📂 Category Distribution:');
            const categories = await prisma.actualite.groupBy({
                by: ['categorie'],
                where: { statut: 'publie' },
                _count: true,
            });

            categories
                .sort((a, b) => b._count - a._count)
                .forEach(cat => {
                    console.log(`  ${cat.categorie || 'null'}: ${cat._count}`);
                });
            console.log('');
        }

        // 5. Check ingestion logs
        console.log('📝 Recent Ingestion Logs:');
        const logs = await prisma.updateLog.findMany({
            where: { source_name: 'RSS_INGEST' },
            orderBy: { ran_at: 'desc' },
            take: 3,
        });

        if (logs.length === 0) {
            console.log('  No ingestion logs found');
        } else {
            logs.forEach((log, i) => {
                console.log(`  ${i + 1}. ${log.ran_at.toISOString()}`);
                console.log(`     Status: ${log.status}, Created: ${log.items_created_count}, Updated: ${log.items_updated_count}, Skipped: ${log.items_skipped_count}`);
                if (log.errors && log.errors.length > 0) {
                    console.log(`     Errors: ${log.errors.length}`);
                }
            });
        }
        console.log('');

        // 6. Verify deduplication
        console.log('🔄 Checking Deduplication...');
        const withDedupeHash = await prisma.actualite.count({
            where: { 
                dedupe_hash: { not: null },
                statut: 'publie'
            }
        });
        console.log(`  Items with dedupe_hash: ${withDedupeHash}/${publishedCount}`);
        
        if (withDedupeHash === publishedCount && publishedCount > 0) {
            console.log('  ✅ All items have deduplication hash');
        } else if (publishedCount > 0) {
            console.log('  ⚠️  Some items missing dedupe_hash');
        }
        console.log('');

        // 7. Summary
        console.log('📋 Summary:');
        console.log('─'.repeat(50));
        console.log(`  RSS Sources: ${enabledSources.length} enabled`);
        console.log(`  Actualités: ${publishedCount} published`);
        console.log(`  Ingestion Runs: ${logs.length} recent`);
        console.log('');

        if (enabledSources.length > 0 && publishedCount > 0) {
            console.log('✅ Actualités system is operational!');
        } else if (enabledSources.length === 0) {
            console.log('⚠️  Next step: Run node scripts/seed-rss-sources.js');
        } else if (publishedCount === 0) {
            console.log('⚠️  Next step: Run node scripts/trigger-rss-ingestion.js');
        }

    } catch (error) {
        console.error('❌ Verification failed:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

verifyActualites();
