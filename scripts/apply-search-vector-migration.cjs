#!/usr/bin/env node

/**
 * Script pour appliquer la migration search_vector
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.POSTGRES_URL_NON_POOLING || 'postgresql://neondb_owner:npg_xXADTwi7o4RC@ep-summer-cloud-ag14ucwz.c-2.eu-central-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require';

async function applyMigration() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('✅ Connexion réussie!\n');

    // Lire le fichier SQL
    const sqlPath = path.join(__dirname, 'add-search-vector.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 Application de la migration search_vector...\n');

    // Exécuter la migration
    await client.query(sql);

    console.log('✅ Migration appliquée avec succès!\n');

    // Vérifier les résultats
    console.log('📊 Vérification des résultats:');
    const verification = await client.query(`
      SELECT 
        'Aide' as table_name,
        COUNT(*) as total_rows,
        COUNT(search_vector) as rows_with_search_vector
      FROM "Aide"
      UNION ALL
      SELECT 
        'Demarche' as table_name,
        COUNT(*) as total_rows,
        COUNT(search_vector) as rows_with_search_vector
      FROM "Demarche"
      UNION ALL
      SELECT 
        'Structure' as table_name,
        COUNT(*) as total_rows,
        COUNT(search_vector) as rows_with_search_vector
      FROM "Structure";
    `);

    console.log('\n📋 Résultats:');
    verification.rows.forEach(row => {
      const percentage = row.total_rows > 0 
        ? ((row.rows_with_search_vector / row.total_rows) * 100).toFixed(1)
        : 0;
      console.log(`   ${row.table_name}: ${row.rows_with_search_vector}/${row.total_rows} (${percentage}%)`);
    });

    console.log('\n✅ Migration terminée avec succès!');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    console.error('Détails:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
