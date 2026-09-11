import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  startOfDay, endOfDay, subDays, parseISO, 
  startOfMonth, endOfMonth, eachDayOfInterval, format 
} from 'date-fns';
import { es } from 'date-fns/locale';

const prisma = new PrismaClient();

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const today = new Date();
    const targetDate = date ? parseISO(date as string) : today;
    
    const start = startOfDay(targetDate);
    const end = endOfDay(targetDate);

    // 1. Metrics for SELECTED date
    const daySales = await prisma.venta.aggregate({
      where: { fecha: { gte: start, lte: end } },
      _count: { id: true },
      _sum: { total: true }
    });

    const avgTraffic = (daySales._count.id || 0) / 12;
    const avgRevenue = (daySales._sum.total || 0) / 12;

    const allProducts = await prisma.producto.findMany({
      select: { id: true, descripcion: true, stock_actual: true, stock_minimo: true, precio_costo: true, unidad: true }
    });
    const criticalProducts = allProducts.filter(p => p.stock_actual <= p.stock_minimo);
    const criticalCount = criticalProducts.length;
    const inventoryValue = allProducts.reduce((acc, p) => acc + (p.stock_actual * (p.precio_costo || 0)), 0);

    // 2. Utility Metrics (Sales Cost vs Revenue)
    const daySalesDetails = await prisma.detalleVenta.findMany({
      where: { venta: { fecha: { gte: start, lte: end }, estado: 'COMPLETA' } },
      include: { producto: { select: { precio_costo: true } } }
    });

    const totalCostOfSales = daySalesDetails.reduce((acc, d) => acc + (d.cantidad * (d.producto?.precio_costo || 0)), 0);

    // 3. Wastage Metrics (Pérdidas por Merma)
    const dayAjustesMerma = await prisma.ajusteInventario.findMany({
      where: { 
        fecha: { gte: start, lte: end },
        motivo: { contains: 'Merma' }
      },
      include: { producto: { select: { precio_costo: true } } }
    });

    const totalWastage = dayAjustesMerma.reduce((acc, a) => acc + (Math.abs(a.cantidad) * (a.producto?.precio_costo || 0)), 0);


    // 2. Sales Chart (Current Week vs Last Week)
    const salesChart = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(today, i);
      const s = startOfDay(d);
      const e = endOfDay(d);
      
      const sPrev = startOfDay(subDays(d, 7));
      const ePrev = endOfDay(subDays(d, 7));

      const sYest = startOfDay(subDays(d, 1));
      const eYest = endOfDay(subDays(d, 1));

      const daily = await prisma.venta.aggregate({
        where: { fecha: { gte: s, lte: e }, estado: 'COMPLETA' } as any,
        _sum: { total: true }
      });

      const dailyPrev = await prisma.venta.aggregate({
        where: { fecha: { gte: sPrev, lte: ePrev }, estado: 'COMPLETA' } as any,
        _sum: { total: true }
      });

      const dailyYest = await prisma.venta.aggregate({
        where: { fecha: { gte: sYest, lte: eYest }, estado: 'COMPLETA' } as any,
        _sum: { total: true }
      });

      salesChart.push({
        name: d.toLocaleDateString('es-MX', { weekday: 'short' }),
        fullDate: d.toISOString().split('T')[0],
        current: Number((daily as any)._sum.total || 0),
        prev: Number((dailyPrev as any)._sum.total || 0),
        yesterday: Number((dailyYest as any)._sum.total || 0)
      });
    }

    // 3. Recent Transactions (Sales + Gastos) for SELECTED date
    const recentSalesRaw = await prisma.venta.findMany({
      where: { fecha: { gte: start, lte: end } },
      orderBy: { fecha: 'desc' },
      include: {
        usuario: { select: { nombre_completo: true } },
        caja: { select: { nombre: true } }, // Incluir nombre de la caja
        detalles: {
          include: {
            producto: { select: { descripcion: true, unidad: true } }
          }
        }
      }
    });

    const recentGastosRaw = await (prisma as any).gasto.findMany({
      where: { fecha: { gte: start, lte: end } },
      orderBy: { fecha: 'desc' },
      include: { usuario: { select: { nombre_completo: true } } }
    });

    const recentAjustesRaw = await prisma.ajusteInventario.findMany({
      where: { fecha: { gte: start, lte: end } },
      orderBy: { fecha: 'desc' },
      include: { 
        usuario: { select: { nombre_completo: true } },
        producto: { select: { descripcion: true } }
      }
    });

    const recentSales = [
      ...recentSalesRaw.map(s => ({ ...s, _type: 'VENTA' })),
      ...recentGastosRaw.map((g: any) => ({ ...g, _type: 'GASTO' })),
      ...recentAjustesRaw.map(a => ({ 
        ...a, 
        _type: 'AJUSTE', 
        total: a.cantidad, // Use total field for amount/delta
        descripcion: `${a.motivo}: ${a.producto.descripcion}` 
      }))
    ].sort((a: any, b: any) => b.fecha.getTime() - a.fecha.getTime());

    // 4. Sales by Caja breakdown
    const salesByCajaRaw = await prisma.venta.groupBy({
      by: ['id_caja'],
      where: { fecha: { gte: start, lte: end }, estado: 'COMPLETA' },
      _sum: { total: true },
      _count: { id: true }
    });

    const salesByCaja = await Promise.all(salesByCajaRaw.map(async (item) => {
      const cajaInfo = item.id_caja 
        ? await prisma.caja.findUnique({ where: { id: item.id_caja }, select: { nombre: true } })
        : { nombre: 'Sin Caja' };
      return {
        nombre: cajaInfo?.nombre || 'Desconocida',
        total: item._sum.total || 0,
        cantidad: item._count.id || 0
      };
    }));


    // 4. Top Products for SELECTED date
    const topProductsRaw = await prisma.detalleVenta.groupBy({
      by: ['id_producto'],
      where: { venta: { fecha: { gte: start, lte: end } } },
      _sum: { cantidad: true },
      orderBy: { _sum: { cantidad: 'desc' } },
      take: 5
    });

    const topProducts = await Promise.all(topProductsRaw.map(async (tp) => {
      const product = await prisma.producto.findUnique({
        where: { id: tp.id_producto },
        select: { descripcion: true }
      });
      return {
        name: product?.descripcion,
        value: tp._sum.cantidad
      };
    }));

    res.json({
      status: 'success',
      data: {
        selectedDate: targetDate.toISOString(),
        metrics: {
          todayTotal: daySales._sum.total || 0,
          todayCost: totalCostOfSales,
          todayWastage: totalWastage,
          criticalCount,
          criticalProducts,
          inventoryValue,
          avgTraffic: Number(avgTraffic.toFixed(2)),
          avgRevenue: Number(avgRevenue.toFixed(2))
        },
        salesChart,
        recentSales,
        topProducts,
        salesByCaja
      }
    });
  } catch (error) {
    const errorId = `ERR-DASH-${Date.now()}`;
    console.error(`[${errorId}] Dashboard error:`, error);
    res.status(500).json({ status: 'error', message: 'Internal server error', errorId });
  }
};
// --- Gestión de Precios (Price Inbox) ---

