import inboxHandler from '../api/_handlers/admin/inbox.js';
import loginHandler from '../api/_handlers/auth/login.js';

// Mock Response
const mockRes = () => {
    const res = {};
    res.statusCode = 200;
    res.body = null;
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.body = data;
        return res;
    };
    return res;
};

async function testSecurity() {
    console.log("🔒 Testing Admin Security...");

    // Setup Env for Test
    process.env.ADMIN_TOKEN = "TEST_SECRET_TOKEN";
    process.env.ADMIN_EMAIL = "admin@test.com";
    process.env.ADMIN_PASSWORD = "password123";

    // 1. Test Unauthorized Access
    console.log("\n1. Testing Unauthorized Access (No Token)...");
    const reqNoAuth = { method: 'GET', headers: {}, query: {} };
    const resNoAuth = mockRes();
    await inboxHandler(reqNoAuth, resNoAuth);

    if (resNoAuth.statusCode === 401) {
        console.log("✅ Blocked correctly (401)");
    } else {
        console.error("❌ FAILED: Should be 401, got", resNoAuth.statusCode);
        process.exit(1);
    }

    // 2. Test Login Flow
    console.log("\n2. Testing Login Flow...");
    const reqLogin = {
        method: 'POST',
        body: { email: "admin@test.com", password: "password123" }
    };
    const resLogin = mockRes();
    await loginHandler(reqLogin, resLogin);

    if (resLogin.statusCode === 200 && resLogin.body.token === "TEST_SECRET_TOKEN") {
        console.log("✅ Login Successful, Token received");
    } else {
        console.error("❌ Login Failed", resLogin.statusCode, resLogin.body);
        process.exit(1);
    }

    // 3. Test Authorized Access
    console.log("\n3. Testing Authorized Access (With Token)...");
    const reqAuth = {
        method: 'GET',
        headers: { 'authorization': 'Bearer TEST_SECRET_TOKEN' },
        query: { page: 1 }
    };
    const resAuth = mockRes();
    await inboxHandler(reqAuth, resAuth);

    if (resAuth.statusCode === 200) {
        console.log("✅ Access Granted (200)");
    } else {
        console.error("❌ Authorized Access Failed", resAuth.statusCode, resAuth.body);
        process.exit(1);
    }

    console.log("\n🎉 Security Fix Verified!");
}

testSecurity();
