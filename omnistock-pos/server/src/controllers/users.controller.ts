import { Request, Response } from 'express';
import * as argon2 from 'argon2';
import prisma from '../lib/prisma.js';

// Helper to map User DTO
const mapToUserDTO = (u: any) => ({
  id: u.id,
  username: u.username,
  nombre_completo: u.nombre_completo,
  rol: u.rol,
  activo: u.activo
});

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.usuario.findMany({
      select: {
        id: true,
        nombre_completo: true,
        username: true,
        rol: true,
        activo: true
      }
    });
    res.json({ status: 'success', data: users.map(mapToUserDTO) });
  } catch (err) {
    const errorId = `ERR-UGET-${Date.now()}`;
    console.error(`[${errorId}] getUsers error:`, err);
    res.status(500).json({ status: 'error', code: 'INTERNAL_ERROR', error_id: errorId });
  }
};

export const createUser = async (req: Request, res: Response) => {
  const errorId = `ERR-UCRE-${Date.now()}`;
  try {
    const { nombre_completo, nombre_usuario, password, rol } = req.body;

    const existing = await prisma.usuario.findUnique({ where: { username: nombre_usuario } });
    if (existing) return res.status(400).json({ status: 'error', code: 'USER_EXISTS' });

    const hashedPassword = await argon2.hash(password);

    const user = await prisma.usuario.create({
      data: {
        nombre_completo,
        username: nombre_usuario,
        password: hashedPassword,
        rol
      }
    });

    res.status(201).json({ status: 'success', data: mapToUserDTO(user) });
  } catch (err) {
    console.error(`[${errorId}] createUser error:`, err);
    res.status(500).json({ status: 'error', code: 'INTERNAL_ERROR', error_id: errorId });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const errorId = `ERR-UUPD-${Date.now()}`;
  try {
    const id = req.params.id as string;
    const { nombre_completo, password, rol, activo } = req.body;

    const data: any = {};
    if (nombre_completo !== undefined) data.nombre_completo = nombre_completo;
    if (rol !== undefined) data.rol = rol;
    if (activo !== undefined) data.activo = Boolean(activo);
    if (password) {
      data.password = await argon2.hash(password);
    }

    const user = await prisma.usuario.update({
      where: { id },
      data
    });

    res.json({ status: 'success', data: mapToUserDTO(user) });
  } catch (err) {
    console.error(`[${errorId}] updateUser error:`, err);
    res.status(500).json({ status: 'error', code: 'INTERNAL_ERROR', error_id: errorId });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const errorId = `ERR-UDEL-${Date.now()}`;
  try {
    const id = req.params.id as string;
    
    // Prevent deleting self
    if ((req as any).user?.id === id) {
      return res.status(400).json({ status: 'error', code: 'SELF_DELETE_DENIED' });
    }

    await prisma.usuario.delete({ where: { id } });
    res.json({ status: 'success', message: 'User deleted' });
  } catch (err) {
    console.error(`[${errorId}] deleteUser error:`, err);
    res.status(500).json({ status: 'error', code: 'INTERNAL_ERROR', error_id: errorId });
  }
};
