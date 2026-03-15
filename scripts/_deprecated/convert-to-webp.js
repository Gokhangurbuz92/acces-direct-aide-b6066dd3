/**
 * convert-to-webp.js
 * Automatise la conversion des images JPG/PNG vers WebP.
 * Nécessite la dépendance 'sharp' (déjà en devDependencies).
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Dossiers à scanner
const TARGET_DIRS = [
  path.resolve(__dirname, '../public/assets'),
  path.resolve(__dirname, '../public'),
];

const TARGET_EXTENSIONS = ['.png', '.jpg', '.jpeg'];

// Fichiers à exclure de la conversion (déjà gérés ou nécessaires en format original)
const EXCLUDE_PATTERNS = [
  'favicon',
  'apple-touch-icon',
];

async function walkAndConvert(directory, depth = 0) {
  if (!fs.existsSync(directory)) return;

  const files = fs.readdirSync(directory);

  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Ne pas descendre dans node_modules, .git, etc.
      if (['node_modules', '.git', 'dist'].includes(file)) continue;
      // Limiter la profondeur pour le dossier public/ root
      if (depth < 2) {
        await walkAndConvert(fullPath, depth + 1);
      }
    } else if (TARGET_EXTENSIONS.includes(path.extname(file).toLowerCase())) {
      // Vérifier les exclusions
      if (EXCLUDE_PATTERNS.some(p => file.toLowerCase().includes(p))) {
        console.log(`⏭️  Exclusion : ${file}`);
        continue;
      }

      const outputName = file.replace(/\.(png|jpg|jpeg)$/i, '.webp');
      const outputPath = path.join(directory, outputName);

      // Ne pas re-convertir si le WebP existe déjà
      if (fs.existsSync(outputPath)) {
        console.log(`⏭️  WebP existe déjà : ${outputName}`);
        continue;
      }

      console.log(`⚡ Conversion : ${file} → ${outputName}`);

      try {
        const info = await sharp(fullPath)
          .webp({ quality: 80 })
          .toFile(outputPath);

        const origSize = stat.size;
        const newSize = info.size;
        const reduction = Math.round((1 - newSize / origSize) * 100);
        console.log(`✅ Succès : ${outputName} (${origSize} → ${newSize} octets, -${reduction}%)`);
      } catch (err) {
        console.error(`❌ Erreur sur ${file}:`, err.message);
      }
    }
  }
}

console.log("🎨 Démarrage de l'optimisation des images (WebP)...");

for (const dir of TARGET_DIRS) {
  if (fs.existsSync(dir)) {
    console.log(`\n📂 Scan de ${path.relative(process.cwd(), dir)}/`);
    await walkAndConvert(dir);
  }
}

console.log("\n✨ Optimisation terminée.");
