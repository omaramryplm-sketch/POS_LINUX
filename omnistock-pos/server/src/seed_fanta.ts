import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const p: any = await prisma.producto.findFirst({ 
    where: { descripcion: { contains: 'Fanta' } } 
  });
  
  if(!p) {
    console.log('Fanta no encontrada');
    return;
  }

  await prisma.sugerenciaPrecio.create({
    data: {
      id_producto: p.id,
      precio_actual: p.precio_venta,
      precio_sugerido: Number(p.precio_venta) - 1.5,
      competencia_referencia: 'Soriana (Oferta)',
      estado: 'PENDIENTE'
    }
  });

  console.log('--- Sugerencia de Fanta de Naranja lista en la bandeja ---');
}

main().finally(() => prisma.$disconnect());