export const getPriceSuggestions = async (req: Request, res: Response) => {
  try {
    const suggestions = await prisma.sugerenciaPrecio.findMany({
      where: { estado: 'PENDIENTE' },
      include: { producto: true },
      orderBy: { id: 'desc' }
    });
    res.json({ status: 'success', data: suggestions });
  } catch (err) {
    const errorId = `ERR-SUG-${Date.now()}`;
    res.status(500).json({ status: 'error', message: 'Internal server error', errorId });
  }
};

export const approveSuggestion = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const suggestion = await prisma.sugerenciaPrecio.findUnique({
      where: { id: Number(id) }
    });

    if (!suggestion) return res.status(404).json({ message: 'Suggestion not found' });

    // 1. Actualizar el precio del producto
    await prisma.producto.update({
      where: { id: suggestion.id_producto },
      data: { precio_venta: suggestion.precio_sugerido }
    });

    // 2. Marcar sugerencia como aprobada
    await prisma.sugerenciaPrecio.update({
      where: { id: Number(id) },
      data: { estado: 'APROBADA' }
    });

    res.json({ status: 'success', message: 'Precio actualizado con éxito' });
  } catch (err) {
    const errorId = `ERR-APP-SUG-${Date.now()}`;
    res.status(500).json({ status: 'error', message: 'Internal server error', errorId });
  }
};

