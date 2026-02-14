import handler from '../api/_handlers/cron/ingest-aids.js';
import { env } from '../api/_utils/env.js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const cronSecret = env.secrets.cronSecret;
if (!cronSecret) {
    console.error("ERREUR: CRON_SECRET non trouvée dans .env");
    process.exit(1);
}

// Mock request and response objects
const mockReq = {
    headers: {
        'x-cron-secret': cronSecret
    },
    query: {}
};

const mockRes = {
    status: (code) => {
        console.log(`Response status: ${code}`);
        return {
            json: (data) => {
                console.log('Response JSON:', data);
            }
        };
    }
};

// Execute the handler
handler(mockReq, mockRes).catch(error => {
    console.error('Error executing handler:', error);
});
