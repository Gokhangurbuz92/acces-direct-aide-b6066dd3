import bcrypt from 'bcryptjs';
import { db } from '../src/db/index.js';
import * as schema from '../src/db/schema.js';

async function main() {
  const password = await bcrypt.hash('Password123!', 10);

  // 1. Pro User
  const [structure] = await db.query.Structure.findMany({ limit: 1 });

  try {
    await db.insert(schema.ProUser).values({
      email: 'testpro@accesdirectaide.fr',
      password_hash: password,
      role: 'STRUCTURE_ADMIN',
      status: 'active',
      structureId: structure.id,
    }).onConflictDoNothing();
    console.log("Pro user injected");
  } catch (e) { console.error("Could not create pro user", e); }

  // 2. Admin User
  try {
    await db.insert(schema.AdminUser).values({
      email: 'testadmin@accesdirectaide.fr',
      password: password,
      role: 'admin',
    }).onConflictDoNothing();
    console.log("Admin user injected");
  } catch (e) { console.error("Could not create admin user", e); }

  console.log("Test PRO and Admin injected!");
}
main().catch(console.error);
