import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  })
});

export const createVentaSchema = z.object({
  body: z.object({
    items: z.array(z.object({
      id_producto: z.number(),
      cantidad: z.number().positive(),
      precio_unitario: z.number().nonnegative(),
      subtotal: z.number().nonnegative(),
    })).min(1, "Cart must have at least one item"),
    total: z.number().positive(),
    metodo_pago: z.enum(['EFECTIVO', 'TARJETA', 'CREDITO', 'CASH', 'CARD', 'CREDIT']),
    referencia_pago: z.string().optional(),
    id_cliente: z.number().optional().nullable(),
    descuento: z.number().nonnegative().optional(),
    id_caja: z.number(),
  })
});
