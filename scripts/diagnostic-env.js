#!/usr/bin/env node
/**
 * DIAGNOSTIC ENVIRONNEMENT & BASE DE DONNÉES
 * 
 * Ce script vérifie :
 * 1. Variables d'environnement requises
 * 2. Connexion à la base de données
 * 3. Contenu de la base (counts + statuts)
 * 4. Configuration Vercel cron
 * 
 * Usage: node scripts/diagnostic-env.js
 */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// Charger les variables d'environnement
config();

const prisma = new PrismaClient();

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

// Variables d'environnement requises
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'ADA_ENCRYPTION_KEY',
  'ADMIN_TOKEN',
  'CRON_SECRET',
  'PUBLIC_BASE_URL',
  'KV_REST_API_URL',
  'KV_REST_API_TOKEN',
];

async function checkEnvironmentVariables() {
  section('1. VÉRIFICATION DES VARIABLES D\'ENVIRONNEMENT');
  
  let allPresent = true;
  const missing = [];
  const present = [];
  
  for (const varName of REQUIRED_ENV_VARS) {
    const value = process.env[varName];
    if (!value || value === '' || value.includes('your-') || value.includes('...')) {
      log(`❌ ${varName}: MANQUANT ou INVALIDE`, 'red');
      missing.push(varName);
      allPresent = false;
    } else {
      const displayValue = varName.includes('SECRET') || varName.includes('TOKEN') || varName.includes('KEY')
        ? '***' + value.slice(-4)
        : value.length > 50 
          ? value.slice(0, 30) + '...' + value.slice(-10)
          : value;
      log(`✅ ${varName}: ${displayValue}`, 'green');
      present.push(varName);
    }
  }
  
  console.log('');
  log(`Variables présentes: ${present.length}/${REQUIRED_ENV_VARS.length}`, allPresent ? 'green' : 'yellow');
  
  if (!allPresent) {
    log('\n⚠️  ATTENTION: Variables manquantes détectées', 'yellow');
    log('Ces variables doivent être configurées dans Vercel:', 'yellow');
    missing.forEach(v => log(`   - ${v}`, 'yellow'));
  }
  
  return allPresent;
}

async function checkDatabaseConnection() {
  section('2. VÉRIFICATION DE LA CONNEXION À LA BASE DE DONNÉES');
  
  try {
    await prisma.$connect();
    log('✅ Connexion à la base de données réussie', 'green');
    
    // Test simple
    const result = await prisma.$queryRaw`SELECT NOW() as current_time`;
    log(`✅ Test de requête réussi: ${result[0].current_time}`, 'green');
    
    return true;
  } catch (error) {
    log('❌ Erreur de connexion à la base de données', 'red');
    log(`   ${error.message}`, 'red');
    return false;
  }
}

async function checkDatabaseContent() {
  section('3. VÉRIFICATION DU CONTENU DE LA BASE DE DONNÉES');
  
  try {
    // Compter les aides
    const aidesTotal = await prisma.aide.count();
    const aidesPubliees = await prisma.aide.count({ where: { statut: 'publie' } });
    const aidesBrouillon = await prisma.aide.count({ where: { statut: 'brouillon' } });
    
    log(`\n📊 AIDES:`, 'blue');
    log(`   Total: ${aidesTotal}`);
    log(`   Publiées: ${aidesPubliees}`, aidesPubliees > 0 ? 'green' : 'red');
    log(`   Brouillon: ${aidesBrouillon}`, aidesBrouillon > 0 ? 'yellow' : 'reset');
    
    // Compter les structures
    const structuresTotal = await prisma.structure.count();
    const structuresPubliees = await prisma.structure.count({ where: { statut: 'publie' } });
    const structuresBrouillon = await prisma.structure.count({ where: { statut: 'brouillon' } });
    
    log(`\n📊 STRUCTURES:`, 'blue');
    log(`   Total: ${structuresTotal}`);
    log(`   Publiées: ${structuresPubliees}`, structuresPubliees > 0 ? 'green' : 'red');
    log(`   Brouillon: ${structuresBrouillon}`, structuresBrouillon > 0 ? 'yellow' : 'reset');
    
    // Compter les actualités
    const actualitesTotal = await prisma.actualite.count();
    const actualitesPubliees = await prisma.actualite.count({ where: { statut: 'publie' } });
    const actualitesBrouillon = await prisma.actualite.count({ where: { statut: 'brouillon' } });
    
    log(`\n📊 ACTUALITÉS:`, 'blue');
    log(`   Total: ${actualitesTotal}`);
    log(`   Publiées: ${actualitesPubliees}`, actualitesPubliees > 0 ? 'green' : 'red');
    log(`   Brouillon: ${actualitesBrouillon}`, actualitesBrouillon > 0 ? 'yellow' : 'reset');
    
    // Compter les démarches
    const demarchesTotal = await prisma.demarche.count();
    const demarchesPubliees = await prisma.demarche.count({ where: { statut: 'publie' } });
    
    log(`\n📊 DÉMARCHES:`, 'blue');
    log(`   Total: ${demarchesTotal}`);
    log(`   Publiées: ${demarchesPubliees}`, demarchesPubliees > 0 ? 'green' : 'red');
    
    // Diagnostic
    console.log('');
    if (aidesPubliees === 0 && structuresPubliees === 0 && actualitesPubliees === 0) {
      log('❌ PROBLÈME CRITIQUE: Aucun contenu publié détecté', 'red');
      log('   → Le site affichera des pages vides', 'red');
      log('   → Causes possibles:', 'yellow');
      log('      1. Pipeline d\'ingestion jamais exécuté', 'yellow');
      log('      2. Cron jobs Vercel non déclenchés', 'yellow');
      log('      3. Données importées en statut "brouillon"', 'yellow');
      return false;
    } else if (aidesPubliees > 0 || structuresPubliees > 0) {
      log('✅ Contenu publié détecté - le site devrait afficher des données', 'green');
      return true;
    } else {
      log('⚠️  Peu de contenu publié - vérifier le pipeline', 'yellow');
      return true;
    }
    
  } catch (error) {
    log('❌ Erreur lors de la vérification du contenu', 'red');
    log(`   ${error.message}`, 'red');
    return false;
  }
}

