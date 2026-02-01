import { searchAidesSchema } from './api/_utils/validators.js';

console.log("--- Reproduction: Testing Non-UUID ID in Search Schema ---");

const legacyId = "rec123456789"; // Not a UUID
const payload = { id: legacyId };

const result = searchAidesSchema.safeParse(payload);

if (!result.success) {
    console.log("✅ BUG REPRODUCED: Validation failed for non-UUID ID.");
    console.log("Error details:", JSON.stringify(result.error.format(), null, 2));
    process.exit(0); // Success means we reproduced the bug
} else {
    console.log("❌ BUG NOT REPRODUCED: Validation succeeded.");
    console.log("Parsed data:", result.data);
    process.exit(1);
}
