import { z } from 'zod';

export const createCompraSchema = z.object({
  body: z.object({
    id_proveedor: z.coerce.number().int().positive().nullable().optional(),
    total_compra: z.coerce.number().positive('El total de compra debe ser mayor a 0').finite(),
    items: z.array(
      z.object({
        id_producto: z.coerce.number().int().positive('id_producto debe ser entero positivo'),
        cantidad: z.coerce.number().positive('La cantidad debe ser mayor a 0').finite(),
        precio_costo: z.coerce.number().nonnegative('El precio de costo no puede ser negativo').finite(),
        subtotal: z.coerce.number().nonnegative('El subtotal no puede ser negativo').finite()
      })
    ).min(1, 'La compra debe incluir al menos un producto').max(500, 'Máximo 500 productos por compra')
  }).refine(
    data => {
      const calculatedTotal = data.items.reduce((acc, item) => acc + item.subtotal, 0);
      return Math.abs(calculatedTotal - data.total_compra) < 0.1;
    },
    { message: 'El total de compra no coincide con la suma de los subtotales', path: ['total_compra'] }
  )
});
