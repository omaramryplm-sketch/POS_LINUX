import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.sugerenciaPrecio.count({ where: { estado: 'PENDIENTE' } });
  const pending = await prisma.sugerenciaPrecio.findMany({ where: { estado: 'PENDIENTE' }, include: { producto: true } });
  console.log('Total Pendientes:', count);
  pending.forEach(s => console.log(`- ${s.producto.descripcion} ($${s.precio_sugerido})`));
}
main().finally(() => prisma.$disconnect());