export const rejectSuggestion = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.sugerenciaPrecio.update({
      where: { id: Number(id) },
      data: { estado: 'RECHAZADA' }
    });
    res.json({ status: 'success', message: 'Sugerencia rechazada' });
  } catch (err) {
    const errorId = `ERR-REJ-SUG-${Date.now()}`;
    res.status(500).json({ status: 'error', message: 'Internal server error', errorId });
  }
};

// --- Gestión de Precios Masiva (Bulk Price Manager) ---

export const getInventoryPrices = async (req: Request, res: Response) => {
  try {
    const productos = await prisma.producto.findMany({
      select: {
        id: true,
        sku: true,
        descripcion: true,
        categoria: true,
        precio_venta: true
      },
      orderBy: { categoria: 'asc' }
    });

    const categories = [...new Set(productos.map(p => p.categoria))];

    res.json({ status: 'success', data: { productos, categories } });
  } catch (err) {
    const errorId = `ERR-INV-PRICES-${Date.now()}`;
    res.status(500).json({ status: 'error', message: 'Internal server error', errorId });
  }
};

export const bulkUpdatePrices = async (req: Request, res: Response) => {
  const { updates } = req.body; // Array de { id, nuevo_precio }
  try {
    await prisma.$transaction(
      updates.map((u: any) => 
        prisma.producto.update({
          where: { id: u.id },
          data: { precio_venta: u.nuevo_precio }
        })
      )
    );
    res.json({ status: 'success', message: 'Actualización masiva completada' });
  } catch (err) {
    const errorId = `ERR-BULK-PRICES-${Date.now()}`;
    console.error(`[${errorId}] Bulk update error:`, err);
    res.status(500).json({ status: 'error', message: 'Internal server error', errorId });
  }
};

export const cancelSale = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const venta = await prisma.venta.findUnique({
      where: { id: Number(id) },
      include: { detalles: true }
    });

    if (!venta) return res.status(404).json({ message: 'Venta no encontrada' });
    const v = venta as any;
    if (v.estado === 'CANCELADA') return res.status(400).json({ message: 'La venta ya está cancelada' });

    await prisma.$transaction(async (tx) => {
      // 1. Restaurar stock
      for (const d of venta.detalles) {
        await tx.producto.update({
          where: { id: d.id_producto },
          data: { stock_actual: { increment: d.cantidad } }
        });
      }

      // 2. Marcar como cancelada
      await tx.venta.update({
        where: { id: Number(id) },
        data: { estado: 'CANCELADA' } as any
      });
    });

    res.json({ status: 'success', message: 'Venta cancelada y stock restaurado' });
  } catch (err) {
    const errorId = `ERR-CANCEL-SALE-${Date.now()}`;
    res.status(500).json({ status: 'error', message: 'Internal server error', errorId });
  }
};

export const adjustInventory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id_producto, cantidad, motivo } = req.body;
    const userId = (req as any).user?.id;

    if (!id_producto || cantidad === undefined) {
      res.status(400).json({ message: 'Producto y cantidad son obligatorios' });
      return;
    }

    const producto = await prisma.producto.findUnique({
      where: { id: Number(id_producto) }
    });

    if (!producto) {
      res.status(404).json({ message: 'Producto no encontrado' });
      return;
    }

    const newStock = producto.stock_actual + Number(cantidad);
    
    // VALIDACIÓN ESTRICTA: No permitir stock negativo
    if (newStock < 0) {
      res.status(400).json({ 
        message: `Operación cancelada: El stock final no puede ser menor a 0. (Stock actual: ${producto.stock_actual}, Intento de ajuste: ${cantidad})` 
      });
      return;
    }

    const [updated] = await prisma.$transaction([
      prisma.producto.update({
        where: { id: Number(id_producto) },
        data: { stock_actual: { increment: Number(cantidad) } }
      }),
      prisma.ajusteInventario.create({
        data: {
          id_producto: Number(id_producto),
          id_usuario: userId,
          cantidad: Number(cantidad),
          motivo: motivo || 'Ajuste manual'
        }
      })
    ]);

    res.json({ status: 'success', data: updated });
  } catch (error) {
    const errorId = `ERR-ADJ-INV-${Date.now()}`;
    console.error(`[${errorId}] Error adjusting inventory:`, error);
    res.status(500).json({ status: 'error', message: 'Internal server error', errorId });
  }
};

