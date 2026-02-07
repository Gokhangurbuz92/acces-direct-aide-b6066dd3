#!/usr/bin/env node

/**
 * Script pour vérifier les extensions PostgreSQL installées
 */

const { Client } = require('pg');

const DATABASE_URL = 'postgresql://neondb_owner:npg_xXADTwi7o4RC@ep-summer-cloud-ag14ucwz.c-2.eu-central-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require';

async function checkExtensions() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('✅ Connexion réussie!\n');

    // Vérifier les extensions installées
    console.log('📋 Extensions PostgreSQL installées:');
    const extensions = await client.query(`
      SELECT extname, extversion
      FROM pg_extension
      ORDER BY extname;
    `);

    extensions.rows.forEach(ext => {
      console.log(`   - ${ext.extname} (version ${ext.extversion})`);
    });

    // Vérifier si unaccent existe
    const hasUnaccent = extensions.rows.some(ext => ext.extname === 'unaccent');
    console.log(`\n${hasUnaccent ? '✅' : '❌'} Extension unaccent: ${hasUnaccent ? 'INSTALLÉE' : 'NON INSTALLÉE'}`);

    // Vérifier si search_vector existe dans les tables
    console.log('\n📋 Vérification de la colonne search_vector:');
    const tables = ['Aide', 'Structure', 'Demarche'];

    for (const table of tables) {
      const result = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = $1 AND column_name = 'search_vector';
      `, [table]);

      const hasSearchVector = result.rows.length > 0;
      console.log(`   ${hasSearchVector ? '✅' : '❌'} ${table}.search_vector: ${hasSearchVector ? 'EXISTE' : 'N\'EXISTE PAS'}`);
    }

    // Tester une requête simple
    console.log('\n🧪 Test d\'une requête simple sur Demarche:');
    try {
      const test = await client.query(`
        SELECT id, titre, statut
        FROM "Demarche"
        WHERE statut = 'publie'
        LIMIT 3;
      `);
      console.log(`   ✅ Requête réussie: ${test.rows.length} résultats`);
      test.rows.forEach(row => {
        console.log(`      - ${row.titre} (${row.statut})`);
      });
    } catch (err) {
      console.log(`   ❌ Erreur: ${err.message}`);
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkExtensions();
