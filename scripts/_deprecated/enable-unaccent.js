
import { db } from '../src/db/index.js';
import { sql } from 'drizzle-orm';

async function main() {
    console.log("Enabling 'unaccent' extension...");
    try {
        await db.execute(sql`CREATE EXTENSION IF NOT EXISTS unaccent;`);
        console.log("✅ Extension 'unaccent' enabled.");
    } catch (e) {
        console.error("❌ Failed to enable extension:", e.message);
    }
}

main();
