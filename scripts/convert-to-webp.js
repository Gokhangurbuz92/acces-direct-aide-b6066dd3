/**
 * convert-to-webp.js
 * Automatise la conversion des images JPG/PNG vers WebP.
 * Nécessite la dépendance 'sharp' : npm install sharp --save-dev
 *
 * Usage: node scripts/convert-to-webp.js
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Directories to scan for images
const SCAN_DIRS = [
  path.resolve(__dirname, '../public/brand'),
];

const TARGET_EXTENSIONS = ['.png', '.jpg', '.jpeg'];

// Files to skip (OG images must stay PNG for social media crawlers)
const SKIP_FILES = ['og-image.png', 'og-default.png'];

let converted = 0;
let skipped = 0;
let errors = 0;

async function walkAndConvert(directory) {
  if (!fs.existsSync(directory)) {
    console.log(`⏭️  Répertoire inexistant, ignoré : ${directory}`);
    return;
  }

  const files = fs.readdirSync(directory);

  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      await walkAndConvert(fullPath);
    } else if (TARGET_EXTENSIONS.includes(path.extname(file).toLowerCase())) {
      if (SKIP_FILES.includes(file)) {
        console.log(`⏭️  Fichier OG protégé, ignoré : ${file}`);
        skipped++;
        continue;
      }

      const outputName = file.replace(/\.(png|jpg|jpeg)$/i, '.webp');
      const outputPath = path.join(directory, outputName);

      // Skip if WebP already exists
      if (fs.existsSync(outputPath)) {
        console.log(`⏭️  WebP déjà existant : ${outputName}`);
        skipped++;
        continue;
      }

      const sizeBefore = (stat.size / 1024).toFixed(1);

      try {
        await sharp(fullPath)
          .webp({ quality: 80 })
          .toFile(outputPath);

        const outputStat = fs.statSync(outputPath);
        const sizeAfter = (outputStat.size / 1024).toFixed(1);
        const reduction = (100 - (outputStat.size / stat.size * 100)).toFixed(0);

        console.log(`✅ ${file} (${sizeBefore} KB) → ${outputName} (${sizeAfter} KB) [-${reduction}%]`);
        converted++;
      } catch (err) {
        console.error(`❌ Erreur sur ${file}:`, err.message);
        errors++;
      }
    }
  }
}

console.log('🎨 Démarrage de l\'optimisation des images (WebP)...\n');

for (const dir of SCAN_DIRS) {
  console.log(`📁 Scan : ${path.relative(path.resolve(__dirname, '..'), dir)}`);
  await walkAndConvert(dir);
  console.log('');
}

console.log('─'.repeat(50));
console.log(`✨ Optimisation terminée : ${converted} convertis, ${skipped} ignorés, ${errors} erreurs.`);