export const bulkAdjustInventory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { adjustments } = req.body;
    const userId = (req as any).user?.id;

    if (!adjustments || !Array.isArray(adjustments) || adjustments.length === 0) {
      res.status(400).json({ message: 'Ajustes son obligatorios y deben ser un arreglo no vacío' });
      return;
    }

    // 1. Fetch current stock for all requested products
    const productIds = adjustments.map(a => Number(a.id_producto));
    const products = await prisma.producto.findMany({
      where: { id: { in: productIds } }
    });

    const productMap = new Map(products.map(p => [p.id, p]));

    // 2. Validate all adjustments before starting the transaction
    for (const adj of adjustments) {
      const prod = productMap.get(Number(adj.id_producto));
      if (!prod) {
        res.status(404).json({ message: `Producto con ID ${adj.id_producto} no encontrado` });
        return;
      }
      const newStock = prod.stock_actual + Number(adj.cantidad);
      if (newStock < 0) {
        res.status(400).json({
          message: `Operación cancelada: El stock final para "${prod.descripcion}" no puede ser menor a 0. (Stock actual: ${prod.stock_actual}, Intento de ajuste: ${adj.cantidad})`
        });
        return;
      }
    }

    // 3. Execute all updates in a Prisma transaction
    const transactionOperations = adjustments.flatMap(adj => [
      prisma.producto.update({
        where: { id: Number(adj.id_producto) },
        data: { stock_actual: { increment: Number(adj.cantidad) } }
      }),
      prisma.ajusteInventario.create({
        data: {
          id_producto: Number(adj.id_producto),
          id_usuario: userId,
          cantidad: Number(adj.cantidad),
          motivo: adj.motivo || 'Ajuste masivo'
        }
      })
    ]);

    await prisma.$transaction(transactionOperations);

    res.json({ status: 'success', message: 'Ajustes masivos aplicados correctamente' });
  } catch (error) {
    const errorId = `ERR-BULK-ADJ-${Date.now()}`;
    console.error(`[${errorId}] Error in bulk adjusting inventory:`, error);
    res.status(500).json({ status: 'error', message: 'Internal server error', errorId });
  }
};


export const addGasto = async (req: Request, res: Response) => {
  const { descripcion, monto, categoria } = req.body;
  const userId = (req as any).user?.id; // Capturamos el usuario del token
  try {
    const gasto = await (prisma as any).gasto.create({
      data: { 
        descripcion, 
        monto: Number(monto), 
        categoria: categoria || 'GENERAL',
        id_usuario: userId
      }
    });
    res.json({ status: 'success', data: gasto });
  } catch (err) {
    const errorId = `ERR-ADD-GASTO-${Date.now()}`;
    res.status(500).json({ status: 'error', message: 'Internal server error', errorId });
  }
};

