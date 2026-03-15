import { storage } from '../api/lib/storage.js';
import backupHandler from '../api/_handlers/cron/backup-db.js';

async function runTest() {
    console.log('--- STARTING BACKUP E2E TEST ---');

    // 1. Mock Request/Response for the Vercel Handler
    const mockReq = {
        headers: {
            authorization: `Bearer ${process.env.CRON_SECRET}`
        }
    };
    
    let responseData = null;
    let statusCode = null;

    const mockRes = {
        status: (code) => {
            statusCode = code;
            return {
                json: (data) => {
                    responseData = data;
                }
            };
        }
    };

    console.log('1. Triggering API Handler...');
    await backupHandler(mockReq, mockRes);

    if (statusCode !== 200) {
        console.error('❌ API Failed:', responseData);
        process.exit(1);
    }

    console.log(`✅ API Success. File saved as: ${responseData.filename}`);
    console.log(`Reported Size: ${responseData.sizeMB} MB`);

    // 2. Download and Verify
    console.log(`2. Downloading file from Cloud Storage to RAM...`);
    
    try {
        const buffer = await storage.download(responseData.filename);
        const jsonContent = JSON.parse(buffer.toString('utf-8'));

        console.log(`✅ Download and Parse successful!`);
        
        // Assertions
        const hasAides = Array.isArray(jsonContent?.data?.aides);
        const hasLogs = Array.isArray(jsonContent?.data?.conversationLogs);

        if (!hasAides || !hasLogs) {
            console.error('❌ Payload corruption error: Missing expected array data keys');
            process.exit(1);
        }

        console.log(`✅ Integrity Verification Passed: Found ${jsonContent.data.aides.length} aides and ${jsonContent.data.conversationLogs.length} logs!`);

        // 3. Cleanup Test Object
        console.log(`3. Destroying test object from Cloud Storage...`);
        await storage.delete(responseData.filename);
        console.log(`✅ Object deleted.`);
        
        console.log('--- BACKUP E2E TEST COMPLETED SUCCESSFULLY ---');

    } catch (e) {
        console.error('❌ Download/Verification Error:', e);
        process.exit(1);
    }
}

runTest();
