import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getProveedores = async (_req: Request, res: Response): Promise<void> => {
  try {
    const proveedores = await prisma.proveedor.findMany({
      orderBy: { nombre: 'asc' }
    });
    res.json({ status: 'success', data: proveedores });
  } catch (error) {
    const errorId = `ERR-GET-PROV-${Date.now()}`;
    res.status(500).json({ status: 'error', message: 'Internal server error', errorId });
  }
};

export const createProveedor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, contacto, telefono, email } = req.body;
    
    if (!nombre) {
      res.status(400).json({ message: 'El nombre es obligatorio' });
      return;
    }

    const newProveedor = await prisma.proveedor.create({
      data: { nombre, contacto, telefono, email }
    });

    res.status(201).json({ status: 'success', data: newProveedor });
  } catch (error) {
    const errorId = `ERR-CREATE-PROV-${Date.now()}`;
    res.status(500).json({ status: 'error', message: 'Internal server error', errorId });
  }
};

export const updateProveedor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nombre, contacto, telefono, email } = req.body;

    const updated = await prisma.proveedor.update({
      where: { id: Number(id) },
      data: { nombre, contacto, telefono, email }
    });

    res.json({ status: 'success', data: updated });
  } catch (error) {
    const errorId = `ERR-UPDATE-PROV-${Date.now()}`;
    res.status(500).json({ status: 'error', message: 'Internal server error', errorId });
  }
};

export const deleteProveedor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.proveedor.delete({
      where: { id: Number(id) }
    });
    res.json({ status: 'success', message: 'Proveedor eliminado' });
  } catch (error) {
    const errorId = `ERR-DELETE-PROV-${Date.now()}`;
    res.status(500).json({ status: 'error', message: 'Internal server error', errorId });
  }
};

export const getVisitas = async (_req: Request, res: Response): Promise<void> => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const visitas = await (prisma as any).visitaProveedor.findMany({
      where: {
        fecha_visita: {
          gte: thirtyDaysAgo
        }
      },
      include: {
        proveedor: true
      },
      orderBy: {
        fecha_visita: 'desc'
      },
      take: 50
    });
    res.json({ status: 'success', data: visitas });
  } catch (error) {
    const errorId = `ERR-GET-VISITAS-${Date.now()}`;
    res.status(500).json({ status: 'error', message: 'Internal server error', errorId });
  }
};

export const createVisita = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id_proveedor, fecha_visita, estado, notas } = req.body;
    
    if (!id_proveedor || !fecha_visita) {
      res.status(400).json({ message: 'Proveedor y fecha son obligatorios' });
      return;
    }

    const visita = await (prisma as any).visitaProveedor.create({
      data: {
        id_proveedor: Number(id_proveedor),
        fecha_visita: new Date(fecha_visita),
        estado: estado || 'PROGRAMADA',
        notas
      },
      include: {
        proveedor: true
      }
    });

    res.status(201).json({ status: 'success', data: visita });
  } catch (error) {
    const errorId = `ERR-CREATE-VISITA-${Date.now()}`;
    res.status(500).json({ status: 'error', message: 'Internal server error', errorId });
  }
};
