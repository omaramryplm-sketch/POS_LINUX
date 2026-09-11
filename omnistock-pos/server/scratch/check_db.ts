import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const products = await prisma.producto.findMany({ take: 5 });
  console.log(JSON.stringify(products, null, 2));
  const counts = await prisma.producto.groupBy({
    by: ['categoria'],
    _count: { _all: true }
  });
  console.log('Categories count:', counts);
}

check();
