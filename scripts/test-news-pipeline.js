import { execSync } from 'child_process';

console.log('Running News Pipeline Tests...');
try {
  execSync('npx vitest run api/_handlers/cron/pipeline.test.js', { stdio: 'inherit' });
  console.log('Tests Passed!');
} catch (e) {
  console.error('Tests Failed!');
  process.exit(1);
}
