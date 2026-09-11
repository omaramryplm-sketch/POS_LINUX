
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProduct() {
  const p = await prisma.producto.findFirst({
    where: { descripcion: { contains: 'Cheetos' } }
  });
  console.log(JSON.stringify(p, null, 2));
  process.exit(0);
}

checkProduct();
