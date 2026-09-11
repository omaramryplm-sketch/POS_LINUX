const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const count = await prisma.usuario.count();
    const users = await prisma.usuario.findMany({ select: { username: true, rol: true } });
    console.log('Total usuarios en BD:', count);
    console.log('Lista:', JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