async function checkCronConfiguration() {
  section('4. VÉRIFICATION DE LA CONFIGURATION CRON');
  
  const cronSecret = process.env.CRON_SECRET;
  const baseUrl = process.env.PUBLIC_BASE_URL;
  
  if (!cronSecret || cronSecret.includes('your-')) {
    log('❌ CRON_SECRET non configuré', 'red');
    log('   → Les cron jobs Vercel ne pourront pas s\'exécuter', 'red');
    return false;
  }
  
  log('✅ CRON_SECRET configuré', 'green');
  
  if (baseUrl) {
    log(`\n📍 Endpoints cron configurés dans vercel.json:`, 'blue');
    log(`   - ${baseUrl}/api/cron/pipeline (toutes les heures)`);
    log(`   - ${baseUrl}/api/cron/ingest-structures (dimanche 2h)`);
    
    log(`\n💡 Pour tester manuellement:`, 'cyan');
    log(`   curl -i "${baseUrl}/api/cron/pipeline" \\`, 'cyan');
    log(`     -H "Authorization: Bearer ${cronSecret.slice(0, 10)}..."`, 'cyan');
  }
  
  return true;
}

async function generateReport() {
  section('5. RAPPORT FINAL & RECOMMANDATIONS');
  
  const envOk = await checkEnvironmentVariables();
  const dbOk = await checkDatabaseConnection();
  
  let contentOk = false;
  let cronOk = false;
  
  if (dbOk) {
    contentOk = await checkDatabaseContent();
    cronOk = await checkCronConfiguration();
  }
  
  console.log('\n' + '='.repeat(60));
  log('RÉSUMÉ DU DIAGNOSTIC', 'cyan');
  console.log('='.repeat(60));
  
  log(`\n✓ Variables d'environnement: ${envOk ? '✅ OK' : '❌ PROBLÈME'}`, envOk ? 'green' : 'red');
  log(`✓ Connexion base de données: ${dbOk ? '✅ OK' : '❌ PROBLÈME'}`, dbOk ? 'green' : 'red');
  log(`✓ Contenu publié: ${contentOk ? '✅ OK' : '❌ PROBLÈME'}`, contentOk ? 'green' : 'red');
  log(`✓ Configuration cron: ${cronOk ? '✅ OK' : '❌ PROBLÈME'}`, cronOk ? 'green' : 'red');
  
  console.log('\n' + '='.repeat(60));
  
  if (!envOk || !dbOk || !contentOk) {
    log('\n🚨 ACTIONS REQUISES:', 'red');
    
    if (!envOk) {
      log('\n1. Configurer les variables d\'environnement dans Vercel:', 'yellow');
      log('   → Vercel Dashboard > Project > Settings > Environment Variables', 'yellow');
      log('   → Ajouter les variables manquantes pour Production', 'yellow');
    }
    
    if (!contentOk && dbOk) {
      log('\n2. Déclencher le pipeline d\'ingestion:', 'yellow');
      log('   → Manuellement via curl (voir commande ci-dessus)', 'yellow');
      log('   → Ou attendre le prochain cron Vercel', 'yellow');
      log('   → Vérifier les logs Vercel pour les erreurs', 'yellow');
    }
    
    if (!dbOk) {
      log('\n3. Vérifier la connexion à la base de données:', 'yellow');
      log('   → DATABASE_URL correcte ?', 'yellow');
      log('   → Base de données accessible depuis Vercel ?', 'yellow');
    }
  } else {
    log('\n✅ TOUT EST OK - Le site devrait fonctionner correctement', 'green');
  }
  
  console.log('\n' + '='.repeat(60));
}

// Exécution principale
async function main() {
  log('\n🔍 DIAGNOSTIC ACCESDIRECTAIDE - ENVIRONNEMENT & BASE DE DONNÉES\n', 'cyan');
  log(`Date: ${new Date().toLocaleString('fr-FR')}`, 'blue');
  log(`Node: ${process.version}`, 'blue');
  log(`Environnement: ${process.env.NODE_ENV || 'development'}`, 'blue');
  
  try {
    await generateReport();
  } catch (error) {
    log('\n❌ ERREUR FATALE:', 'red');
    log(error.stack, 'red');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
