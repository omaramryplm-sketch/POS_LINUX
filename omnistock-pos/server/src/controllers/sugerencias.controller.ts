import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getPendingSugerencias = async (req: Request, res: Response): Promise<void> => {
  try {
    const sugerencias = await prisma.sugerenciaPrecio.findMany({
      where: { estado: 'PENDIENTE' },
      include: {
        producto: true
      },
      orderBy: { fecha: 'desc' }
    });

    res.json({ status: 'success', data: sugerencias });
  } catch (error) {
    const errorId = `ERR-GET-SUG-${Date.now()}`;
    res.status(500).json({ status: 'error', message: 'Internal server error', errorId });
  }
};

export const updateSugerencia = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { estado } = req.body; // 'APROBADA' or 'RECHAZADA'

    if (estado !== 'APROBADA' && estado !== 'RECHAZADA') {
      res.status(400).json({ message: 'Invalid state' });
      return;
    }

    const sugerencia = await prisma.sugerenciaPrecio.findUnique({
      where: { id: Number(id) },
      include: { producto: true }
    });

    if (!sugerencia) {
      res.status(404).json({ message: 'Sugerencia not found' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update Sugerencia state
      await tx.sugerenciaPrecio.update({
        where: { id: Number(id) },
        data: { estado }
      });

      // 2. If approved, update product price
      if (estado === 'APROBADA') {
        await tx.producto.update({
          where: { id: sugerencia.id_producto },
          data: { precio_venta: sugerencia.precio_sugerido }
        });
      }
    });

    res.json({ status: 'success', message: `Sugerencia ${estado.toLowerCase()} successfully` });
  } catch (error) {
    const errorId = `ERR-UPDATE-SUG-${Date.now()}`;
    res.status(500).json({ status: 'error', message: 'Internal server error', errorId });
  }
};
