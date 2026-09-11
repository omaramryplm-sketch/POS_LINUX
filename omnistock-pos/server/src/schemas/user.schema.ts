import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    nombre_completo: z.string().min(3, "Full name must be at least 3 characters"),
    nombre_usuario: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    rol: z.enum(['ADMIN', 'CAJERO', 'MANAGER']),
  })
});

export const updateUserSchema = z.object({
  body: z.object({
    nombre_completo: z.string().min(3).optional(),
    password: z.string().min(8).optional(),
    rol: z.enum(['ADMIN', 'CAJERO', 'MANAGER']).optional(),
    activo: z.boolean().optional(),
  })
});
