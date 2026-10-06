import { z } from 'zod';

export const createVentaSchema = z.object({
  body: z.object({
    items: z.array(z.object({
      id_producto: z.coerce.number().int().positive('id_producto debe ser entero positivo'),
      cantidad: z.coerce.number().positive('La cantidad debe ser mayor a 0').finite(),
      precio_unitario: z.coerce.number().positive('El precio unitario debe ser mayor a 0').finite().optional(),
      subtotal: z.coerce.number().nonnegative('El subtotal no puede ser negativo').finite().optional(),
    })).min(1, 'El carrito debe tener al menos un producto'),
    total: z.coerce.number().nonnegative().finite().optional(),
    metodo_pago: z.enum(['EFECTIVO', 'TARJETA', 'CREDITO', 'CASH', 'CARD', 'CREDIT']),
    referencia_pago: z.string().trim().max(100).optional().nullable(),
    id_cliente: z.coerce.number().int().positive().optional().nullable(),
    descuento: z.coerce.number().nonnegative().finite().optional().default(0),
    id_caja: z.coerce.number().int().positive('id_caja debe ser un número entero válido'),
  }).refine((data) => {
    if (data.metodo_pago === 'CREDITO' || data.metodo_pago === 'CREDIT') {
      return typeof data.id_cliente === 'number' && data.id_cliente > 0;
    }
    return true;
  }, {
    message: 'El id_cliente es obligatorio y debe ser un ID válido para ventas a crédito',
    path: ['id_cliente']
  })
});

export const getProductsQuerySchema = z.object({
  query: z.object({
    q: z.string().trim().max(100).optional(),
    limit: z.union([z.string(), z.number()]).optional(),
    includeInactive: z.string().optional()
  }).optional()
});
