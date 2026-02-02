
import prisma from '../api/_utils/prisma.js';
import { generateAttachmentToken, encrypt, encryptBuffer, hash } from '../api/lib/crypto.js';
import { storage } from '../api/lib/storage.js';
import downloadHandler from '../api/_handlers/download.js';



async function mockRequestResponse(handler, req) {
    let responseData = null;
    let statusCode = 200;
    let headers = {};

    const res = {
        status: (code) => { statusCode = code; return res; },
        json: (data) => { responseData = data; return res; },
        send: (data) => { responseData = data; return res; },
        setHeader: (k, v) => { headers[k] = v; },
    };

    await handler(req, res);
    return { statusCode, responseData, headers };
}

async function run() {
    console.log("Starting Messaging Verification...");

    // 1. Setup Data
    const structure = await prisma.structure.create({
        data: { nom: "Test Structure Msg", email: `test-msg-${Date.now()}@test.com` }
    });

    const proUser = await prisma.proUser.create({
        data: {
            email: `pro-msg-${Date.now()}@test.com`,
            password_hash: "hash",
            role: "admin",
            structureId: structure.id
        }
    });

    const service = await prisma.service.create({
        data: { structureId: structure.id, slug: `service-msg-${Date.now()}`, name: "Service Msg" }
    });

    const beneficiary = await prisma.beneficiary.create({
        data: { contact_encrypted: "enc", contact_hash: "hash" }
    });

    const appointment = await prisma.appointment.create({
        data: {
            structureId: structure.id,
            serviceId: service.id,
            proId: proUser.id,
            beneficiaryId: beneficiary.id,
            start_at: new Date(),
            end_at: new Date(),
            mode: "onsite",
            access_token_hash: hash("my-secret-token")
        }
    });

    console.log("✅ Data setup complete");

    // 2. Create Message & Attachment manually
    const fileContent = Buffer.from("Secret Content");
    const encryptedFile = encryptBuffer(fileContent);
    const storageKey = await storage.upload(encryptedFile, "text/plain");

    const message = await prisma.message.create({
        data: {
            appointmentId: appointment.id,
            sender: 'PRO',
            content_encrypted: encrypt("Hello"),
            attachments: {
                create: {
                    filename_encrypted: encrypt("secret.txt"),
                    mime_type: "text/plain",
                    size_bytes: fileContent.length,
                    storage_key: storageKey
                }
            }
        },
        include: { attachments: true }
    });

    const attachmentId = message.attachments[0].id;
    console.log("✅ Message & Attachment created");

    // 3. Test Download - Happy Path
    const validToken = generateAttachmentToken(attachmentId);
    const res1 = await mockRequestResponse(downloadHandler, {
        method: 'GET',
        query: { token: validToken }
    });

    if (res1.statusCode !== 200) {
        console.error("❌ Download Happy Path Failed. Status:", res1.statusCode, res1.responseData);
        process.exit(1);
    }
    if (!res1.responseData.equals(fileContent)) {
         console.error("❌ Download Content Mismatch");
         process.exit(1);
    }
    console.log("✅ Download Happy Path OK");

    // 4. Test Download - Invalid Token
    const res2 = await mockRequestResponse(downloadHandler, {
        method: 'GET',
        query: { token: "invalid.token" }
    });

    // Expect 403 because verification returns null
    if (res2.statusCode !== 403) {
        console.error("❌ Download Invalid Token Failed (Expected 403). Got:", res2.statusCode);
        process.exit(1);
    }
    console.log("✅ Download Invalid Token OK");

    // 5. Test Download - Tampered Token
    const parts = validToken.split('.');
    const tampered = parts[0] + '.tamperedSig';
    const res3 = await mockRequestResponse(downloadHandler, {
        method: 'GET',
        query: { token: tampered }
    });

    if (res3.statusCode !== 403) {
        console.error("❌ Download Tampered Token Failed (Expected 403). Got:", res3.statusCode);
        process.exit(1);
    }
    console.log("✅ Download Tampered Token OK");

    // 6. Test Download - Random Attachment ID (Valid Token but non-existent or belonging to another?)
    // Note: generateAttachmentToken takes an ID. If I generate a token for a random UUID, it is a valid token, but attachment lookup fails (404).
    const randomToken = generateAttachmentToken("00000000-0000-0000-0000-000000000000");
    const res4 = await mockRequestResponse(downloadHandler, {
        method: 'GET',
        query: { token: randomToken }
    });

    if (res4.statusCode !== 404) {
         console.error("❌ Download Non-existent Attachment Failed (Expected 404). Got:", res4.statusCode);
         process.exit(1);
    }
    console.log("✅ Download Non-existent Attachment OK");

    // Cleanup
    await storage.delete(storageKey);
    // await prisma.structure.delete({ where: { id: structure.id } }); // Cascades
    console.log("✅ Cleanup OK");
    console.log("🎉 All Tests Passed!");
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
