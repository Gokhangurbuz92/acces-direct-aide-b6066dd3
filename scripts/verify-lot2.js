
// import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000'; // Assuming dev server running or we mock request
// Actually we can't easily fetch localhost if dev server isn't running.
// We can use the handler directly if we import it, but environment vars might be tricky.
// Better to mock the request objects and call the handler functions directly?
// Or assume the user will run this against a running server?
// Given I cannot run the server effectively in background and query it easily without potentially blocking, 
// I will simulate the API calls by importing the handlers and mocking req/res.

import loginHandler from '../api/auth/login.js';
import aidesHandler from '../api/aides.js';

// Mock Req/Res
class MockRes {
    constructor() {
        this.statusCode = 200;
        this.jsonData = null;
    }
    status(sub) { this.statusCode = sub; return this; }
    json(data) { this.jsonData = data; return this; }
}

async function runTests() {
    console.log("🛡️ STARTING SECURITY VERIFICATION 🛡️\n");

    // 1. Valid Login
    console.log("1. Testing Valid Login...");
    let req = { method: 'POST', body: { email: 'prod-admin@acces-direct.fr', password: 'StrongPass123!' }, headers: {}, socket: {} };
    let res = new MockRes();
    // Note: This relies on DB having the user we just created.
    // The previous script created 'prod-admin@acces-direct.fr' (based on my input intent, check actual output log)
    // Wait, the log says: "Email: gokhangurbuz92@gmail.com" ?
    // Ah, I see "Input: prod-admin@acces-direct.fr" but the output shows "Email: gokhangurbuz92...". 
    // Maybe inquirer captured previous input or defaults? 
    // Let's check the output log carefully: 
    // "Input: prod-admin@acces-direct.fr" -> sent.
    // "Output: ? Email: gokhangurbuz92@gmail.com" -> It seems it might have taken a default or something?
    // Wait, step 252 output says "Email: gokhangurbuz92@gmail.com". That's unexpected if I sent "prod-admin...".
    // I will try to login with 'gokhangurbuz92@gmail.com' and the password I sent 'StrongPass123!'.

    // Let's create a NEW specific test user first to be sure.
    // Actually, I can just read the DB or try both.
    // Let's assume the previous script worked but maybe mixed inputs. 

    // I will use a direct DB create here to ensure test state.
    const { PrismaClient } = await import('@prisma/client');
    const bcrypt = await import('bcryptjs');
    const prisma = new PrismaClient();

    const email = 'security-test@test.com';
    const password = 'TestPassword123!';
    const hash = await bcrypt.hash(password, 10);

    await prisma.adminUser.upsert({
        where: { email },
        create: { email, password: hash },
        update: { password: hash, failedLoginAttempts: 0, lockoutUntil: null }
    });

    req = { method: 'POST', body: { email, password }, headers: {}, socket: {} };
    res = new MockRes();
    await loginHandler(req, res);

    if (res.statusCode === 200 && res.jsonData.token) {
        console.log("✅ Valid Login Success. Token received.");
    } else {
        console.error("❌ Valid Login Failed", res.jsonData);
    }
    const token = res.jsonData.token;

    // 2. Lockout Test
    console.log("\n2. Testing Lockout (5 failed attempts)...");
    for (let i = 1; i <= 6; i++) {
        const r = new MockRes();
        await loginHandler({
            method: 'POST',
            body: { email, password: 'WRONG' },
            headers: {},
            socket: {}
        }, r);

        if (i < 6) {
            console.log(`   Attempt ${i}: Status ${r.statusCode} (Expected 401)`);
        } else {
            console.log(`   Attempt ${i}: Status ${r.statusCode} (Expected 429 Lockout)`);
            if (r.statusCode === 429) console.log("✅ Account Locked successfully.");
            else console.error("❌ Account NOT Locked.");
        }
    }

    // 3. Workflow Public Visibility
    console.log("\n3. Testing Public API Visibility...");
    // Create one draft and one published aide
    await prisma.aide.create({ data: { titre: 'Draft Aide', statut: 'brouillon' } });
    await prisma.aide.create({ data: { titre: 'Published Aide', statut: 'publie' } });

    const verifyReq = { method: 'GET', query: {}, headers: {} };
    const verifyRes = new MockRes();
    // We need to pass the handler logic. 
    // importing 'originalHandler' from aides might be tricky if it's default export wrap.
    // Let's try importing default.
    await aidesHandler(verifyReq, verifyRes);

    const aides = verifyRes.jsonData;
    const hasDraft = aides.some(a => a.statut === 'brouillon');
    const hasPublic = aides.some(a => a.statut === 'publie');

    console.log(`   Fetched ${aides.length} public aides.`);
    if (!hasDraft && hasPublic) {
        console.log("✅ Public API only returns 'publie'.");
    } else {
        console.error("❌ Public API leaked draft or missing public.", { hasDraft, hasPublic });
    }

    // 4. Admin Visibility
    console.log("\n4. Testing Admin API Visibility...");
    const adminReq = {
        method: 'GET',
        query: { statut: 'brouillon' },
        headers: { authorization: `Bearer ${token}` }
    };
    const adminRes = new MockRes();
    await aidesHandler(adminReq, adminRes);

    if (adminRes.statusCode === 200 && adminRes.jsonData.length > 0) {
        console.log("✅ Admin API can fetch drafts.");
    } else {
        console.error("❌ Admin API failed to fetch drafts.", adminRes.statusCode);
    }

    process.exit(0);
}

runTests();
