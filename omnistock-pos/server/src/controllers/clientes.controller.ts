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
        limite_credito: limite_credito !== undefined ? Number(limite_credito) : 100
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
    const montoAbono = Number(monto);

    if (!montoAbono || montoAbono <= 0) {
      res.status(400).json({ status: 'error', code: 'INVALID_AMOUNT', message: 'El monto debe ser mayor a 0' });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const clienteActual = await tx.cliente.findUnique({
        where: { id: Number(id_cliente) }
      });

      if (!clienteActual) {
        throw new Error('CLIENT_NOT_FOUND');
      }

      // Lógica Operativa: Se permite abonar más de la deuda para generar saldo a favor (anticipos)
      const nuevoSaldo = Math.round((clienteActual.saldo_deudor - montoAbono) * 100) / 100;
      const userDisplay = (req as any).user?.nombre_completo || (req as any).user?.username || 'Cajero';
      const auditNota = notas ? `${notas} [Cobrado por: ${userDisplay}]` : `[Cobrado por: ${userDisplay}]`;

      const abono = await tx.abonoCredito.create({
        data: {
          id_cliente: Number(id_cliente),
          monto: montoAbono,
          metodo_pago: (metodo_pago === 'TARJETA' || metodo_pago === 'TRANSFERENCIA') ? metodo_pago : 'EFECTIVO',
          notas: auditNota
        }
      });

      const cliente = await tx.cliente.update({
        where: { id: Number(id_cliente) },
        data: { saldo_deudor: nuevoSaldo }
      });

      return { abono, cliente };
    });

    res.json({ status: 'success', message: 'Abono registrado con éxito', data: result });
  } catch (err: any) {
    console.error(`[${errorId}] Error al registrar abono:`, err);
    const code = err.message?.includes('_') ? err.message : 'INTERNAL_ERROR';
    res.status(400).json({ status: 'error', code, error_id: errorId });
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
