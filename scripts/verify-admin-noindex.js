
import fs from 'fs';
import path from 'path';

async function verifyAdminNoIndex() {
    console.log('Checking Admin/Pro NoIndex guards...');

    const indexFile = fs.readFileSync(path.join(process.cwd(), 'src/pages/index.jsx'), 'utf8');
    const proLayoutFile = fs.readFileSync(path.join(process.cwd(), 'src/pages/pro/ProLayout.jsx'), 'utf8');

    const hasAdminNoIndex = indexFile.includes('name="robots" content="noindex, nofollow"');
    const hasProNoIndex = proLayoutFile.includes('name="robots" content="noindex, nofollow"');

    if (!hasAdminNoIndex) {
        console.error('❌ AdminRoute missing noindex meta tag in index.jsx');
    }
    if (!hasProNoIndex) {
        console.error('❌ ProLayout missing noindex meta tag');
    }

    if (hasAdminNoIndex && hasProNoIndex) {
        console.log('✅ ADMIN/PRO NOINDEX CHECK PASSED');
    } else {
        process.exit(1);
    }
}

verifyAdminNoIndex();
