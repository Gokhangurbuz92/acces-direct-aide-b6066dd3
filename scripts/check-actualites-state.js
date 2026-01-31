import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  try {
    const count = await prisma.actualite.count();
    console.log(`Actualites count: ${count}`);
    
    const rssCount = await prisma.rssSource.count();
    console.log(`RSS Sources count: ${rssCount}`);
    
    if (rssCount > 0) {
      const sources = await prisma.rssSource.findMany();
      console.log('RSS Sources:', JSON.stringify(sources, null, 2));
    }
    
    if (count > 0) {
      const sample = await prisma.actualite.findMany({ take: 2 });
      console.log('Sample Actualites:', JSON.stringify(sample, null, 2));
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
