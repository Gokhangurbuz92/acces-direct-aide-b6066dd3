// Simulate Rate Limit Logic Local Test
// Since we cannot easily invoke Vercel Functions locally without `vercel dev` running,
// We will test the logic by importing the utility directly.

import { checkRateLimit } from '../api/_utils/rateLimit.js';

console.log("--- Testing Rate Limit Logic (OTP_GEN) ---");

const IP = '192.168.1.1';

// Config: Limit 3
for (let i = 1; i <= 5; i++) {
    const result = checkRateLimit('OTP_GEN', IP);
    console.log(`Attempt ${i}: Allowed=${result.allowed}`);
    if (!result.allowed) {
        console.log("  -> Error (FALC):", result.error.message);
    }
}

console.log("\n--- Audit Log Check ---");
console.log("Check console output above for '[AUDIT]' warning on 4th attempt.");