export const getCorteCaja = async (req: Request, res: Response) => {
  const { date, id_caja } = req.query;
  const targetDate = date ? parseISO(date as string) : new Date();
  const start = startOfDay(targetDate);
  const end = endOfDay(targetDate);

  try {
    const whereClause: any = {
      fecha: { gte: start, lte: end }
    };

    if (id_caja && id_caja !== 'all') {
      whereClause.id_caja = parseInt(id_caja as string);
    }

    const ventasActivas = await prisma.venta.aggregate({
      where: { ...whereClause, estado: 'COMPLETA' } as any,
      _sum: { total: true },
      _count: { id: true }
    });

    const ventasCanceladas = await prisma.venta.aggregate({
      where: { ...whereClause, estado: 'CANCELADA' } as any,
      _sum: { total: true },
      _count: { id: true }
    });

    // Los gastos por ahora siguen siendo generales o por usuario, 
    // pero si filtramos por caja, podríamos omitirlos del "Efectivo Esperado"
    // o simplemente mostrarlos si decidimos asociar gastos a cajas en el futuro.
    const gastos = await (prisma as any).gasto.aggregate({
      where: { fecha: { gte: start, lte: end } },
      _sum: { monto: true },
      _count: { id: true }
    });

    const listaGastos = await (prisma as any).gasto.findMany({
      where: { fecha: { gte: start, lte: end } },
      include: { usuario: { select: { nombre_completo: true } } },
      orderBy: { fecha: 'desc' }
    });

    const vActivas = ventasActivas as any;
    const vCanceladas = ventasCanceladas as any;
    const gTotales = gastos as any;

    res.json({
      status: 'success',
      data: {
        fecha: targetDate,
        id_caja: id_caja || 'all',
        ventas: {
          total: vActivas._sum?.total || 0,
          cantidad: vActivas._count?.id || 0,
        },
        cancelaciones: {
          total: vCanceladas._sum?.total || 0,
          cantidad: vCanceladas._count?.id || 0,
        },
        gastos: {
          total: gTotales._sum?.monto || 0,
          cantidad: gTotales._count?.id || 0,
          detalles: listaGastos
        },
        efectivoEsperado: (vActivas._sum?.total || 0) - (id_caja && id_caja !== 'all' ? 0 : (gTotales._sum?.monto || 0))
      }
    });
  } catch (err) {
    const errorId = `ERR-CORTE-${Date.now()}`;
    res.status(500).json({ status: 'error', message: 'Internal server error', errorId });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  const { 
    sku, descripcion, precio_venta, precio_costo, 
    stock_actual, stock_minimo, stock_maximo, 
    categoria, unidad 
  } = req.body;

  try {
    // Verificar si el SKU ya existe
    const exists = await prisma.producto.findUnique({ where: { sku } });
    if (exists) {
      res.status(400).json({ message: 'El SKU ya está registrado en otro producto.' });
      return;
    }

    const product = await prisma.producto.create({
      data: {
        sku,
        descripcion,
        precio_venta: parseFloat(precio_venta),
        precio_costo: parseFloat(precio_costo) || 0,
        stock_actual: parseFloat(stock_actual) || 0,
        stock_minimo: parseFloat(stock_minimo) || 0,
        stock_maximo: parseFloat(stock_maximo) || 0,
        categoria: categoria || 'General',
        unidad: unidad || 'PZ'
      }
    });

    res.json({ status: 'success', data: product });
  } catch (err) {
    const errorId = `ERR-CREATE-PROD-${Date.now()}`;
    res.status(500).json({ status: 'error', message: 'Internal server error', errorId });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { 
    sku, descripcion, precio_venta, precio_costo, 
    stock_actual, stock_minimo, stock_maximo, 
    categoria, unidad 
  } = req.body;
  const userId = (req as any).user?.id;

  try {
    const oldProduct = await prisma.producto.findUnique({ where: { id: Number(id) } });
    if (!oldProduct) {
      res.status(404).json({ message: 'Producto no encontrado' });
      return;
    }

    const newStock = parseFloat(stock_actual.toString()) || 0;

    // VALIDACIÓN ESTRICTA: No permitir stock negativo en edición manual
    if (newStock < 0) {
      res.status(400).json({ message: 'El stock físico no puede ser negativo.' });
      return;
    }

    const diff = newStock - oldProduct.stock_actual;

    const product = await prisma.$transaction(async (tx) => {
      const updated = await tx.producto.update({
        where: { id: Number(id) },
        data: {
          sku,
          descripcion,
          precio_venta: parseFloat(precio_venta.toString()),
          precio_costo: parseFloat(precio_costo.toString()) || 0,
          stock_actual: newStock,
          stock_minimo: parseFloat(stock_minimo.toString()) || 0,
          stock_maximo: parseFloat(stock_maximo.toString()) || 0,
          categoria: categoria || 'General',
          unidad: unidad || 'PZ'
        }
      });

      // Si hubo cambio en el stock, registrar ajuste para auditoría
      if (diff !== 0) {
        await tx.ajusteInventario.create({
          data: {
            id_producto: Number(id),
            id_usuario: userId,
            cantidad: diff,
            motivo: 'Cambio manual en Maestro de Producto'
          }
        });
      }

      return updated;
    });

    res.json({ status: 'success', data: product });
  } catch (err) {
    const errorId = `ERR-UPDATE-PROD-${Date.now()}`;
    console.error(`[${errorId}] Error updating product:`, err);
    res.status(500).json({ status: 'error', message: 'Internal server error', errorId });
  }
};

// --- Configuración Global ---
export const getBusinessConfig = async (req: Request, res: Response) => {
  try {
    const config = await prisma.config.findMany();
    const configMap = config.reduce((acc: any, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json({ status: 'success', data: configMap });
  } catch (err) {
    const errorId = `ERR-GET-CONFIG-${Date.now()}`;
    res.status(500).json({ status: 'error', message: 'Internal server error', errorId });
  }
};

export const updateBusinessConfig = async (req: Request, res: Response) => {
  const settings = req.body; // Expecting { key: value }
  try {
    const updates = Object.entries(settings).map(([key, value]) => {
      return prisma.config.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) }
      });
    });
    await prisma.$transaction(updates);
    res.json({ status: 'success', message: 'Configuración actualizada' });
  } catch (err) {
    const errorId = `ERR-UPDATE-CONFIG-${Date.now()}`;
    res.status(500).json({ status: 'error', message: 'Internal server error', errorId });
  }
};

