
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seedLastWeek() {
  console.log('🌱 Sembrando ventas para el 27 de abril...');
  
  const targetDate = new Date('2026-04-27T12:00:00Z');
  const productos = await prisma.producto.findMany({ take: 5 });
  const admin = await prisma.usuario.findFirst({ where: { rol: 'ADMIN' } });

  if (productos.length === 0 || !admin) return;

  const firstProd: any = productos[0];
  const adminId: any = admin.id;

  for (let i = 0; i < 10; i++) {
    const total = Math.floor(Math.random() * (2500 - 500 + 1)) + 500;
    
    await (prisma as any).venta.create({
      data: {
        fecha: new Date(targetDate.getTime() + (i * 3600000)),
        total,
        estado: 'COMPLETA',
        id_usuario: adminId,
        detalles: {
          create: [
            {
              id_producto: firstProd.id,
              cantidad: 2,
              precio_unitario: total / 2,
              subtotal: total
            }
          ]
        }
      }
    });
  }

  console.log('✅ Ventas del 27 de abril creadas con éxito.');
}

seedLastWeek()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
