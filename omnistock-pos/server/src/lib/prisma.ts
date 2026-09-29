import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Optimización nativa de SQLite para alta concurrencia en POS
export const initSqlite = async () => {
  try {
    await prisma.$executeRawUnsafe(`PRAGMA journal_mode = WAL;`);
    await prisma.$executeRawUnsafe(`PRAGMA busy_timeout = 5000;`);
    await prisma.$executeRawUnsafe(`PRAGMA synchronous = NORMAL;`);
    console.log('✅ SQLite configurado en modo WAL y timeout 5000ms.');
  } catch (error) {
    console.error('Error configurando PRAGMAs en SQLite:', error);
  }
};

export default prisma;

