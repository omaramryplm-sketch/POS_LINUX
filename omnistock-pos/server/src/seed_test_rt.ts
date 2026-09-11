import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const products: any[] = await prisma.producto.findMany({ 
    take: 10,
    skip: 5
  });

  for (const p of products) {
    await prisma.sugerenciaPrecio.create({
      data: {
        id_producto: p.id,
        precio_actual: p.precio_venta,
        precio_sugerido: Number(p.precio_venta) + 1.20,
        competencia_referencia: 'TEST REALTIME',
        estado: 'PENDIENTE'
      }
    });
  }

  console.log('--- 10 Sugerencias creadas para la prueba de 5 segundos ---');
}

main().finally(() => prisma.$disconnect());
