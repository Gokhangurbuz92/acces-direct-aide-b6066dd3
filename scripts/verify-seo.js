import { getCanonicalBaseUrl, isIndexable, PRODUCTION_DOMAIN } from '../api/_utils/seo.js';

console.log('Running SEO Logic Verification...');

const tests = [
    {
        name: 'Production Domain',
        headers: { host: PRODUCTION_DOMAIN },
        expectedUrl: `https://${PRODUCTION_DOMAIN}`,
        expectedIndexable: true
    },
    {
        name: 'Vercel Preview',
        headers: { host: 'my-app-git-branch.vercel.app' },
        expectedUrl: `https://${PRODUCTION_DOMAIN}`,
        expectedIndexable: false
    },
    {
        name: 'Staging Domain (Custom)',
        headers: { host: 'staging.accesdirectaide.fr' },
        expectedUrl: `https://${PRODUCTION_DOMAIN}`,
        expectedIndexable: false
    },
    {
        name: 'Localhost',
        headers: { host: 'localhost:3000' },
        expectedUrl: `https://${PRODUCTION_DOMAIN}`,
        expectedIndexable: false
    },
    {
        name: 'Naked Domain (accesdirectaide.fr)',
        headers: { host: 'accesdirectaide.fr' },
        expectedUrl: `https://${PRODUCTION_DOMAIN}`,
        expectedIndexable: false // Strict check expects www, which is correct as we want to canonize to www and not index the naked domain separately (it should redirect)
    },
    {
        name: 'X-Forwarded-Host Priority',
        headers: { 'x-forwarded-host': PRODUCTION_DOMAIN, host: 'vercel-internal.com' },
        expectedUrl: `https://${PRODUCTION_DOMAIN}`,
        expectedIndexable: true
    }
];

let failed = false;

tests.forEach(test => {
    const req = { headers: test.headers };
    const url = getCanonicalBaseUrl(req);
    const indexable = isIndexable(req);

    const urlMatch = url === test.expectedUrl;
    const indexMatch = indexable === test.expectedIndexable;

    if (urlMatch && indexMatch) {
        console.log(`[PASS] ${test.name}`);
    } else {
        console.error(`[FAIL] ${test.name}`);
        if (!urlMatch) console.error(`  URL: Expected ${test.expectedUrl}, got ${url}`);
        if (!indexMatch) console.error(`  Indexable: Expected ${test.expectedIndexable}, got ${indexable}`);
        failed = true;
    }
});

if (failed) {
    console.error('\nVerification FAILED');
    process.exit(1);
} else {
    console.log('\nVerification PASSED');
    process.exit(0);
}
