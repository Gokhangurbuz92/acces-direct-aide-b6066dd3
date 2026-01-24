
import { execSync } from 'child_process';

const run = (command, name) => {
    console.log(`\n🔹 Running ${name}...`);
    try {
        execSync(command, { stdio: 'inherit' });
        console.log(`✅ ${name} passed.`);
        return true;
    } catch (e) {
        console.error(`❌ ${name} failed.`);
        return false;
    }
};

const main = () => {
    console.log('🚀 Starting Release Gate Checklist...');

    const steps = [
        { name: 'Lint', command: 'npm run lint' },
        { name: 'Typecheck', command: 'npm run typecheck' },
        { name: 'Unit Tests', command: 'npm run test:api' },
        { name: 'E2E Tests (Vital Paths)', command: 'npx playwright test e2e/vital-paths.spec.js' },
        { name: 'Build', command: 'npm run build' }
    ];

    for (const step of steps) {
        if (!run(step.command, step.name)) {
            console.error('\n🛑 Release Gate Failed. Fix the errors above.');
            process.exit(1);
        }
    }

    console.log('\n✨ All systems go! Ready for deployment. 🚀');
};

main();
