import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    sku: z.string().trim().min(1, 'El SKU es obligatorio').max(64),
    descripcion: z.string().trim().min(1, 'La descripción es obligatoria').max(255),
    precio_venta: z.coerce.number({ error: 'El precio de venta debe ser numérico' })
      .positive('El precio de venta debe ser mayor a 0')
      .finite(),
    precio_costo: z.coerce.number({ error: 'El precio de costo debe ser numérico' })
      .nonnegative('El precio de costo no puede ser negativo')
      .finite()
      .default(0),
    stock_actual: z.coerce.number().nonnegative('El stock no puede ser negativo').finite().default(0),
    stock_minimo: z.coerce.number().nonnegative().finite().default(0),
    stock_maximo: z.coerce.number().positive().finite().default(100),
    categoria: z.string().trim().min(1).max(100).default('General'),
    unidad: z.string().trim().min(1).max(20).default('PZ')
  })
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'El ID debe ser numérico')
  }).optional(),
  body: z.object({
    sku: z.string().trim().min(1).max(64).optional(),
    descripcion: z.string().trim().min(1).max(255).optional(),
    precio_venta: z.coerce.number().positive().finite().optional(),
    precio_costo: z.coerce.number().nonnegative().finite().optional(),
    stock_actual: z.coerce.number().nonnegative('El stock físico no puede ser negativo').finite().optional(),
    stock_minimo: z.coerce.number().nonnegative().finite().optional(),
    stock_maximo: z.coerce.number().nonnegative().finite().optional(),
    categoria: z.string().trim().min(1).max(100).optional(),
    unidad: z.string().trim().min(1).max(20).optional(),
    descontinuado: z.boolean().optional(),
    motivo_baja: z.string().trim().max(255).nullable().optional()
  })
});

export const toggleProductStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'El ID debe ser numérico')
  }).optional(),
  body: z.object({
    descontinuado: z.boolean({ error: 'descontinuado es requerido' }),
    motivo: z.string().trim().max(255).optional().nullable()
  })
});

export const adjustInventorySchema = z.object({
  body: z.object({
    id_producto: z.coerce.number().int().positive('ID de producto debe ser entero positivo'),
    cantidad: z.coerce.number({ error: 'La cantidad debe ser numérica' })
      .finite()
      .refine(val => val !== 0, 'El ajuste no puede ser 0'),
    motivo: z.string().trim().min(1).max(255).default('Ajuste manual')
  })
});

export const bulkAdjustInventorySchema = z.object({
  body: z.object({
    adjustments: z.array(
      z.object({
        id_producto: z.coerce.number().int().positive('ID de producto debe ser entero positivo'),
        cantidad: z.coerce.number().finite().refine(val => val !== 0, 'El ajuste no puede ser 0'),
        motivo: z.string().trim().max(255).optional()
      })
    ).min(1, 'Se requiere al menos un ajuste').max(500, 'Máximo 500 ajustes por lote')
  })
});

export const bulkUpdatePricesSchema = z.object({
  body: z.object({
    updates: z.array(
      z.object({
        id: z.coerce.number().int().positive('ID debe ser entero positivo'),
        nuevo_precio: z.coerce.number().positive('El precio debe ser mayor a 0').finite()
      })
    ).min(1, 'Se requiere al menos un cambio de precio').max(500, 'Máximo 500 items por lote')
  })
});

export const importInventorySchema = z.object({
  body: z.object({
    products: z.array(
      z.object({
        sku: z.string().trim().min(1).max(64),
        descripcion: z.string().trim().min(1).max(255),
        precio_venta: z.coerce.number().nonnegative().finite(),
        precio_costo: z.coerce.number().nonnegative().finite().optional().default(0),
        stock_actual: z.coerce.number().nonnegative().finite().optional().default(0),
        categoria: z.string().trim().max(100).optional().default('General'),
        unidad: z.string().trim().max(20).optional().default('PZA')
      })
    ).min(1, 'El lote debe contener productos').max(2000, 'Máximo 2000 productos por importación')
  })
});
