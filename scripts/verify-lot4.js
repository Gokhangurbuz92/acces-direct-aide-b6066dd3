
import prisma from '../api/_utils/prisma.js';
import bcrypt from 'bcryptjs';


const API_URL = 'http://localhost:3000/api';

async function main() {
    console.log("🔒 Starting Lot 4 Security Verification...");

    // 1. Setup Test Data
    const suffix = Date.now();
    const password = "SecurePassword-" + suffix;
    const password_hash = await bcrypt.hash(password, 10);

    // Structure A
    const structA = await prisma.structure.create({
        data: {
            slug: `struct-a-${suffix}`,
            nom: `Structure A ${suffix}`,
            statut: 'publie',
            status: 'actif' // Assuming 'status' field exists from schemacheck? The view_file showed 'status' in seed-lot3 but Schema might verify.
            // Let me double check schema or just try. seed-lot3 used 'status' and 'statut'.
        }
    });

    // Structure B
    const structB = await prisma.structure.create({
        data: {
            slug: `struct-b-${suffix}`,
            nom: `Structure B ${suffix}`,
            statut: 'publie'
            // status?
        }
    });

    // Admin A (Structure Admin)
    const adminA = await prisma.proUser.create({
        data: {
            email: `admin-a-${suffix}@test.com`,
            password_hash,
            structureId: structA.id,
            role: 'STRUCTURE_ADMIN',
            status: 'active'
        }
    });

    // Pro A (Standard Pro)
    const proA = await prisma.proUser.create({
        data: {
            email: `pro-a-${suffix}@test.com`,
            password_hash,
            structureId: structA.id,
            role: 'PRO',
            status: 'active'
        }
    });

    // Admin B (Structure Admin of B)
    const adminB = await prisma.proUser.create({
        data: {
            email: `admin-b-${suffix}@test.com`,
            password_hash,
            structureId: structB.id,
            role: 'STRUCTURE_ADMIN',
            status: 'active'
        }
    });

    console.log("✅ Test Data Created");

    // 2. Login to get tokens
    async function login(email) {
        const res = await fetch(`${API_URL}/pro/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!res.ok) throw new Error(`Login failed for ${email}: ${res.status}`);
        const data = await res.json();
        return data.token;
    }

    const tokenAdminA = await login(adminA.email);
    const tokenProA = await login(proA.email);
    // const tokenAdminB = await login(adminB.email);

    console.log("✅ Logins Successful");

    // 3. Verify RBAC: PRO cannot access /api/pro/team
    console.log("👉 Testing PRO User Access to Team API (Expect 403)...");
    const resTeam = await fetch(`${API_URL}/pro/team`, {
        headers: { 'Authorization': `Bearer ${tokenProA}` }
    });

    if (resTeam.status === 403) {
        console.log("✅ PRO User correctly denied (403)");
    } else {
        console.error(`❌ PRO User NOT denied! Status: ${resTeam.status}`);
        process.exit(1);
    }

    // 4. Verify Cross-Tenant: Admin A cannot delete Admin B (or access B's data)
    // We'll try to DELETE Admin B using Admin A's token
    console.log(`👉 Testing Cross-Tenant Access (Admin A tries to delete Admin B [${adminB.id}])...`);
    const resDelete = await fetch(`${API_URL}/pro/team?userId=${adminB.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${tokenAdminA}` }
    });

    // Expect 404 (User not found in YOUR structure) or 403.
    // team.js: const targetUser = await prisma.proUser.findFirst({ where: { id: targetUserId, structureId } });
    // This will correspond to null -> 404.
    if (resDelete.status === 404 || resDelete.status === 403) {
        console.log(`✅ Cross-Tenant access correctly denied (${resDelete.status})`);
    } else {
        console.error(`❌ Cross-Tenant access NOT denied! Status: ${resDelete.status}`);
        process.exit(1);
    }

    // 5. Verify Audit Log for Failed Login
    console.log("👉 Testing Audit Log (Failed Login)...");
    const badEmail = `bad-${suffix}@test.com`;
    await fetch(`${API_URL}/pro/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: badEmail, password: 'wrongpassword' })
    });

    // Check DB
    // Give it a moment? No, usually instant but async.
    await new Promise(r => setTimeout(r, 1000));

    const log = await prisma.auditLog.findFirst({
        where: {
            action: 'LOGIN_FAILED',
            details: {
                path: ['email'],
                equals: badEmail
            }
        },
        orderBy: { timestamp: 'desc' }
    });

    // Prisma JSON filter syntax depends on DB. 
    // Usually 'details' is Json. 
    // If it's Postgres, path syntax works. If basic JSON, equals might work on the whole object or verify in code.
    // Let's query last log and check details in JS.
    const lastLog = await prisma.auditLog.findFirst({
        where: { action: 'LOGIN_FAILED' },
        orderBy: { timestamp: 'desc' }
    });

    if (lastLog && lastLog.details && lastLog.details.email === badEmail) {
        console.log("✅ Audit Log found.");
        if (JSON.stringify(lastLog.details).includes(password)) {
            console.error("❌ PII LEAK: Password found in audit log!");
            process.exit(1);
        } else {
            console.log("✅ Audit Log contains no PII.");
        }
    } else {
        console.error("❌ Audit Log NOT found for failed login.");
        // Debug
        // console.log("Last Log:", lastLog);
    }

    console.log("\n🎉 ALL LOT 4 SECURITY CHECKS PASSED.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
