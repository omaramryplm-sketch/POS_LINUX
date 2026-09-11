import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Generando Sugerencias de Precios de Competencia ---');
  
  const products: any[] = await prisma.producto.findMany();
  if (products.length < 5) return;

  const competitors = ['Walmart', 'Soriana', 'Chedraui', 'Bodega Aurrera'];
  await prisma.sugerenciaPrecio.deleteMany();

  for (let i = 0; i < 5; i++) {
    const p = products[i];
    const competitor = competitors[Math.floor(Math.random() * competitors.length)];
    const diff = (Math.random() * 4) - 2;
    const competitorPrice = Number(p.precio_venta) + diff;

    const data: any = {
      id_producto: p.id,
      precio_actual: p.precio_venta,
      precio_sugerido: Math.round(competitorPrice * 2) / 2,
      competencia_referencia: competitor,
      estado: 'PENDIENTE'
    };

    await prisma.sugerenciaPrecio.create({ data });
  }

  console.log('--- ¡Sugerencias Creadas! ---');
}

main().finally(() => prisma.$disconnect());
