const fs = require('fs');
const { execSync } = require('child_process');

function fixAuthPath(file) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  content = content.replace(/api\/lib\/pro-auth\.js/g, 'api/_utils/auth.js');
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Fixed auth import in ' + file);
  }
}

const files = execSync('find tests -type f -name "*.js" -o -name "*.ts"').toString().split('\n').filter(Boolean);
files.forEach(fixAuthPath);

// Fix api.test.js Prisma mock
const apiTestFile = 'tests/integration/api.test.js';
if (fs.existsSync(apiTestFile)) {
    let apiTest = fs.readFileSync(apiTestFile, 'utf8');
    apiTest = apiTest.replace(/return mPrisma/g, 'return db');
    fs.writeFileSync(apiTestFile, apiTest);
    console.log('Fixed mPrisma reference in ' + apiTestFile);
}
