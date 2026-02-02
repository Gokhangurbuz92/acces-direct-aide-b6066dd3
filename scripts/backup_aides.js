
import prisma from '../api/_utils/prisma.js';
import fs from 'fs';
import path from 'path';

async function backup() {
    try {
        console.log('Starting backup of Aide table...');
        const aides = await prisma.aide.findMany();
        const backupPath = path.join(process.cwd(), 'proofs', `aide_backup_${Date.now()}.json`);

        // Ensure proofs dir exists
        if (!fs.existsSync(path.join(process.cwd(), 'proofs'))) {
            fs.mkdirSync(path.join(process.cwd(), 'proofs'));
        }

        fs.writeFileSync(backupPath, JSON.stringify(aides, null, 2));
        console.log(`Backup successful! Saved ${aides.length} items to ${backupPath}`);
    } catch (e) {
        console.error('Backup failed:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

backup();
