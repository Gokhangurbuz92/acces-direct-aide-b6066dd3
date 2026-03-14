import { db } from '../src/db/index.js';
import { Structure, ProUser, AdminUser } from '../src/db/schema.js';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function main() {
  const password = await bcrypt.hash('Password123!', 10);

  // 1. Pro User
  const [structure] = await db.query.Structure.findMany({ limit: 1 });

  try {
      await db.insert(ProUser).values({
        email: 'testpro@accesdirectaide.fr',
        password_hash: password,
        role: 'STRUCTURE_ADMIN',
        status: 'active',
        structureId: structure.id,
      }).onConflictDoUpdate({
        target: [ProUser.structureId, ProUser.email],
        set: { password_hash: password, role: 'STRUCTURE_ADMIN', status: 'active' },
      });
      console.log("Pro user injected");
  } catch(e) { console.error("Could not create pro user", e); }

  // 2. Admin User
  try {
      await db.insert(AdminUser).values({
        email: 'testadmin@accesdirectaide.fr',
        password: password,
        role: 'admin',
      }).onConflictDoUpdate({
        target: [AdminUser.email],
        set: { password: password, role: 'admin' },
      });
      console.log("Admin user injected");
  } catch(e) { console.error("Could not create admin user", e); }

  console.log("Test PRO and Admin injected!");
}
main().catch(console.error);
