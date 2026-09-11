import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const products = [
    { 
      sku: 'GR001', 
      descripcion: 'Salchicha Chimez', 
      categoria: 'Salchichonería', 
      precio_costo: 70, 
      precio_venta: 95, 
      unidad: 'kg', 
      stock_actual: 10, 
      stock_minimo: 2 
    },
    { 
      sku: 'GR002', 
      descripcion: 'Jamón D\'Hector', 
      categoria: 'Salchichonería', 
      precio_costo: 90, 
      precio_venta: 125, 
      unidad: 'kg', 
      stock_actual: 8, 
      stock_minimo: 1 
    }
  ];

  for (const p of products) {
    await prisma.producto.upsert({
      where: { sku: p.sku },
      update: p,
      create: p
    });
  }

  console.log('--- Productos a GRANEL (KG) Listos en Inventario ---');
}

main().finally(() => prisma.$disconnect());
