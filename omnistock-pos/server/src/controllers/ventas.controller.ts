import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { mapToVentaDTO } from '../dtos/venta.dto.js';

export const createVenta = async (req: Request, res: Response): Promise<void> => {
  const errorId = `ERR-SALE-${Date.now()}`;
  try {
    const { items, total, metodo_pago, referencia_pago, id_cliente, descuento, id_caja } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ status: 'error', code: 'UNAUTHORIZED' });
      return;
    }

    // Atomic Transaction for Sale and Stock Deduction
    const ventaResult = await prisma.$transaction(async (tx) => {
      // 0. Verify Client Status and Limits
      if (id_cliente) {
        const client = await tx.cliente.findUnique({ where: { id: Number(id_cliente) } });
        if (client?.betado) {
          throw new Error(`CLIENT_BANNED`);
        }
        if (metodo_pago === 'CREDITO' || metodo_pago === 'CREDIT') {
          const projectedDebt = client!.saldo_deudor + total;
          if (projectedDebt > client!.limite_credito) {
            throw new Error(`INSUFFICIENT_CREDIT`);
          }
        }
      }

      // 1. Verify stock and deduct
      for (const item of items) {
        const product = await tx.producto.findUnique({ where: { id: item.id_producto } });
        if (!product) throw new Error(`PRODUCT_NOT_FOUND`);
        if (product.stock_actual < item.cantidad) throw new Error(`INSUFFICIENT_STOCK`);

        await tx.producto.update({
          where: { id: item.id_producto },
          data: { stock_actual: { decrement: item.cantidad } }
        });
      }

      // 3. Create Sale
      const newVenta = await tx.venta.create({
        data: {
          id_usuario: userId,
          id_cliente: id_cliente ? Number(id_cliente) : null,
          id_caja: Number(id_caja),
          total: total,
          descuento: parseFloat(descuento) || 0,
          metodo_pago: (metodo_pago === 'CREDIT' || metodo_pago === 'CREDITO') ? 'CREDITO' : metodo_pago || 'EFECTIVO',
          estado: (metodo_pago === 'CREDIT' || metodo_pago === 'CREDITO') ? 'CREDITO' : 'COMPLETA',
          referencia_pago: referencia_pago,
          detalles: {
            create: items.map((item: any) => ({
              id_producto: item.id_producto,
              cantidad: item.cantidad,
              precio_unitario: item.precio_unitario,
              subtotal: item.subtotal
            }))
          }
        },
        include: {
          usuario: { select: { nombre_completo: true } },
          detalles: { include: { producto: true } }
        }
      });

      // 4. Update client debt if credit
      if ((metodo_pago === 'CREDITO' || metodo_pago === 'CREDIT') && id_cliente) {
        await tx.cliente.update({
          where: { id: Number(id_cliente) },
          data: {
            saldo_deudor: {
              increment: total
            }
          }
        });
      }

      return newVenta;
    });

    res.status(201).json({ 
      status: 'success',
      message: 'Venta processed', 
      data: { venta: mapToVentaDTO(ventaResult) }
    });
  } catch (error: any) {
    console.error(`[${errorId}] Venta error:`, error);
    // Output Opacity: Don't leak DB errors, use codes
    const message = error.message.includes('_') ? error.message : 'TRANSACTION_FAILED';
    res.status(400).json({ status: 'error', code: message, error_id: errorId });
  }
};

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, limit } = req.query;
    let whereClause = {};

    if (q && typeof q === 'string' && q.trim() !== '') {
      whereClause = {
        OR: [
          { sku: { contains: q } },
          { descripcion: { contains: q } },
          { categoria: { contains: q } }
        ]
      };
    }

    const products = await prisma.producto.findMany({
      where: whereClause,
      ...(limit !== 'all' && { take: Number(limit) || 20 })
    });
    
    res.json({ status: 'success', data: products });
  } catch (error) {
    const errorId = `ERR-PROD-${Date.now()}`;
    console.error(`[${errorId}] Get products error:`, error);
    res.status(500).json({ status: 'error', code: 'INTERNAL_ERROR', error_id: errorId });
  }
};

export const getTopProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const topSales = await prisma.detalleVenta.groupBy({
      by: ['id_producto'],
      _sum: { cantidad: true },
      orderBy: { _sum: { cantidad: 'desc' } },
      take: 5
    });

    const products = await prisma.producto.findMany({
      where: { id: { in: topSales.map(t => t.id_producto) } }
    });

    const data = topSales.map(ts => products.find(p => p.id === ts.id_producto)).filter(Boolean);
    res.json({ status: 'success', data });
  } catch (error) {
    const errorId = `ERR-TOP-${Date.now()}`;
    console.error(`[${errorId}] Get top products error:`, error);
    res.status(500).json({ status: 'error', code: 'INTERNAL_ERROR', error_id: errorId });
  }
};

export const getVentaDetail = async (req: Request, res: Response): Promise<void> => {
  const errorId = `ERR-VDET-${Date.now()}`;
  try {
    const { id } = req.params;
    
    const venta = await prisma.venta.findUnique({
      where: { id: Number(id) },
      include: {
        usuario: { select: { nombre_completo: true } },
        detalles: { include: { producto: true } }
      }
    });

    if (!venta) {
      res.status(404).json({ status: 'error', code: 'NOT_FOUND', error_id: errorId });
      return;
    }

    res.json({ status: 'success', data: mapToVentaDTO(venta) });
  } catch (error) {
    console.error(`[${errorId}] Get venta detail error:`, error);
    res.status(500).json({ status: 'error', code: 'INTERNAL_ERROR', error_id: errorId });
  }
};


