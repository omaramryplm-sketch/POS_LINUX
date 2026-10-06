import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { mapToVentaDTO } from '../dtos/venta.dto.js';

export const createVenta = async (req: Request, res: Response): Promise<void> => {
  const errorId = `ERR-SALE-${Date.now()}`;
  try {
    const { items, metodo_pago, referencia_pago, id_cliente, descuento, id_caja } = req.body;
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.rol;

    if (!userId) {
      res.status(401).json({ status: 'error', code: 'UNAUTHORIZED' });
      return;
    }

    // Atomic Transaction for Sale and Stock Deduction
    const ventaResult = await prisma.$transaction(async (tx) => {
      // 1. Process items, verify stock and calculate server-side pricing
      let calculatedGrossTotal = 0;
      const processedDetails = [];

      for (const item of items) {
        const product = await tx.producto.findUnique({ where: { id: item.id_producto } });
        if (!product) throw new Error(`PRODUCT_NOT_FOUND`);

        // Bloqueo si el producto está descontinuado y ya no tiene stock
        if (product.descontinuado && product.stock_actual <= 0) {
          throw new Error(`PRODUCTO_DESCONTINUADO_AGOTADO`);
        }

        // Bloqueo si el producto está inactivo (no descontinuado)
        if (!product.descontinuado && !product.activo) {
          throw new Error(`PRODUCT_INACTIVE`);
        }

        if (product.stock_actual < item.cantidad) throw new Error(`INSUFFICIENT_STOCK`);

        // Determinación flexible y segura del precio unitario (soporte para pronta caducidad / ofertas)
        let unitPrice = product.precio_venta;
        if (item.precio_unitario !== undefined && item.precio_unitario !== null) {
          const customPrice = parseFloat(item.precio_unitario);
          if (isNaN(customPrice) || customPrice <= 0) {
            throw new Error(`PRECIO_UNITARIO_INVALIDO`);
          }
          // Si el precio es menor al de lista
          if (customPrice < product.precio_venta) {
            // Piso de seguridad para cajeros: máximo 50% de descuento permitido
            const minAllowedPrice = Math.round(product.precio_venta * 0.50 * 100) / 100;
            if (userRole !== 'ADMIN' && customPrice < minAllowedPrice) {
              throw new Error(`PRECIO_BAJO_LIMITE_CAJERO`);
            }
          }
          unitPrice = customPrice;
        }

        const subtotal = Math.round(unitPrice * item.cantidad * 100) / 100;
        calculatedGrossTotal += subtotal;

        processedDetails.push({
          id_producto: product.id,
          cantidad: item.cantidad,
          precio_unitario: unitPrice,
          subtotal: subtotal
        });

        const newStock = product.stock_actual - item.cantidad;

        await tx.producto.update({
          where: { id: item.id_producto },
          data: { 
            stock_actual: { decrement: item.cantidad },
            // Si era descontinuado y llega a 0, desactivar
            ...(product.descontinuado && newStock <= 0 ? { activo: false } : {})
          }
        });
      }

      calculatedGrossTotal = Math.round(calculatedGrossTotal * 100) / 100;

      // 2. Validación de descuento global
      const parsedDiscount = Math.max(0, parseFloat(descuento) || 0);
      if (userRole !== 'ADMIN' && parsedDiscount > Math.round(calculatedGrossTotal * 0.50 * 100) / 100) {
        throw new Error(`DESCUENTO_EXCEDE_LIMITE_CAJERO`);
      }
      if (parsedDiscount > calculatedGrossTotal) {
        throw new Error(`DESCUENTO_MAYOR_AL_TOTAL`);
      }

      const calculatedFinalTotal = Math.round((calculatedGrossTotal - parsedDiscount) * 100) / 100;

      // 3. Verify Client Status and Limits using strictly verified calculatedFinalTotal
      if (id_cliente) {
        const client = await tx.cliente.findUnique({ where: { id: Number(id_cliente) } });
        if (client?.betado) {
          throw new Error(`CLIENT_BANNED`);
        }
        if (metodo_pago === 'CREDITO' || metodo_pago === 'CREDIT') {
          const projectedDebt = client!.saldo_deudor + calculatedFinalTotal;
          if (projectedDebt > client!.limite_credito) {
            throw new Error(`INSUFFICIENT_CREDIT`);
          }
        }
      }

      // 4. Create Sale with server-calculated totals
      const newVenta = await tx.venta.create({
        data: {
          id_usuario: userId,
          id_cliente: id_cliente ? Number(id_cliente) : null,
          id_caja: Number(id_caja),
          total: calculatedFinalTotal,
          descuento: parsedDiscount,
          metodo_pago: (metodo_pago === 'CREDIT' || metodo_pago === 'CREDITO') ? 'CREDITO' : metodo_pago || 'EFECTIVO',
          estado: (metodo_pago === 'CREDIT' || metodo_pago === 'CREDITO') ? 'CREDITO' : 'COMPLETA',
          referencia_pago: referencia_pago,
          detalles: {
            create: processedDetails
          }
        },
        include: {
          usuario: { select: { nombre_completo: true } },
          detalles: { include: { producto: true } }
        }
      });

      // 5. Update client debt if credit
      if ((metodo_pago === 'CREDITO' || metodo_pago === 'CREDIT') && id_cliente) {
        await tx.cliente.update({
          where: { id: Number(id_cliente) },
          data: {
            saldo_deudor: {
              increment: calculatedFinalTotal
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
    const { q, limit, includeInactive } = req.query;
    const allowInactive = includeInactive === 'true';

    // Filtro base: En el Punto de Venta se muestran productos activos normales,
    // o productos descontinuados mientras tengan stock disponible para liquidación
    const sellableCondition = {
      OR: [
        { descontinuado: false, activo: true },
        { descontinuado: true, stock_actual: { gt: 0 } }
      ]
    };

    let baseFilter: any = allowInactive ? {} : sellableCondition;

    if (q && typeof q === 'string' && q.trim() !== '') {
      const term = q.trim();

      // Ruta rápida (Índice B-Tree único): Escaneo de código de barras
      const exactProduct = await prisma.producto.findUnique({
        where: { sku: term }
      });

      if (exactProduct) {
        if (!allowInactive) {
          // Si está descontinuado pero aún tiene stock > 0, SE PERMITE LA VENTA hasta agotarse
          if (exactProduct.descontinuado && exactProduct.stock_actual <= 0) {
            res.json({ 
              status: 'success', 
              data: [], 
              message: 'PRODUCTO_DESCONTINUADO_AGOTADO' 
            });
            return;
          }
          if (!exactProduct.descontinuado && !exactProduct.activo) {
            res.json({ 
              status: 'success', 
              data: [], 
              message: 'PRODUCTO_INACTIVO' 
            });
            return;
          }
        }
        res.json({ status: 'success', data: [exactProduct] });
        return;
      }

      const searchTerms = {
        OR: [
          { sku: { contains: term } },
          { descripcion: { contains: term } },
          { categoria: { contains: term } }
        ]
      };

      baseFilter = !allowInactive 
        ? { AND: [sellableCondition, searchTerms] }
        : searchTerms;
    }

    const products = await prisma.producto.findMany({
      where: baseFilter,
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


