import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createCompra = async (req: Request, res: Response): Promise<void> => {
  try {
    const { items, total_compra, id_proveedor } = req.body;

    if (!items || items.length === 0) {
      res.status(400).json({ message: 'Purchase items are required' });
      return;
    }

    const compraResult = await prisma.$transaction(async (tx) => {
      // 1. Register Compra
      const compra = await tx.compra.create({
        data: {
          id_proveedor,
          total_compra,
          detalles: {
            create: items.map((item: any) => ({
              id_producto: item.id_producto,
              cantidad: item.cantidad,
              precio_costo: item.precio_costo,
              subtotal: item.subtotal
            }))
          }
        }
      });

      // 2. Recalculate Weighted Average Cost and Update Stock
      for (const item of items) {
        const product = await tx.producto.findUnique({
          where: { id: item.id_producto }
        });

        if (!product) {
          throw new Error(`Product ${item.id_producto} not found`);
        }

        const oldStock = product.stock_actual;
        const oldCost = product.precio_costo;
        const newStock = oldStock + item.cantidad;

        // Weighted Average Cost Formula
        // (Old Stock * Old Cost) + (New Qty * New Cost) / Total New Stock
        const newAverageCost = ((oldStock * oldCost) + (item.cantidad * item.precio_costo)) / newStock;

        await tx.producto.update({
          where: { id: item.id_producto },
          data: {
            stock_actual: newStock,
            precio_costo: parseFloat(newAverageCost.toFixed(2))
          }
        });
      }

      // 3. Registrar como Gasto automáticamente
      await (tx as any).gasto.create({
        data: {
          descripcion: `Compra a Proveedor (Folio #${compra.id})`,
          monto: Number(total_compra),
          categoria: 'COMPRA_INVENTARIO',
          id_usuario: (req as any).user?.id || null
        }
      });

      // 4. Log Visit if Proveedor exists
      if (id_proveedor) {
        await (tx as any).visitaProveedor.create({
          data: {
            id_proveedor: Number(id_proveedor),
            fecha_visita: new Date(),
            estado: 'COMPLETADA',
            notas: `Visita registrada automáticamente por compra de $${total_compra}`
          }
        });
      }

      return compra;
    });

    res.status(201).json({ status: 'success', message: 'Compra registered successfully', data: { compra: compraResult } });
  } catch (error: any) {
    const errorId = `ERR-CREATE-COMPRA-${Date.now()}`;
    console.error(`[${errorId}] Compra error:`, error);
    res.status(400).json({ status: 'error', message: error.message || 'Internal server error', errorId });
  }
};

export const getPurchaseSuggestions = async (_req: Request, res: Response): Promise<void> => {
  try {
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const products = await prisma.producto.findMany({
      include: {
        detallesVenta: {
          where: {
            venta: {
              fecha: { gte: last7Days },
              estado: 'COMPLETA'
            }
          }
        },
        detallesCompra: {
          take: 1,
          orderBy: { compra: { fecha: 'desc' } },
          include: { compra: true }
        }
      }
    });
    
    // Filtrar para productos que estén en o por debajo de su stock crítico
    const criticalProducts = products.filter(p => p.stock_actual <= p.stock_minimo);

    const suggestions = criticalProducts.map(p => {
      // Calcular ventas de los últimos 7 días
      const ventasRecientes = p.detallesVenta.reduce((sum, d) => sum + d.cantidad, 0);
      
      // El "techo" de resurtido es el máximo manual o las ventas de la semana con un margen del 20%
      const metaVentas = Math.ceil(ventasRecientes * 1.2);
      const maximo = Math.max(p.stock_maximo, metaVentas);
      
      // El sugerido es lo que falta para llegar a ese máximo
      const sugerencia = maximo - p.stock_actual;
      
      return {
        id: p.id,
        sku: p.sku,
        descripcion: p.descripcion,
        precio_costo: p.precio_costo,
        stock_actual: p.stock_actual,
        stock_minimo: p.stock_minimo,
        stock_maximo: p.stock_maximo,
        categoria: p.categoria,
        unidad: p.unidad,
        cantidad_sugerida: sugerencia > 0 ? sugerencia : 0,
        ventas_semana: ventasRecientes,
        ultima_compra: p.detallesCompra[0]?.compra?.fecha || null
      };
    });

    res.json({ status: 'success', data: suggestions });
  } catch (error) {
    const errorId = `ERR-SUG-COMPRA-${Date.now()}`;
    console.error(`[${errorId}] Error fetching purchase suggestions:`, error);
    res.status(500).json({ status: 'error', message: 'Internal server error', errorId });
  }
};
