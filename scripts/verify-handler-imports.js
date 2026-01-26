
import { spawn } from 'child_process';
import path from 'path';

console.log("Verifying Handler Imports...");

// Set dummy env vars to pass runtime checks
const env = {
    ...process.env,
    ENCRYPTION_KEY: '0000000000000000000000000000000000000000000000000000000000000000', // 64 chars hex = 32 bytes
    JWT_SECRET: 'dummy-secret',
    CRON_SECRET: 'dummy-cron',
    DATABASE_URL: 'postgres://dummy:dummy@localhost:5432/dummy'
};

const child = spawn('node', ['-e', 'import("./api/routes.js").then(() => console.log("Routes loaded OK")).catch(e => { console.error(e); process.exit(1); })'], {
    env,
    stdio: 'inherit'
});

child.on('close', (code) => {
    if (code === 0) {
        console.log("✅ All handlers importable.");
    } else {
        console.error("❌ Failed to import handlers.");
        process.exit(code);
    }
});
