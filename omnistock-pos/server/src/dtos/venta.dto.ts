export interface VentaDTO {
  id: number;
  fecha: string;
  total: number;
  descuento?: number;
  metodo_pago: string;
  id_caja: number | null;
  cajero: string;
  usuario?: {
    nombre_completo: string;
  };
  items: {
    producto: string;
    cantidad: number;
    precio: number;
    subtotal: number;
  }[];
  detalles?: {
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    producto: {
      descripcion: string;
    };
  }[];
}

export const mapToVentaDTO = (venta: any): VentaDTO => {
  return {
    id: venta.id,
    fecha: venta.fecha.toISOString(),
    total: venta.total,
    descuento: venta.descuento || 0,
    metodo_pago: venta.metodo_pago,
    id_caja: venta.id_caja,
    cajero: venta.usuario?.nombre_completo || 'Unknown',
    usuario: {
      nombre_completo: venta.usuario?.nombre_completo || 'Unknown'
    },
    items: venta.detalles?.map((d: any) => ({
      producto: d.producto?.descripcion || 'Unknown',
      cantidad: d.cantidad,
      precio: d.precio_unitario,
      subtotal: d.subtotal
    })) || [],
    detalles: venta.detalles?.map((d: any) => ({
      cantidad: d.cantidad,
      precio_unitario: d.precio_unitario,
      subtotal: d.subtotal,
      producto: {
        descripcion: d.producto?.descripcion || 'Unknown'
      }
    })) || []
  };
};

