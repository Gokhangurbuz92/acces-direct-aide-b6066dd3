#!/usr/bin/env node

/**
 * Script pour vérifier les colonnes existantes dans la base de données
 */

const { Client } = require('pg');

const DATABASE_URL = 'postgresql://neondb_owner:npg_xXADTwi7o4RC@ep-summer-cloud-ag14ucwz.c-2.eu-central-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require';

async function checkColumns() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('✅ Connexion réussie!\n');

    // Vérifier les colonnes pour chaque table problématique
    const tables = ['Aide', 'Structure', 'Demarche', 'Actualite'];

    for (const table of tables) {
      console.log(`\n📋 Colonnes de la table "${table}":`);
      
      const result = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position;
      `, [table]);

      // Vérifier si updatedBy existe
      const hasUpdatedBy = result.rows.some(row => row.column_name === 'updatedBy');
      
      if (hasUpdatedBy) {
        console.log(`   ✅ updatedBy existe`);
      } else {
        console.log(`   ❌ updatedBy N'EXISTE PAS`);
      }

      // Afficher quelques colonnes importantes
      const importantColumns = result.rows.filter(row => 
        ['id', 'updatedBy', 'updatedAt', 'statut', 'titre', 'nom'].includes(row.column_name)
      );

      console.log(`   Colonnes importantes trouvées:`);
      importantColumns.forEach(col => {
        console.log(`      - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
      });

      console.log(`   Total colonnes: ${result.rows.length}`);
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkColumns();
