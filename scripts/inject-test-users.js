import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('Password123!', 10);
  
  // 1. Pro User
  let structure = await prisma.structure.findFirst();
  
  try {
      await prisma.proUser.upsert({
        where: { structureId_email: { structureId: structure.id, email: 'testpro@accesdirectaide.fr' } },
        update: { password_hash: password, role: 'STRUCTURE_ADMIN', status: 'active' },
        create: { email: 'testpro@accesdirectaide.fr', password_hash: password, role: 'STRUCTURE_ADMIN', status: 'active', structureId: structure.id }
      });
      console.log("Pro user injected");
  } catch(e) { console.error("Could not create pro user", e); }

  // 2. Admin User
  try {
      await prisma.adminUser.upsert({
        where: { email: 'testadmin@accesdirectaide.fr' },
        update: { password: password, role: 'admin' },
        create: { email: 'testadmin@accesdirectaide.fr', password: password, role: 'admin' }
      });
      console.log("Admin user injected");
  } catch(e) { console.error("Could not create admin user", e); }

  console.log("Test PRO and Admin injected!");
}
main().catch(console.error).finally(() => prisma.$disconnect());
