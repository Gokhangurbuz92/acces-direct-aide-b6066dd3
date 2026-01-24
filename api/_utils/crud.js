import { verifyAdmin } from './auth.js';
import { createSnapshot } from './snapshot.js';

export async function createEntity(req, res, modelDelegate) {
    if (!verifyAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const data = req.body;
        // Enforce defaults
        data.statut = 'brouillon';
        data.updatedBy = 'admin'; // TODO: Extract from token if possible

        const item = await modelDelegate.create({ data });
        return res.status(201).json(item);
    } catch (error) {
        console.error('Create Error:', error);
        return res.status(500).json({ error: 'Creation failed', details: error.message });
    }
}

export async function updateEntity(req, res, modelDelegate, entityType = null) {
    if (!verifyAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID required' });

    try {
        if (entityType) {
            // Restore snapshot functionality
            // We assume admin is 'admin@accesdirectaide.fr' for now as per auth.js
            await createSnapshot(entityType, id, 'admin@accesdirectaide.fr');
        }

        const data = req.body;
        delete data.id; // Protect ID
        data.updatedBy = 'admin';
        // updatedAt is handled by Prisma @updatedAt

        const item = await modelDelegate.update({
            where: { id: String(id) },
            data
        });
        return res.status(200).json(item);
    } catch (error) {
        console.error('Update Error:', error);
        return res.status(500).json({ error: 'Update failed', details: error.message });
    }
}

export async function deleteEntity(req, res, modelDelegate) {
    if (!verifyAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID required' });

    try {
        await modelDelegate.delete({
            where: { id: String(id) }
        });
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Delete Error:', error);
        return res.status(500).json({ error: 'Delete failed', details: error.message });
    }
}
