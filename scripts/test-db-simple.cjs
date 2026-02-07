const { Client } = require('pg');

// Test avec l'URL EXACTE fournie (avec espace supprimé)
const connectionString = "postgresql://neondb_owner:npg_xXADTwi7o4RC@ep-summer-cloud-ag14ucwz.c-2.eu-central-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require";

console.log('🔍 Test de connexion PostgreSQL');
console.log('URL:', connectionString.replace(/:[^:@]+@/, ':***@'));

const client = new Client({ connectionString });

client.connect()
  .then(() => {
    console.log('✅ Connexion réussie!');
    return client.query('SELECT COUNT(*) FROM "Aide"');
  })
  .then(result => {
    console.log('✅ Nombre d\'aides:', result.rows[0].count);
    return client.end();
  })
  .catch(err => {
    console.error('❌ Erreur:', err.message);
    console.error('Code:', err.code);
    process.exit(1);
  });
