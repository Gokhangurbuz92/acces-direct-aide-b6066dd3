#!/usr/bin/env node

/**
 * backup-db.js
 *
 * Script de sauvegarde pour Accès Direct Aide (ADA).
 * Extrait les aides (catalogue) et les logs de conversation au format JSON.
 * Conserve uniquement les 4 dernières sauvegardes (auto-nettoyage).
 *
 * Usage :
 *   node scripts/backup-db.js
 *   node scripts/backup-db.js --dir /chemin/custom
 *
 * Cron (tous les dimanches à 1h) :
 *   0 1 * * 0 cd /path/to/project && node scripts/backup-db.js >> logs/backup.log 2>&1
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse CLI args
const args = process.argv.slice(2);
const dirFlagIdx = args.indexOf('--dir');
const BACKUP_DIR = dirFlagIdx !== -1 && args[dirFlagIdx + 1]
    ? path.resolve(args[dirFlagIdx + 1])
    : path.join(__dirname, '../backups');

const MAX_BACKUPS = 4;

const prisma = new PrismaClient();

async function runBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `ada-backup-${timestamp}.json`;
    const filePath = path.join(BACKUP_DIR, filename);

    console.log(`[BACKUP] 🚀 Démarrage de la sauvegarde...`);
    console.log(`[BACKUP] 📂 Destination: ${BACKUP_DIR}`);

    // Ensure backup directory exists
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
        console.log(`[BACKUP] 📂 Dossier créé.`);
    }

    try {
        // 1. Catalogue d'aides (sans les embeddings — trop volumineux)
        console.log(`[BACKUP] 📖 Extraction du catalogue d'aides...`);
        // Pas de `select` explicite : Prisma retourne tous les champs scalaires.
        // Le champ `embedding` (type vector) n'est pas retourné car Unsupported.
        const aides = await prisma.aide.findMany();

        // 2. Logs de conversation
        console.log(`[BACKUP] 📖 Extraction des journaux d'échanges...`);
        const logs = await prisma.conversationLog.findMany({
            orderBy: { createdAt: 'desc' },
        });

        // 3. Build backup package
        const backupData = {
            metadata: {
                version: '1.0',
                timestamp: new Date().toISOString(),
                counts: {
                    aides: aides.length,
                    conversationLogs: logs.length,
                },
            },
            data: {
                aides,
                conversationLogs: logs,
            },
        };

        // 4. Write to disk
        fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf-8');

        const sizeMB = (fs.statSync(filePath).size / (1024 * 1024)).toFixed(2);
        console.log(`[BACKUP] ✅ Sauvegarde réussie : ${filename} (${sizeMB} MB)`);
        console.log(`[BACKUP] 📊 Résumé : ${aides.length} aides, ${logs.length} logs.`);

        // 5. Auto-cleanup
        cleanOldBackups();

    } catch (error) {
        console.error(`[BACKUP] ❌ Erreur :`, error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

/**
 * Keep only the last MAX_BACKUPS files.
 */
function cleanOldBackups() {
    try {
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.startsWith('ada-backup-') && f.endsWith('.json'))
            .map(f => ({ name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime() }))
            .sort((a, b) => b.time - a.time);

        if (files.length > MAX_BACKUPS) {
            const toDelete = files.slice(MAX_BACKUPS);
            console.log(`[BACKUP] 🧹 Nettoyage : suppression de ${toDelete.length} ancien(s) fichier(s)...`);
            for (const f of toDelete) {
                fs.unlinkSync(path.join(BACKUP_DIR, f.name));
                console.log(`[BACKUP]   🗑️ ${f.name}`);
            }
        }
    } catch (err) {
        console.warn(`[BACKUP] ⚠️ Nettoyage impossible:`, err.message);
    }
}

runBackup();
