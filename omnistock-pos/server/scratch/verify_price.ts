import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function verify() {
  const product = await prisma.producto.findFirst({
    where: { descripcion: 'Producto Abarrotes 3' }
  });

  if (product) {
    console.log(`Product: ${product.descripcion}`);
    console.log(`SKU: ${product.sku}`);
    console.log(`Current Price in DB: $${product.precio_venta}`);
  } else {
    console.log('Product not found');
  }

  await prisma.$disconnect();
}

verify();
