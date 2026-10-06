import { z } from 'zod';

export const createProveedorSchema = z.object({
  body: z.object({
    nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
    contacto: z.string().trim().max(100).optional().nullable(),
    telefono: z.string().trim().max(30).optional().nullable(),
    email: z.string().trim().email('Formato de correo inválido').optional().nullable().or(z.literal(''))
  })
});

export const updateProveedorSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'El ID debe ser numérico')
  }).optional(),
  body: z.object({
    nombre: z.string().trim().min(2).max(100).optional(),
    contacto: z.string().trim().max(100).optional().nullable(),
    telefono: z.string().trim().max(30).optional().nullable(),
    email: z.string().trim().email('Formato de correo inválido').optional().nullable().or(z.literal(''))
  })
});

export const createVisitaSchema = z.object({
  body: z.object({
    id_proveedor: z.coerce.number().int().positive('id_proveedor debe ser entero positivo'),
    fecha_visita: z.string().optional(),
    estado: z.string().optional().default('PROGRAMADA'),
    notas: z.string().trim().max(500).optional().nullable()
  })
});