// --- Reportes Mensuales ---
export const getMonthlyReport = async (req: Request, res: Response) => {
  const { month, year } = req.query;
  if (!month || !year) return res.status(400).json({ message: 'Mes y año son requeridos' });

  const targetDate = new Date(Number(year), Number(month) - 1, 1);
  const start = startOfMonth(targetDate);
  const end = endOfMonth(targetDate);

  try {
    const sales = await prisma.venta.aggregate({
      where: { fecha: { gte: start, lte: end }, estado: 'COMPLETA' } as any,
      _sum: { total: true },
      _count: { id: true }
    });

    const salesDetails = await prisma.detalleVenta.findMany({
      where: { venta: { fecha: { gte: start, lte: end }, estado: 'COMPLETA' } },
      include: { producto: { select: { precio_costo: true } } }
    });
    const totalCost = salesDetails.reduce((acc, d) => acc + (d.cantidad * (d.producto?.precio_costo || 0)), 0);

    const expenses = await (prisma as any).gasto.aggregate({
      where: { fecha: { gte: start, lte: end } },
      _sum: { monto: true }
    });

    const listExpenses = await (prisma as any).gasto.findMany({
      where: { fecha: { gte: start, lte: end } },
      include: { usuario: { select: { nombre_completo: true } } }
    });

    const days = eachDayOfInterval({ start, end });
    const dailyData = await Promise.all(days.map(async (day) => {
      const dStart = startOfDay(day);
      const dEnd = endOfDay(day);
      const dSum = await prisma.venta.aggregate({
        where: { fecha: { gte: dStart, lte: dEnd }, estado: 'COMPLETA' } as any,
        _sum: { total: true }
      });
      return {
        date: format(day, 'yyyy-MM-dd'),
        label: format(day, 'dd'),
        total: dSum._sum.total || 0
      };
    }));

    const paymentMethods = await prisma.venta.groupBy({
      where: { fecha: { gte: start, lte: end }, estado: 'COMPLETA' } as any,
      by: ['metodo_pago'],
      _sum: { total: true },
      _count: { id: true }
    });

    res.json({
      monthLabel: format(targetDate, 'MMMM', { locale: es }),
      year: format(targetDate, 'yyyy'),
      totalSales: sales._sum.total || 0,
      totalCount: sales._count.id || 0,
      totalCost,
      grossProfit: (sales._sum.total || 0) - totalCost,
      totalExpenses: expenses._sum.monto || 0,
      netProfit: (sales._sum.total || 0) - totalCost - (expenses._sum.monto || 0),
      dailyData,
      expenses: listExpenses,
      paymentBreakdown: paymentMethods.map(m => ({
        method: m.metodo_pago || 'EFECTIVO',
        total: m._sum.total || 0,
        count: m._count.id || 0
      }))
    });
  } catch (err) {
    const errorId = `ERR-MONTHLY-REPORT-${Date.now()}`;
    res.status(500).json({ status: 'error', message: 'Internal server error', errorId });
  }
};

