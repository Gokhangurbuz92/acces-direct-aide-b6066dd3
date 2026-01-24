import handler from '../api/_handlers/cron/ingest-aids.js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Mock request and response objects
const mockReq = {
    query: {
        // Ensure CRON_SECRET is loaded from your .env file
        secret: process.env.CRON_SECRET
    }
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
