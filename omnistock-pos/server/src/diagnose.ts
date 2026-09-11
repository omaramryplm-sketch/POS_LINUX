import prisma from './lib/prisma.js';

async function diagnose() {
  try {
    const admin = await prisma.usuario.findUnique({
      where: { username: 'admin' }
    });
    
    if (admin) {
      console.log('--- DIAGNÓSTICO DE CABLES ---');
      console.log('USUARIO ADMIN: ENCONTRADO');
      console.log('ROL:', admin.rol);
      console.log('ESTADO: ACTIVO');
      console.log('---------------------------');
    } else {
      console.log('ERROR: Usuario admin NO encontrado en la base de datos.');
    }
    process.exit(0);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('ERROR DE CONEXIÓN:', message);
    process.exit(1);
  }
}

diagnose();
