import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const products: any[] = await prisma.producto.findMany({ 
    take: 3, 
    skip: 10 // Saltamos los primeros para variar
  });
  
  for (const p of products) {
    await prisma.sugerenciaPrecio.create({
      data: {
        id_producto: p.id,
        precio_actual: p.precio_venta,
        precio_sugerido: Number(p.precio_venta) + 2.50,
        competencia_referencia: 'Walmart (Aumento)',
        estado: 'PENDIENTE'
      }
    });
  }

  console.log('--- 3 Nuevas Alertas Inyectadas ---');
}

main().finally(() => prisma.$disconnect());
