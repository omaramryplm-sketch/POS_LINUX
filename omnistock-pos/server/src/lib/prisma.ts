import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Optimización nativa de SQLite para alta concurrencia en POS
export const initSqlite = async () => {
  try {
    await prisma.$queryRawUnsafe(`PRAGMA journal_mode = WAL;`);
    await prisma.$queryRawUnsafe(`PRAGMA busy_timeout = 5000;`);
    await prisma.$queryRawUnsafe(`PRAGMA synchronous = NORMAL;`);
    console.log('[SQLite] Configurado en modo WAL y timeout 5000ms.');
  } catch (error) {
    console.error('Error configurando PRAGMAs en SQLite:', error);
  }
};

export default prisma;

