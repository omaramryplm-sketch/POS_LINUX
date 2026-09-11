import { PrismaClient } from '@prisma/client';
import { subDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Generando Datos Aleatorios Reales para la Semana ---');
  
  const products: any[] = await prisma.producto.findMany();
  const adminUser: any = await prisma.usuario.findFirst({ where: { rol: 'ADMIN' } });

  if (!adminUser || products.length === 0) return;

  // Borramos ventas previas para limpiar la gráfica
  await prisma.detalleVenta.deleteMany();
  await prisma.venta.deleteMany();

  for (let i = 0; i < 7; i++) {
    const targetDate = subDays(new Date(), i);
    
    // Generamos volumen diferente según el día (Simulando fin de semana fuerte)
    const isWeekend = targetDate.getDay() === 0 || targetDate.getDay() === 6;
    const numSales = isWeekend ? (Math.floor(Math.random() * 20) + 40) : (Math.floor(Math.random() * 15) + 10);
    
    console.log(`Día ${targetDate.toLocaleDateString()}: Creando ${numSales} ventas...`);

    for (let j = 0; j < numSales; j++) {
      const numItems = Math.floor(Math.random() * 4) + 1;
      let totalSale = 0;
      const saleItems = [];

      for (let k = 0; k < numItems; k++) {
        const p = products[Math.floor(Math.random() * products.length)];
        const qty = Math.floor(Math.random() * 3) + 1;
        const subtotal = Number(p.precio_venta) * qty;
        totalSale += subtotal;
        saleItems.push({
          id_producto: p.id,
          cantidad: qty,
          precio_unitario: p.precio_venta,
          subtotal: subtotal
        });
      }

      await prisma.venta.create({
        data: {
          fecha: targetDate,
          total: totalSale,
          id_usuario: adminUser.id,
          detalles: {
            create: saleItems
          }
        }
      });
    }
  }

  console.log('--- ¡Inyección de Datos Reales Completa! ---');
}

main().finally(() => prisma.$disconnect());
