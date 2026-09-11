import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function restore() {
  const adminPass = await argon2.hash('admin123');
  
  const admin = await prisma.usuario.upsert({
    where: { username: 'admin' },
    update: {
      password: adminPass,
      rol: 'ADMIN',
      nombre_completo: 'Administrador Principal'
    },
    create: {
      username: 'admin',
      password: adminPass,
      nombre_completo: 'Administrador Principal',
      rol: 'ADMIN'
    }
  });

  console.log('ADMIN RESTAURADO:', admin.username);
  process.exit(0);
}

restore().catch(err => {
  console.error(err);
  process.exit(1);
});
