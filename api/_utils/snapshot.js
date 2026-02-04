import prisma from './prisma.js';

/**
 * Creates a version snapshot of an entity before update.
 * @param {string} type - Entity type (Aide, Demarche, Structure, Actualite)
 * @param {string} id - Entity ID
 * @param {string} actorEmail - Email of the person making the change
 */
export async function createSnapshot(type, id, actorEmail) {
    try {
        const modelName = type.toLowerCase();
        const entity = await prisma[modelName].findUnique({
            where: { id: String(id) }
        });

        if (!entity) return;

        await prisma.entityVersion.create({
            data: {
                entity_type: type,
                entity_id: String(id),
                snapshot_json: entity,
                actor_email: actorEmail,
                reason: 'Auto-snapshot before update'
            }
        });
    } catch (e) {
        console.error(`Failed to create snapshot for ${type}:${id}`, e);
    }
}

/**
 * Restores an entity to a previous version.
 * @param {string} versionId - The ID of the version to restore
 * @param {string} actorEmail - Email of the person restoring
 */
export async function restoreVersion(versionId, actorEmail) {
    const version = await prisma.entityVersion.findUnique({
        where: { id: versionId }
    });

    if (!version) throw new Error('Version not found');

    const modelName = version.entity_type.toLowerCase();

    // Create a snapshot of the CURRENT state before rolling back
    await createSnapshot(version.entity_type, version.entity_id, actorEmail);

    // Restore the data
    const restored = await prisma[modelName].update({
        where: { id: version.entity_id },
        data: version.snapshot_json
    });

    return restored;
}
