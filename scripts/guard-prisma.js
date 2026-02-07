import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

console.log('🛡️  Checking for direct PrismaClient instantiation...');

try {
    // Grep for "new PrismaClient" in api/ directory and src/ directory
    // Exclude api/_utils/prisma.js

    // Using `grep` directly in execSync.
    // If grep finds something, it prints it and returns 0.
    // If grep finds nothing, it returns 1.

    // Using simple grep, ignoring error if not found (returns 1)
    let result = '';
    try {
        result = execSync('grep -r "new PrismaClient" api src --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" --exclude-dir=node_modules', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
    } catch (e) {
        // grep returns 1 if no matches found
        if (e.status === 1) {
            result = '';
        } else {
            throw e;
        }
    }

    const lines = result.split('\n').filter(line => line.trim() !== '');
    const violations = lines.filter(line => {
        // Exclude the singleton definition file itself
        if (line.includes('api/_utils/prisma.js')) return false;
        // Exclude comments if possible? Minimal regex check? 
        // Detailed check: valid code line "new PrismaClient"
        if (line.match(/\/\/.*new PrismaClient/)) return false; // Simple comment check
        return true;
    });

    if (violations.length > 0) {
        console.error('❌ Direct PrismaClient instantiation detected in the following files:');
        violations.forEach(v => console.error(v));
        console.error('\n👉 Please use the singleton from api/_utils/prisma.js instead.');
        process.exit(1);
    }

    console.log('✅ No direct PrismaClient instantiation found. Singleton usage enforced.');

} catch (error) {
    console.error('❌ Error executing guard script:', error);
    process.exit(1);
}
