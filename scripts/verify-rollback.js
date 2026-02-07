import prisma from '../api/_utils/prisma.js';



async function verifyRollback() {
    console.log('🚀 Starting Rollback Verification...');

    try {
        // 1. Create a test aide
        console.log('📝 Creating test aide...');
        const aide = await prisma.aide.create({
            data: {
                titre: "Version 1: Titre Original",
                slug: "test-rollback-" + Date.now(),
                statut: "publie",
                summary_falc: "Résumé version 1",
                categorie: "budget"
            }
        });

        // 2. Perform an "Update" (Simulating API behavior)
        // We manually create the snapshot as the API would
        console.log('📸 Creating snapshot for Version 1...');
        await prisma.entityVersion.create({
            data: {
                entity_type: 'Aide',
                entity_id: aide.id,
                snapshot_json: aide,
                actor_email: 'test@admin.fr',
                reason: 'Verification test'
            }
        });

        // Update the aide to Version 2
        console.log('✏️ Updating to Version 2...');
        await prisma.aide.update({
            where: { id: aide.id },
            data: { titre: "Version 2: Titre Modifié" }
        });

        // 3. Verify snapshot exists
        const version = await prisma.entityVersion.findFirst({
            where: { entity_id: aide.id },
            orderBy: { createdAt: 'desc' }
        });

        if (version && version.snapshot_json.titre === "Version 1: Titre Original") {
            console.log('✅ Snapshot correctly saved original state.');
        } else {
            throw new Error('Snapshot failed');
        }

        // 4. Perform Rollback
        console.log('⏪ Performing Rollback to Version 1...');
        await prisma.aide.update({
            where: { id: aide.id },
            data: version.snapshot_json
        });

        const restored = await prisma.aide.findUnique({
            where: { id: aide.id }
        });

        if (restored.titre === "Version 1: Titre Original") {
            console.log('✅ Rollback successful! Data restored.');
        } else {
            throw new Error('Rollback failed');
        }

        // Cleanup
        await prisma.entityVersion.deleteMany({ where: { entity_id: aide.id } });
        await prisma.aide.delete({ where: { id: aide.id } });

        console.log('🎉 Rollback Verification complete!');
    } catch (e) {
        console.error('❌ Rollback Verification failed:', e.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

verifyRollback();
