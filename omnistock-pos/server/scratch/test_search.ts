import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testSearch() {
  const q = 'Bebidas';
  const products = await prisma.producto.findMany({
    where: {
      OR: [
        { sku: { contains: String(q) } },
        { descripcion: { contains: String(q) } },
        { categoria: { contains: String(q) } }
      ]
    }
  });
  console.log(`Found ${products.length} products for query "${q}"`);
}

testSearch();
