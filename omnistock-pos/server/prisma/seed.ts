import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando configuracion de usuarios base (Sistema Limpio)...');

  const hashedAdminPassword = await argon2.hash('admin123');
  const hashedCajaPassword = await argon2.hash('caja123');

  // 1. Crear Administrador por defecto
  const admin = await prisma.usuario.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedAdminPassword,
      nombre_completo: 'Administrador Principal',
      rol: 'ADMIN',
    },
  });
  console.log(`Usuario verificado/creado: ${admin.username}`);

  // 2. Crear Cajero por defecto
  const cajero = await prisma.usuario.upsert({
    where: { username: 'caja1' },
    update: {},
    create: {
      username: 'caja1',
      password: hashedCajaPassword,
      nombre_completo: 'Caja Principal',
      rol: 'CAJERO',
    },
  });
  console.log(`Usuario verificado/creado: ${cajero.username}`);

  console.log('Base de datos inicializada correctamente sin datos de prueba.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });