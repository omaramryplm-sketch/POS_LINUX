import { z } from 'zod';

export const createClienteSchema = z.object({
  body: z.object({
    nombre: z.string().min(3, "Name must be at least 3 characters"),
    telefono: z.string().optional().nullable(),
    direccion: z.string().optional().nullable(),
    limite_credito: z.coerce.number().nonnegative().default(0),
  })
});

export const updateClienteSchema = z.object({
  body: z.object({
    nombre: z.string().min(3).optional(),
    telefono: z.string().optional().nullable(),
    direccion: z.string().optional().nullable(),
    limite_credito: z.coerce.number().nonnegative().optional(),
    betado: z.boolean().optional(),
  })
});

export const abonoSchema = z.object({
  body: z.object({
    id_cliente: z.coerce.number().int().positive('id_cliente debe ser numérico positivo'),
    monto: z.coerce.number().positive('El monto debe ser numérico y mayor a 0'),
    metodo_pago: z.enum(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CASH', 'CARD']).optional().default('EFECTIVO'),
    notas: z.string().optional().nullable(),
  })
});