// --- Respaldo de Base de Datos (Backup) ---
export const exportDatabaseBackup = async (req: Request, res: Response) => {
  try {
    const products = await prisma.producto.findMany();
    const sales = await prisma.venta.findMany({ include: { detalles: true } });
    const adjustments = await prisma.ajusteInventario.findMany();
    const expenses = await (prisma as any).gasto.findMany();
    const config = await prisma.config.findMany();

    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {
        productos: products,
        ventas: sales,
        ajustes: adjustments,
        gastos: expenses,
        configuracion: config
      }
    };

    res.setHeader('Content-disposition', `attachment; filename=OmniStock_Backup_${format(new Date(), 'yyyy-MM-dd')}.json`);
    res.setHeader('Content-type', 'application/json');
    res.write(JSON.stringify(backupData, null, 2));
    res.end();
  } catch (err) {
    const errorId = `ERR-BACKUP-${Date.now()}`;
    res.status(500).json({ status: 'error', message: 'Internal server error', errorId });
  }
};
// --- Gestión de Cajas ---
export const getCajas = async (req: Request, res: Response) => {
  try {
    const cajas = await prisma.caja.findMany({
      orderBy: { nombre: 'asc' }
    });
    res.json({ status: 'success', data: cajas });
  } catch (err) {
    const errorId = `ERR-GET-CAJAS-${Date.now()}`;
    res.status(500).json({ status: 'error', message: 'Internal server error', errorId });
  }
};

export const createCaja = async (req: Request, res: Response) => {
  try {
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ message: 'El nombre es obligatorio' });
    
    const caja = await prisma.caja.create({ data: { nombre: nombre.toUpperCase() } });
    res.json({ status: 'success', data: caja });
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(400).json({ status: 'error', message: 'Ya existe una caja con ese nombre' });
    const errorId = `ERR-CREATE-CAJA-${Date.now()}`;
    res.status(500).json({ status: 'error', message: 'Internal server error', errorId });
  }
};

export const updateCaja = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, estado } = req.body;
    const caja = await prisma.caja.update({
      where: { id: parseInt(id as string) },
      data: { 
        nombre: nombre?.toUpperCase(), 
        estado 
      }
    });
    res.json({ status: 'success', data: caja });
  } catch (err) {
    const errorId = `ERR-UPDATE-CAJA-${Date.now()}`;
    res.status(500).json({ status: 'error', message: 'Internal server error', errorId });
  }
};

export const deleteCaja = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Verificar si tiene ventas antes de borrar (opcional, Prisma lanzará error si hay restricción)
    await prisma.caja.delete({ where: { id: parseInt(id as string) } });
    res.json({ status: 'success', message: 'Caja eliminada exitosamente' });
  } catch (err) {
    const errorId = `ERR-DELETE-CAJA-${Date.now()}`;
    res.status(500).json({ status: 'error', message: 'Error al eliminar caja. Es posible que tenga ventas asociadas.', errorId });
  }
};

export const getInventoryAdjustments = async (req: Request, res: Response) => {
  try {
    const adjustments = await prisma.ajusteInventario.findMany({
      orderBy: { fecha: 'desc' },
      include: {
        producto: {
          select: {
            sku: true,
            descripcion: true,
            categoria: true,
            unidad: true
          }
        },
        usuario: {
          select: {
            nombre_completo: true,
            username: true
          }
        }
      }
    });

    const mapped = adjustments.map(adj => ({
      ...adj,
      usuario: adj.usuario ? {
        nombre: adj.usuario.nombre_completo,
        username: adj.usuario.username
      } : null
    }));

    res.json({ status: 'success', data: mapped });
  } catch (err) {
    const errorId = `ERR-GET-ADJUSTMENTS-${Date.now()}`;
    console.error(`[${errorId}] Error getting adjustments history:`, err);
    res.status(500).json({ status: 'error', message: 'Error al obtener el historial de ajustes', errorId });
  }
};
