import { z } from 'zod';

export const addGastoSchema = z.object({
  body: z.object({
    descripcion: z.string().trim().min(3, 'La descripción debe tener al menos 3 caracteres').max(255),
    monto: z.coerce.number({ error: 'El monto debe ser numérico' })
      .positive('El monto debe ser mayor a 0')
      .finite(),
    categoria: z.string().trim().min(1).max(50).default('GENERAL')
  })
});

export const createCajaSchema = z.object({
  body: z.object({
    nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(50)
  })
});

export const updateCajaSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'El ID debe ser numérico')
  }).optional(),
  body: z.object({
    nombre: z.string().trim().min(2).max(50).optional(),
    estado: z.enum(['ACTIVA', 'INACTIVA']).optional()
  }).refine(data => data.nombre !== undefined || data.estado !== undefined, {
    message: 'Debe proporcionar al menos el nombre o estado a actualizar'
  })
});

export const updateBusinessConfigSchema = z.object({
  body: z.record(
    z.string().trim().min(1).max(100),
    z.union([z.string().max(1000), z.number().finite(), z.boolean()])
  ).refine(obj => Object.keys(obj).length > 0, 'La configuración no puede estar vacía')
   .refine(obj => Object.keys(obj).length <= 100, 'Máximo 100 parámetros por actualización')
});

export const numericIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'El ID debe ser numérico')
  })
});
