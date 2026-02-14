
import aidesHandler from '../api/_handlers/aides.js';
import taxonomyHandler from '../api/_handlers/taxonomy.js';
import indexHandler from '../api/index.js';

// Mock Response
class MockRes {
    constructor() {
        this.statusCode = 200;
        this.body = null;
        this.headers = {};
    }
    status(code) {
        this.statusCode = code;
        return this;
    }
    json(data) {
        this.body = data;
        return this;
    }
    setHeader(key, value) {
        this.headers[key] = value;
        return this;
    }
}

// Mock Request
class MockReq {
    constructor(url, headers = {}, query = {}) {
        this.url = url;
        this.headers = headers;
        this.query = query;
        this.method = 'GET';
        this.socket = { remoteAddress: '127.0.0.1' };
    }
}

async function runTests() {
    console.log("Running Security Checks...");
    let passed = true;

    // 1. Test Debug Route Removal in api/index.js
    console.log("\n[Check 1] Verify Debug Route Removal...");
    try {
        const req = new MockReq('/api?debug=1', { host: 'localhost' });
        const res = new MockRes();
        // We expect this to fail with 404 or 500 (because it tries to find a handler for empty path)
        // BUT it should NOT return { pathname: ... } which was the debug response.
        try {
            await indexHandler(req, res);
        } catch {
            // Ignore execution errors, just check if it returned the debug json
        }

        if (res.body && res.body.pathname && res.body.path) {
            console.error("FAIL: Debug route is still accessible!");
            passed = false;
        } else {
            console.log("PASS: Debug route not detected.");
        }
    } catch (e) {
        console.error("Error testing debug route:", e);
    }

    // 2. Test Rate Limit on Aides (Limit: 30)
    console.log("\n[Check 2] Verify Rate Limit on Aides...");
    const ip = '1.2.3.4';
    let limited = false;
    for (let i = 0; i < 35; i++) {
        const req = new MockReq('/api/aides', { 'x-forwarded-for': ip }, { q: 'test' });
        const res = new MockRes();
        try {
            await aidesHandler(req, res);
        } catch {
            // DB errors expected
        }

        if (res.statusCode === 429) {
            if (i < 30) {
                 console.error(`FAIL: Rate limited too early at request ${i+1}`);
                 passed = false;
                 break;
            } else {
                console.log(`PASS: Rate limited correctly at request ${i+1}`);
                limited = true;
                break;
            }
        }
    }
    if (!limited) {
        console.error("FAIL: Rate limit did not trigger after 35 requests.");
        passed = false;
    }

    // 3. Test Rate Limit on Taxonomy (Limit: 60)
    console.log("\n[Check 3] Verify Rate Limit on Taxonomy...");
    const ip2 = '5.6.7.8';
    limited = false;
    // We need 61 requests
    for (let i = 0; i < 65; i++) {
        const req = new MockReq('/api/taxonomy', { 'x-forwarded-for': ip2 });
        const res = new MockRes();
        try {
            await taxonomyHandler(req, res);
        } catch {
            // DB errors expected
        }

        if (res.statusCode === 429) {
             if (i < 60) {
                 console.error(`FAIL: Rate limited too early at request ${i+1}`);
                 passed = false;
                 break;
            } else {
                console.log(`PASS: Rate limited correctly at request ${i+1}`);
                limited = true;
                break;
            }
        }
    }
    if (!limited) {
        console.error("FAIL: Rate limit did not trigger after 65 requests.");
        passed = false;
    }

    if (passed) {
        console.log("\nALL CHECKS PASSED.");
        process.exit(0);
    } else {
        console.error("\nSOME CHECKS FAILED.");
        process.exit(1);
    }
}

runTests();
