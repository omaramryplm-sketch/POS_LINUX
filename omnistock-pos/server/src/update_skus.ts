import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const updates = [
    { desc: 'Coca Cola', sku: '7501055300075' },
    { desc: 'Sprite', sku: '7501055304721' },
    { desc: 'Fanta', sku: '7501055303779' },
    { desc: 'Topo Chico', sku: '7501055310883' }
  ];

  for (const u of updates) {
    const res = await prisma.producto.updateMany({
      where: { descripcion: { contains: u.desc } },
      data: { sku: u.sku }
    });
    console.log(`Actualizado: ${u.desc} (${res.count} registros)`);
  }

  console.log('--- Base de Datos Sincronizada con Códigos REALES ---');
}

main().finally(() => prisma.$disconnect());
