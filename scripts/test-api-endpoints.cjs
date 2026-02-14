#!/usr/bin/env node

/**
 * Script pour tester les endpoints API localement
 */

const http = require('http');

// Démarrer le serveur de développement en arrière-plan
const { spawn } = require('child_process');

console.log('🚀 Démarrage du serveur de développement...\n');

const server = spawn('npm', ['run', 'dev'], {
  stdio: 'pipe',
  shell: true
});

server.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(output);
  
  if (output.includes('Local:') || output.includes('localhost')) {
    setTimeout(runTests, 2000); // Attendre 2 secondes après le démarrage
  }
});

server.stderr.on('data', (data) => {
  console.error(data.toString());
});

async function testEndpoint(path, description) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5173,
      path: path,
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const status = res.statusCode;
        const icon = status === 200 ? '✅' : status === 400 ? '⚠️' : '❌';
        console.log(`${icon} ${description}: ${status}`);
        
        if (status !== 200 && data) {
          try {
            const json = JSON.parse(data);
            console.log(`   Erreur: ${json.error || JSON.stringify(json)}`);
          } catch {
            console.log(`   Réponse: ${data.substring(0, 100)}`);
          }
        }
        
        resolve({ status, data });
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${description}: Erreur de connexion`);
      console.log(`   ${error.message}`);
      resolve({ status: 0, error: error.message });
    });

    req.setTimeout(5000, () => {
      console.log(`⏱️ ${description}: Timeout`);
      req.destroy();
      resolve({ status: 0, error: 'Timeout' });
    });

    req.end();
  });
}

async function runTests() {
  console.log('\n📋 Test des endpoints API:\n');

  const tests = [
    { path: '/api/demarches', desc: 'GET /api/demarches (liste)' },
    { path: '/api/demarches?limit=5', desc: 'GET /api/demarches?limit=5' },
    { path: '/api/structures', desc: 'GET /api/structures (liste)' },
    { path: '/api/structures?limit=5', desc: 'GET /api/structures?limit=5' },
    { path: '/api/actualites', desc: 'GET /api/actualites (liste)' },
    { path: '/api/actualites?limit=5', desc: 'GET /api/actualites?limit=5' },
    { path: '/api/aides', desc: 'GET /api/aides (liste)' },
    { path: '/api/aides?limit=5', desc: 'GET /api/aides?limit=5' },
  ];

  for (const test of tests) {
    await testEndpoint(test.path, test.desc);
    await new Promise(resolve => setTimeout(resolve, 500)); // Pause entre les tests
  }

  console.log('\n✅ Tests terminés!\n');
  
  // Arrêter le serveur
  server.kill();
  process.exit(0);
}

// Timeout global
setTimeout(() => {
  console.log('\n⏱️ Timeout global - arrêt du serveur');
  server.kill();
  process.exit(1);
}, 30000);
