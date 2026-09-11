import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

// Simple DTO for Client
const mapToClienteDTO = (c: any) => ({
  id: c.id,
  nombre: c.nombre,
  telefono: c.telefono,
  direccion: c.direccion,
  saldo_deudor: c.saldo_deudor,
  limite_credito: c.limite_credito,
  betado: c.betado,
  ventas: c.ventas || [],
  abonos: c.abonos || []
});

export const getClientes = async (req: Request, res: Response) => {
  try {
    const clientes = await prisma.cliente.findMany({
      orderBy: { nombre: 'asc' }
    });
    res.json({ status: 'success', data: clientes.map(mapToClienteDTO) });
  } catch (err) {
    const errorId = `ERR-CGET-${Date.now()}`;
    console.error(`[${errorId}] Error al obtener clientes:`, err);
    res.status(500).json({ status: 'error', code: 'INTERNAL_ERROR', error_id: errorId });
  }
};

export const createCliente = async (req: Request, res: Response) => {
  try {
    const { nombre, telefono, direccion, limite_credito } = req.body;
    const newCliente = await prisma.cliente.create({
      data: {
        nombre,
        telefono,
        direccion,
        limite_credito: Number(limite_credito) || 0
      }
    });
    res.status(201).json({ status: 'success', data: mapToClienteDTO(newCliente) });
  } catch (err) {
    const errorId = `ERR-CCRE-${Date.now()}`;
    console.error(`[${errorId}] Error al crear cliente:`, err);
    res.status(500).json({ status: 'error', code: 'INTERNAL_ERROR', error_id: errorId });
  }
};

export const getClienteDetail = async (req: Request, res: Response) => {
  const errorId = `ERR-CDET-${Date.now()}`;
  try {
    const { id } = req.params;
    const cliente = await prisma.cliente.findUnique({
      where: { id: Number(id) },
      include: {
        ventas: { orderBy: { fecha: 'desc' }, take: 10 },
        abonos: { orderBy: { fecha: 'desc' }, take: 10 }
      }
    });
    if (!cliente) return res.status(404).json({ status: 'error', code: 'NOT_FOUND' });
    res.json({ status: 'success', data: mapToClienteDTO(cliente) });
  } catch (err) {
    console.error(`[${errorId}] Error al obtener detalle del cliente:`, err);
    res.status(500).json({ status: 'error', code: 'INTERNAL_ERROR', error_id: errorId });
  }
};

export const registrarAbono = async (req: Request, res: Response) => {
  const errorId = `ERR-ABON-${Date.now()}`;
  try {
    const { id_cliente, monto, metodo_pago, notas } = req.body;
    const result = await prisma.$transaction(async (tx) => {
      const abono = await tx.abonoCredito.create({
        data: {
          id_cliente: Number(id_cliente),
          monto: Number(monto),
          metodo_pago,
          notas
        }
      });

      const cliente = await tx.cliente.update({
        where: { id: Number(id_cliente) },
        data: { saldo_deudor: { decrement: Number(monto) } }
      });

      return { abono, cliente };
    });

    res.json({ status: 'success', message: 'Abono registrado con éxito', data: result });
  } catch (err) {
    console.error(`[${errorId}] Error al registrar abono:`, err);
    res.status(500).json({ status: 'error', code: 'INTERNAL_ERROR', error_id: errorId });
  }
};

export const updateCliente = async (req: Request, res: Response) => {
  const errorId = `ERR-CUPD-${Date.now()}`;
  try {
    const { id } = req.params;
    const { nombre, telefono, direccion, limite_credito, betado } = req.body;
    
    const updateData: any = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (telefono !== undefined) updateData.telefono = telefono;
    if (direccion !== undefined) updateData.direccion = direccion;
    if (limite_credito !== undefined) updateData.limite_credito = Number(limite_credito);
    if (betado !== undefined) updateData.betado = Boolean(betado);

    const updated = await prisma.cliente.update({
      where: { id: Number(id) },
      data: updateData
    });
    res.json({ status: 'success', data: mapToClienteDTO(updated) });
  } catch (err) {
    console.error(`[${errorId}] Error al actualizar cliente:`, err);
    res.status(500).json({ status: 'error', code: 'INTERNAL_ERROR', error_id: errorId });
  }
};
