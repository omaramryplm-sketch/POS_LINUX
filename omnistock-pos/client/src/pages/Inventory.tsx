import React, { useState, useEffect, useRef, useCallback, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import api from '../api/axios';
import { Search, Upload, FileUp, Package, AlertTriangle, TrendingUp, Filter, Users, ShoppingCart, Plus, Check, X, Building2, Phone, RefreshCw, Edit, ChevronUp, ChevronDown, MessageSquare, Download } from 'lucide-react';
import clsx from 'clsx';

interface Product {
  id: number;
  sku: string;
  descripcion: string;
  precio_venta: number;
  precio_costo: number;
  stock_actual: number;
  stock_minimo: number;
  stock_maximo: number;
  categoria: string;
  unidad: string;
  cantidad_sugerida?: number; // From suggestions API
  ventas_semana?: number; 
  ultima_compra?: string | null;
}

interface Proveedor {
  id: number;
  nombre: string;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
}

interface Visita {
  id: number;
  id_proveedor: number;
  fecha_visita: string;
  estado: string;
  notas: string | null;
  proveedor?: Proveedor;
}

interface CycleCountItem {
  id: number;
  sku: string;
  descripcion: string;
  categoria: string;
  stock_actual: number;
  cantidad_contada: number | null;
  unidad: string;
}

interface BusinessConfig {
  business_name?: string;
  business_rfc?: string;
  business_address?: string;
  business_phone?: string;
  business_slogan?: string;
}

const ReporteConteoComponent = React.forwardRef<HTMLDivElement, {
  productos: CycleCountItem[];
  categoria: string;
  config: BusinessConfig | null;
  fecha: string;
}>(({ productos, categoria, config, fecha }, ref) => {
  const total = productos.length;
  const contados = productos.filter(p => p.cantidad_contada !== null).length;
  const pendientes = total - contados;
  const diferencias = productos.filter(p => p.cantidad_contada !== null && p.cantidad_contada !== p.stock_actual).length;

  return (
    <div ref={ref} className="p-12 bg-white text-slate-800 font-sans text-xs w-[210mm] min-h-[297mm] mx-auto leading-relaxed border border-slate-100">
      {/* Header Membretado */}
      <div className="border-b-4 border-rose-500 pb-6 mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
            {config?.business_name || 'OMNISTOCK'}
          </h1>
          {config?.business_slogan && (
            <p className="text-xs italic text-slate-500 font-semibold mb-2">{config.business_slogan}</p>
          )}
          <div className="text-[10px] text-slate-500 font-bold space-y-0.5">
            {config?.business_rfc && <p>RFC: {config.business_rfc}</p>}
            {config?.business_address && <p>Dirección: {config.business_address}</p>}
            {config?.business_phone && <p>Teléfono: {config.business_phone}</p>}
          </div>
        </div>
        <div className="text-right">
          <div className="bg-rose-500 text-white px-4 py-2 rounded-xl mb-3 inline-block">
            <h2 className="text-xs font-black tracking-widest uppercase text-center">Auditoría de Inventario</h2>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fecha de Emisión</p>
          <p className="font-bold text-slate-700">{fecha}</p>
        </div>
      </div>

      {/* Resumen del Conteo */}
      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8 grid grid-cols-4 gap-4">
        <div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Categoría</span>
          <span className="text-sm font-black text-slate-800 uppercase">{categoria}</span>
        </div>
        <div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Total Productos</span>
          <span className="text-sm font-black text-slate-800">{total}</span>
        </div>
        <div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Avance de Conteo</span>
          <span className="text-sm font-black text-slate-800">{contados} de {total} ({((contados / total) * 100).toFixed(0)}% contados, {pendientes} pendientes)</span>
        </div>
        <div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Discrepancias</span>
          <span className="text-sm font-black text-rose-600">{diferencias}</span>
        </div>
      </div>

      {/* Tabla de Productos */}
      <h3 className="text-sm font-black text-slate-800 mb-4 uppercase tracking-wider">Detalle del Conteo</h3>
      <table className="w-full text-left border-collapse mb-12">
        <thead>
          <tr className="bg-slate-100 border-b border-slate-200">
            <th className="px-4 py-2.5 text-[9px] font-black text-slate-500 uppercase tracking-widest w-24">SKU</th>
            <th className="px-4 py-2.5 text-[9px] font-black text-slate-500 uppercase tracking-widest">Descripción</th>
            <th className="px-4 py-2.5 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Stock Esperado</th>
            <th className="px-4 py-2.5 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Stock Contado</th>
            <th className="px-4 py-2.5 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Diferencia</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-[11px]">
          {productos.map((p) => {
            const diff = p.cantidad_contada !== null ? p.cantidad_contada - p.stock_actual : 0;
            return (
              <tr key={p.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-2.5 font-mono text-slate-500 font-bold">{p.sku}</td>
                <td className="px-4 py-2.5 font-bold text-slate-800">{p.descripcion}</td>
                <td className="px-4 py-2.5 text-center font-bold text-slate-600">{p.stock_actual} {p.unidad}</td>
                <td className="px-4 py-2.5 text-center font-bold text-slate-700">
                  {p.cantidad_contada === null ? 'Pendiente' : `${p.cantidad_contada} ${p.unidad}`}
                </td>
                <td className="px-4 py-2.5 text-center font-bold">
                  {p.cantidad_contada === null ? (
                    <span className="text-slate-400">-</span>
                  ) : diff === 0 ? (
                    <span className="text-emerald-600">Coincide</span>
                  ) : diff > 0 ? (
                    <span className="text-indigo-600">+{diff} (Sobrante)</span>
                  ) : (
                    <span className="text-red-600">{diff} (Faltante)</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Firmas */}
      <div className="mt-auto pt-16 grid grid-cols-2 gap-8 text-center">
        <div>
          <div className="border-t border-slate-300 w-48 mx-auto mt-8 pt-2">
            <p className="font-bold text-slate-700">Firma del Auditor</p>
            <p className="text-[9px] text-slate-400 uppercase tracking-widest">Responsable de Inventario</p>
          </div>
        </div>
        <div>
          <div className="border-t border-slate-300 w-48 mx-auto mt-8 pt-2">
            <p className="font-bold text-slate-700">Firma de Conformidad</p>
            <p className="text-[9px] text-slate-400 uppercase tracking-widest">Administrador / Gerente</p>
          </div>
        </div>
      </div>
    </div>
  );
});

ReporteConteoComponent.displayName = 'ReporteConteoComponent';

export default function Inventory() {
  const [activeTab, setActiveTab] = useState<'CATALOGO' | 'PROVEEDORES' | 'COMPRAS' | 'CONTEOS'>('CATALOGO');
  
  // Conteos State
  const [conteoActivo, setConteoActivo] = useState(false);
  const [conteoCategoria, setConteoCategoria] = useState('TODOS');
  const [conteoProductos, setConteoProductos] = useState<CycleCountItem[]>([]);
  const [cycleSearchTerm, setCycleSearchTerm] = useState('');
  const [savingConteo, setSavingConteo] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [cycleSubTab, setCycleSubTab] = useState<'NUEVO' | 'HISTORIAL'>('NUEVO');
  const [adjustmentsHistory, setAdjustmentsHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyPage, setHistoryPage] = useState(1);

  const [businessConfig, setBusinessConfig] = useState<BusinessConfig | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [fechaEmision, setFechaEmision] = useState('');

  // Load business configuration
  useEffect(() => {
    api.get('/admin/config')
      .then(res => setBusinessConfig(res.data.data))
      .catch(err => console.error('Error fetching business config:', err));
  }, []);

  const fetchAdjustmentsHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.get('/admin/inventory/adjustments');
      setAdjustmentsHistory(res.data.data || []);
    } catch (err) {
      console.error('Error fetching adjustments history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'CONTEOS' && cycleSubTab === 'HISTORIAL') {
      fetchAdjustmentsHistory();
    }
  }, [activeTab, cycleSubTab]);

  const handleExportCSV = (data: any[], filename: string, headers: { key: string; label: string }[]) => {
    const csvContent = [
      headers.map(h => `"${h.label.replace(/"/g, '""')}"`).join(','),
      ...data.map(row => 
        headers.map(h => {
          const resolveVal = h.key.split('.').reduce((obj: any, key) => obj?.[key], row);
          const str = resolveVal !== undefined && resolveVal !== null ? String(resolveVal) : '';
          return `"${str.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Catálogo State
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAjusteModal, setShowAjusteModal] = useState(false);
  const [selectedForAjuste, setSelectedForAjuste] = useState<Product | null>(null);
  const [ajusteData, setAjusteData] = useState({ cantidad: '', motivo: 'Ajuste de inventario' });
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    sku: '', descripcion: '', precio_venta: '', precio_costo: '', 
    stock_actual: '0', stock_minimo: '5', stock_maximo: '20', 
    categoria: '', unidad: 'PZ'
  });
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [selectedForEdit, setSelectedForEdit] = useState<Product | null>(null);
  const [editProductData, setEditProductData] = useState({
    sku: '', descripcion: '', precio_venta: '', precio_costo: '', 
    stock_actual: '', stock_minimo: '', stock_maximo: '', 
    categoria: '', unidad: ''
  });

  // Proveedores State
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [showAddProveedor, setShowAddProveedor] = useState(false);
  const [showAddVisita, setShowAddVisita] = useState(false);
  const [newProv, setNewProv] = useState({ nombre: '', contacto: '', telefono: '', email: '' });
  const [newVisita, setNewVisita] = useState({ id_proveedor: '', fecha_visita: '', notas: '' });

  // Compras State
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [purchaseCart, setPurchaseCart] = useState<(Product & { cant_comprar: number, costo_unitario: number })[]>([]);
  const [selectedProveedor, setSelectedProveedor] = useState<string>('');

  interface PurchaseItem extends Product {
    cant_comprar: number;
    costo_unitario: number;
  }

  const existingCategories = Array.from(new Set((products || []).map(p => p.categoria))).filter(Boolean).sort();

    const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      if (lines.length <= 1) {
        alert("El archivo est vaco o solo tiene encabezados.");
        return;
      }

      const parsedProducts = [];
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',');
        parsedProducts.push({
          sku: row[0]?.trim(),
          descripcion: row[1]?.trim(),
          precio_venta: row[2]?.trim(),
          precio_costo: row[3]?.trim(),
          stock_actual: row[4]?.trim(),
          categoria: row[5]?.trim(),
          unidad: row[6]?.trim()
        });
      }

      try {
        const res = await api.post('/admin/inventory/import', { products: parsedProducts });
        alert(`CSV Importado!\n\nImportados/Actualizados: ${res.data.importados}\nErrores: ${res.data.errores}`);
        fetchProducts();
      } catch (err) {
        console.error(err);
        alert("Error importando productos del CSV.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.get(`/ventas/productos?q=${searchTerm}&limit=all`);
      setProducts(res.data.data || []);
    } catch {
      console.error('Error fetching products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  const fetchProveedores = useCallback(async () => {
    try {
      const res = await api.get('/proveedores');
      setProveedores(res.data.data || []);
      const resV = await api.get('/proveedores/visitas');
      setVisitas(resV.data.data || []);
    } catch {
      console.error('Error fetching proveedores');
      setProveedores([]);
      setVisitas([]);
    }
  }, []);

  const fetchSuggestions = useCallback(async () => {
    try {
      const res = await api.get('/compras/sugerencias');
      const data = res.data.data || [];
      setSuggestions(data);
      // Auto-fill cart with suggestions
      const initialCart = data.map((p: Product) => ({
        ...p,
        cant_comprar: p.cantidad_sugerida || 0,
        costo_unitario: p.precio_costo || 0
      })).filter((p: PurchaseItem) => p.cant_comprar > 0);
      setPurchaseCart(initialCart);
    } catch {
      console.error('Error fetching suggestions');
      setSuggestions([]);
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    if (activeTab === 'CATALOGO' || activeTab === 'COMPRAS') {
      fetchProducts();
    }
  }, [activeTab, searchTerm, fetchProducts]);

  useEffect(() => {
    if (activeTab === 'PROVEEDORES' || activeTab === 'COMPRAS') {
      fetchProveedores();
    }
    if (activeTab === 'COMPRAS') {
      fetchSuggestions();
    }
  }, [activeTab, fetchProveedores, fetchSuggestions]);

  // --- Handlers Proveedores ---
  const handleSaveProveedor = async () => {
    if (!newProv.nombre) return alert('El nombre es obligatorio');
    try {
      await api.post('/proveedores', newProv);
      setShowAddProveedor(false);
      setNewProv({ nombre: '', contacto: '', telefono: '', email: '' });
      fetchProveedores();
    } catch {
      alert('Error al guardar proveedor');
    }
  };

  const handleSaveVisita = async () => {
    if (!newVisita.id_proveedor || !newVisita.fecha_visita) return alert('Proveedor y fecha son obligatorios');
    try {
      await api.post('/proveedores/visitas', newVisita);
      setShowAddVisita(false);
      setNewVisita({ id_proveedor: '', fecha_visita: '', notas: '' });
      fetchProveedores();
    } catch {
      alert('Error al agendar visita');
    }
  };

  const handleAjusteStock = async () => {
    if (!selectedForAjuste || !ajusteData.cantidad) return;
    
    const qty = Number(ajusteData.cantidad);
    const newStock = selectedForAjuste.stock_actual + qty;
    
    if (newStock < 0) {
      alert(`No se puede realizar el ajuste. El stock final no puede ser negativo. (Stock actual: ${selectedForAjuste.stock_actual})`);
      return;
    }

    if (!window.confirm(`¿Estás seguro de realizar este ajuste manual? Esta acción afectará el stock real y quedará registrada bajo tu usuario.`)) {
      return;
    }

    try {
      await api.patch('/admin/inventory/adjust', {
        id_producto: selectedForAjuste.id,
        cantidad: qty,
        motivo: ajusteData.motivo
      });
      setShowAjusteModal(false);
      setAjusteData({ cantidad: '', motivo: 'Ajuste de inventario' });
      fetchProducts();
      alert('¡Ajuste realizado y registrado correctamente!');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response: { data: { message: string } } };
        alert(axiosErr.response?.data?.message || 'Error al ajustar inventario');
      } else {
        alert('Error al ajustar inventario');
      }
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.sku || !newProduct.descripcion || !newProduct.precio_venta) {
      alert('Por favor completa los campos obligatorios (SKU, Descripción, Precio)');
      return;
    }
    try {
      await api.post('/admin/inventory/products', newProduct);
      setShowAddProductModal(false);
      setNewProduct({
        sku: '', descripcion: '', precio_venta: '', precio_costo: '', 
        stock_actual: '0', stock_minimo: '5', stock_maximo: '20', 
        categoria: '', unidad: 'PZ'
      });
      fetchProducts();
      alert('¡Producto creado exitosamente!');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response: { data: { message: string } } };
        alert(axiosErr.response?.data?.message || 'Error al crear producto');
      } else {
        alert('Error al crear producto');
      }
    }
  };

  const handleUpdateProduct = async () => {
    if (!selectedForEdit) return;
    if (!editProductData.sku || !editProductData.descripcion || !editProductData.precio_venta) {
      alert('Por favor completa los campos obligatorios');
      return;
    }
    if (!window.confirm(`¿Estás seguro de actualizar este producto? Si modificaste el stock físico, se registrará un ajuste manual bajo tu usuario.`)) {
      return;
    }
    try {
      await api.put(`/admin/inventory/products/${selectedForEdit.id}`, editProductData);
      setShowEditProductModal(false);
      fetchProducts();
      alert('¡Producto actualizado exitosamente!');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response: { data: { message: string } } };
        alert(axiosErr.response?.data?.message || 'Error al actualizar producto');
      } else {
        alert('Error al actualizar producto');
      }
    }
  };

  // --- Handlers Compras ---
  const handleUpdateCart = (id: number, field: 'cant_comprar' | 'costo_unitario', value: number) => {
    setPurchaseCart(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleSubmitPurchase = async () => {
    if (purchaseCart.length === 0) return alert('No hay productos a comprar');

    const total_compra = purchaseCart.reduce((acc, p) => acc + (p.cant_comprar * p.costo_unitario), 0);
    const payload = {
      id_proveedor: selectedProveedor ? Number(selectedProveedor) : null,
      total_compra,
      items: purchaseCart.map(p => ({
        id_producto: p.id,
        cantidad: p.cant_comprar,
        precio_costo: p.costo_unitario,
        subtotal: p.cant_comprar * p.costo_unitario
      }))
    };

    try {
      await api.post('/compras', payload);
      alert('¡Compra registrada! Stock actualizado exitosamente.');
      setPurchaseCart([]);
      setSelectedProveedor('');
      setActiveTab('CATALOGO'); // Regresar al catálogo para ver los cambios
    } catch {
      alert('Error al procesar la compra');
    }
  };

  // --- Handlers Conteos Cíclicos ---
  const handlePrintReport = useReactToPrint({
    contentRef: printRef,
  });

  const handleIniciarConteo = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ventas/productos?limit=all');
      const allProds = res.data.data || [];
      const filtered = conteoCategoria === 'TODOS' 
        ? allProds 
        : allProds.filter((p: Product) => p.categoria === conteoCategoria);

      const items: CycleCountItem[] = filtered.map((p: Product) => ({
        id: p.id,
        sku: p.sku,
        descripcion: p.descripcion,
        categoria: p.categoria,
        stock_actual: p.stock_actual,
        cantidad_contada: null,
        unidad: p.unidad
      }));

      setConteoProductos(items);
      setConteoActivo(true);
      setCycleSearchTerm('');
    } catch (err) {
      alert('Error al iniciar la sesión de conteo');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConteoQty = (id: number, value: number | null) => {
    setConteoProductos(prev => prev.map(p => p.id === id ? { ...p, cantidad_contada: value } : p));
  };

  const handleFinalizarConteo = async () => {
    const total = conteoProductos.length;
    const contados = conteoProductos.filter(p => p.cantidad_contada !== null).length;
    const pendientes = total - contados;

    // Warn if incomplete
    if (pendientes > 0) {
      if (!window.confirm(`La sesión de conteo está incompleta. Hay ${pendientes} producto(s) sin contar de un total de ${total}.\n\n¿Deseas finalizar la sesión y generar el reporte PDF con el estado actual?`)) {
        return;
      }
    } else {
      if (!window.confirm(`¿Deseas finalizar la sesión de conteo y generar el reporte PDF?`)) {
        return;
      }
    }

    // 1. Generate date & print report
    const nowStr = new Date().toLocaleString('es-MX', { 
      dateStyle: 'medium', 
      timeStyle: 'short' 
    });
    setFechaEmision(nowStr);

    // Trigger print helper
    setTimeout(() => {
      handlePrintReport();
    }, 150);

    // 2. Identify discrepancies
    const discrepancies = conteoProductos.filter(p => p.cantidad_contada !== null && p.cantidad_contada !== p.stock_actual);

    if (discrepancies.length === 0) {
      alert('No se detectaron diferencias en los productos contados. Reporte generado.');
      setConteoActivo(false);
      setConteoProductos([]);
      setActiveTab('CATALOGO');
      return;
    }

    const summary = discrepancies.map(p => {
      const diff = p.cantidad_contada! - p.stock_actual;
      const sign = diff > 0 ? '+' : '';
      return `- ${p.descripcion} (SKU: ${p.sku}): Stock Esperado: ${p.stock_actual}, Contado: ${p.cantidad_contada} (Diferencia: ${sign}${diff} ${p.unidad})`;
    }).join('\n');

    if (!window.confirm(`Se generó el reporte. Se detectaron diferencias en ${discrepancies.length} producto(s):\n\n${summary}\n\n¿Deseas aplicar estos ajustes al inventario real en la base de datos?`)) {
      // End session without applying adjustments
      setConteoActivo(false);
      setConteoProductos([]);
      setActiveTab('CATALOGO');
      return;
    }

    setSavingConteo(true);
    try {
      const adjustments = discrepancies.map(p => ({
        id_producto: p.id,
        cantidad: p.cantidad_contada! - p.stock_actual,
        motivo: `Conteo Cíclico - Categoría: ${conteoCategoria}`
      }));

      await api.post('/admin/inventory/bulk-adjust', { adjustments });
      alert('¡Ajustes de inventario aplicados con éxito!');
      setConteoActivo(false);
      setConteoProductos([]);
      fetchProducts();
      setActiveTab('CATALOGO');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al aplicar ajustes de conteo cíclico');
    } finally {
      setSavingConteo(false);
    }
  };

  const handleCancelarConteo = () => {
    if (window.confirm('¿Estás seguro de cancelar la sesión de conteo actual? Se perderán todos los datos ingresados y no se modificará el stock.')) {
      setConteoActivo(false);
      setConteoProductos([]);
      setCycleSearchTerm('');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-4xl font-black text-[var(--text-main)] tracking-tight italic">Logística e Inventario</h2>
          <p className="text-[var(--text-muted)] font-medium">Control total sobre almacén, compras y proveedores.</p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-4 mb-8 border-b border-slate-200 pb-2">
        <button 
          onClick={() => setActiveTab('CATALOGO')}
          className={`pb-4 px-4 font-bold text-sm tracking-widest uppercase transition-all ${activeTab === 'CATALOGO' ? 'border-b-4 border-emerald-500 text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <div className="flex items-center gap-2"><Package className="w-4 h-4"/> Catálogo</div>
        </button>
        <button 
          onClick={() => setActiveTab('COMPRAS')}
          className={`pb-4 px-4 font-bold text-sm tracking-widest uppercase transition-all ${activeTab === 'COMPRAS' ? 'border-b-4 border-indigo-500 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <div className="flex items-center gap-2"><ShoppingCart className="w-4 h-4"/> Entradas (Compras)</div>
        </button>
        <button 
          onClick={() => setActiveTab('PROVEEDORES')}
          className={`pb-4 px-4 font-bold text-sm tracking-widest uppercase transition-all ${activeTab === 'PROVEEDORES' ? 'border-b-4 border-amber-500 text-amber-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <div className="flex items-center gap-2"><Users className="w-4 h-4"/> Proveedores</div>
        </button>
        <button 
          onClick={() => setActiveTab('CONTEOS')}
          className={`pb-4 px-4 font-bold text-sm tracking-widest uppercase transition-all ${activeTab === 'CONTEOS' ? 'border-b-4 border-rose-500 text-rose-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <div className="flex items-center gap-2"><RefreshCw className="w-4 h-4"/> Conteos Cíclicos</div>
        </button>
      </div>

      {/* --- TAB: CATÁLOGO --- */}
      {activeTab === 'CATALOGO' && (
        <div className="animate-in slide-in-from-right-4 duration-300">
          <div className="flex gap-3 mb-8">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, SKU o categoría..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
              />
            </div>
            <button className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 text-slate-500 transition-all">
              <Filter className="w-6 h-6" />
            </button>
            <button 
              onClick={() => handleExportCSV(
                products,
                'catalogo_productos',
                [
                  { key: 'sku', label: 'SKU' },
                  { key: 'descripcion', label: 'Descripción' },
                  { key: 'categoria', label: 'Categoría' },
                  { key: 'precio_venta', label: 'Precio de Venta' },
                  { key: 'precio_costo', label: 'Precio de Costo' },
                  { key: 'stock_actual', label: 'Stock Actual' },
                  { key: 'stock_minimo', label: 'Stock Mínimo' },
                  { key: 'stock_maximo', label: 'Stock Máximo' },
                  { key: 'unidad', label: 'Unidad' }
                ]
              )}
              className="bg-slate-100 text-slate-700 px-6 py-3 rounded-2xl font-black text-xs hover:bg-slate-200 transition-all flex items-center gap-2"
              title="Exportar Catálogo a Excel/CSV"
            >
              <Download className="w-4 h-4" /> EXPORTAR EXCEL
            </button>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} accept=".csv" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-indigo-500 text-white px-8 py-3 rounded-2xl font-black text-xs hover:bg-indigo-600 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              <Upload className="w-4 h-4" /> IMPORTAR CSV
            </button>
            <button
              onClick={() => setShowAddProductModal(true)}
              className="bg-emerald-500 text-white px-8 py-3 rounded-2xl font-black text-xs hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" /> NUEVO PRODUCTO
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-[var(--bg-card)] p-6 rounded-[2.5rem] border border-[var(--border-color)] shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                <Package className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Total Productos</p>
                <p className="text-2xl font-black text-[var(--text-main)]">{(products || []).length}</p>
              </div>
            </div>
            <div className="bg-[var(--bg-card)] p-6 rounded-[2.5rem] border border-[var(--border-color)] shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Bajo Stock</p>
                <p className="text-2xl font-black text-[var(--text-main)]">
                  {(products || []).filter(p => p.stock_actual <= p.stock_minimo).length}
                </p>
              </div>
            </div>
            <div className="bg-[var(--bg-card)] p-6 rounded-[2.5rem] border border-[var(--border-color)] shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                <TrendingUp className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Valor Inventario</p>
                <p className="text-2xl font-black text-[var(--text-main)]">
                  ${(products || []).reduce((acc, p) => acc + (p.precio_venta * p.stock_actual), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border-color)] shadow-xl overflow-hidden">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse relative">
                <thead className="sticky top-0 bg-[var(--bg-card)] z-10 shadow-sm">
                  <tr className="bg-[var(--bg-main)] border-b border-[var(--border-color)]">
                    <th 
                      className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-emerald-500 transition-colors"
                      onClick={() => setSortConfig({ key: 'descripcion', direction: sortConfig?.key === 'descripcion' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                    >
                      <div className="flex items-center gap-1">
                        Producto {sortConfig?.key === 'descripcion' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>)}
                      </div>
                    </th>
                    <th 
                      className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center cursor-pointer hover:text-emerald-500 transition-colors"
                      onClick={() => setSortConfig({ key: 'categoria', direction: sortConfig?.key === 'categoria' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Categoría {sortConfig?.key === 'categoria' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>)}
                      </div>
                    </th>
                    <th 
                      className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right cursor-pointer hover:text-emerald-500 transition-colors"
                      onClick={() => setSortConfig({ key: 'precio_venta', direction: sortConfig?.key === 'precio_venta' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Precio {sortConfig?.key === 'precio_venta' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>)}
                      </div>
                    </th>
                    <th 
                      className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right cursor-pointer hover:text-emerald-500 transition-colors"
                      onClick={() => setSortConfig({ key: 'precio_costo', direction: sortConfig?.key === 'precio_costo' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Costo {sortConfig?.key === 'precio_costo' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>)}
                      </div>
                    </th>
                    <th 
                      className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center cursor-pointer hover:text-emerald-500 transition-colors"
                      onClick={() => setSortConfig({ key: 'stock_actual', direction: sortConfig?.key === 'stock_actual' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Stock {sortConfig?.key === 'stock_actual' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>)}
                      </div>
                    </th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-bold">Cargando catálogo...</td></tr>
                  ) : (() => {
                    const filteredAndSorted = (products || [])
                      .filter(p => 
                        p.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.categoria.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .sort((a, b) => {
                        if (sortConfig) {
                          const aValue = a[sortConfig.key as keyof Product];
                          const bValue = b[sortConfig.key as keyof Product];
                          
                          const aVal = aValue !== null && aValue !== undefined ? aValue : '';
                          const bVal = bValue !== null && bValue !== undefined ? bValue : '';
                          
                          if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                          if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                          return 0;
                        }

                        const aCritical = a.stock_actual <= a.stock_minimo;
                        const bCritical = b.stock_actual <= b.stock_minimo;
                        if (aCritical && !bCritical) return -1;
                        if (!aCritical && bCritical) return 1;
                        // Si ambos están en el mismo estado, ordenar por el que tiene menos stock relativo
                        return (a.stock_actual / (a.stock_minimo || 1)) - (b.stock_actual / (b.stock_minimo || 1));
                      });

                    const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
                    const paginated = filteredAndSorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

                    return (
                      <>
                        {paginated.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className={clsx(
                              "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                              p.stock_actual <= p.stock_minimo 
                                ? "bg-red-50 text-red-500 group-hover:bg-red-500 group-hover:text-white" 
                                : "bg-slate-100 text-slate-400 group-hover:bg-emerald-500 group-hover:text-white"
                            )}>
                              <Package className="w-6 h-6" />
                            </div>
                            <div>
                              <p className={clsx(
                                "font-black transition-colors",
                                p.stock_actual <= p.stock_minimo ? "text-red-700" : "text-slate-800 group-hover:text-emerald-600"
                              )}>{p.descripcion}</p>
                              <p className="text-xs text-slate-400 font-bold tracking-tight">SKU: {p.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-wider">{p.categoria}</span>
                        </td>
                        <td className="px-8 py-6 text-right font-black text-slate-700">${p.precio_venta}</td>
                        <td className="px-8 py-6 text-right font-bold text-slate-500">${p.precio_costo?.toFixed(2) || '0.00'}</td>
                        <td className="px-8 py-6 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={clsx(
                              "px-4 py-1 rounded-full text-xs font-black",
                              p.stock_actual <= p.stock_minimo ? "bg-red-100 text-red-600 animate-pulse" : "bg-emerald-100 text-emerald-600"
                            )}>
                              {p.stock_actual} {p.unidad}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Min: {p.stock_minimo}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right flex items-center justify-end gap-2">
                          <button 
                            onClick={() => { 
                              setSelectedForEdit(p);
                              setEditProductData({
                                sku: p.sku,
                                descripcion: p.descripcion,
                                precio_venta: p.precio_venta.toString(),
                                precio_costo: p.precio_costo?.toString() || '0',
                                stock_actual: p.stock_actual.toString(),
                                stock_minimo: p.stock_minimo.toString(),
                                stock_maximo: p.stock_maximo.toString(),
                                categoria: p.categoria,
                                unidad: p.unidad
                              });
                              setShowEditProductModal(true); 
                            }}
                            className="p-2 bg-slate-100 hover:bg-emerald-500 hover:text-white text-slate-600 rounded-xl transition-all"
                            title="Editar Maestro"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => { setSelectedForAjuste(p); setShowAjusteModal(true); }}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-600 rounded-xl text-xs font-black transition-all"
                          >
                            AJUSTAR
                          </button>
                        </td>
                      </tr>
                        ))}
                        {totalPages > 1 && (
                          <tr>
                            <td colSpan={6} className="px-8 py-4 bg-slate-50/30">
                              <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                  Mostrando {paginated.length} de {filteredAndSorted.length} productos
                                </p>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black disabled:opacity-50 hover:bg-slate-100 transition-all uppercase"
                                  >
                                    Anterior
                                  </button>
                                  <div className="flex items-center px-4 text-[10px] font-black text-slate-700">
                                    Página {currentPage} de {totalPages}
                                  </div>
                                  <button 
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black disabled:opacity-50 hover:bg-slate-800 transition-all uppercase"
                                  >
                                    Siguiente
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: COMPRAS --- */}
      {activeTab === 'COMPRAS' && (
        <div className="animate-in slide-in-from-right-4 duration-300">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2">
              <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl mb-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <TrendingUp className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800">Sugerencias de Resurtido</h3>
                    <p className="text-slate-500 font-medium">Basado en máximos, mínimos y ventas recientes.</p>
                  </div>
                </div>

                {suggestions.length === 0 ? (
                  <div className="p-10 text-center bg-slate-50 rounded-[2rem] border border-slate-100">
                    <p className="font-bold text-slate-400">Todo el inventario está en niveles óptimos.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(suggestions || []).map(p => {
                      const inCart = purchaseCart.find(c => c.id === p.id);
                      return (
                        <div key={p.id} className="flex flex-col md:flex-row justify-between items-center bg-slate-50 p-4 rounded-3xl border border-slate-100 gap-4">
                          <div className="flex-1">
                            <p className="font-black text-slate-800 text-lg">{p.descripcion}</p>
                            <p className="text-xs font-bold uppercase tracking-widest mt-1">
                              <span className="text-red-500">Stock: {p.stock_actual} {p.unidad}</span>
                              <span className="text-slate-400 ml-2">| Vendidos (7d): {p.ventas_semana || 0}</span>
                              {p.ultima_compra && (
                                <span className="text-indigo-400 ml-2">| Últ. Compra: {new Date(p.ultima_compra).toLocaleDateString()}</span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm">
                            <div className="flex flex-col items-center px-4">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sugerido</span>
                              <span className="font-black text-indigo-600 text-xl">{p.cantidad_sugerida}</span>
                            </div>
                            {!inCart ? (
                              <button 
                                onClick={() => setPurchaseCart([...purchaseCart, { ...p, cant_comprar: p.cantidad_sugerida || 0, costo_unitario: p.precio_costo || 0 }])}
                                className="w-12 h-12 bg-indigo-50 hover:bg-indigo-500 hover:text-white text-indigo-600 rounded-xl flex items-center justify-center transition-all"
                              >
                                <Plus className="w-6 h-6" />
                              </button>
                            ) : (
                              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                                <Check className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* --- Búsqueda Manual para Entradas --- */}
                <div className="mt-8 border-t border-slate-100 pt-8">
                  <h4 className="text-lg font-black text-slate-800 mb-4">Agregar otro producto</h4>
                  <div className="relative mb-4">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por nombre o SKU para agregar manualmente..."
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                    />
                  </div>
                  
                  {searchTerm && (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {(products || []).length === 0 ? (
                        <p className="text-center text-slate-400 text-sm py-4">No se encontraron productos</p>
                      ) : (
                        (products || []).filter(p => p.descripcion.toLowerCase().includes(searchTerm.toLowerCase())).map(p => {
                          const inCart = purchaseCart.find(c => c.id === p.id);
                          return (
                            <div key={p.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition-all group">
                              <div>
                                <p className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{p.descripcion}</p>
                                <p className="text-[10px] text-slate-400 font-black uppercase">Stock Actual: {p.stock_actual} {p.unidad}</p>
                              </div>
                              {!inCart ? (
                                <button 
                                  onClick={() => setPurchaseCart([...purchaseCart, { ...p, cant_comprar: 1, costo_unitario: p.precio_costo || 0 }])}
                                  className="px-4 py-2 bg-slate-100 hover:bg-indigo-500 hover:text-white text-slate-600 font-bold rounded-lg transition-all text-xs"
                                >
                                  Agregar
                                </button>
                              ) : (
                                <span className="text-emerald-500 font-bold text-xs flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg"><Check className="w-4 h-4"/> Agregado</span>
                              )}
                            </div>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar de Registro de Compra */}
            <div className="xl:col-span-1">
              <div className="bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl sticky top-8">
                <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                  <ShoppingCart className="text-emerald-400" />
                  Nueva Entrada
                </h3>

                <div className="mb-6">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Proveedor</label>
                  <select 
                    value={selectedProveedor}
                    onChange={(e) => setSelectedProveedor(e.target.value)}
                    className="w-full bg-slate-800 border-0 rounded-2xl p-4 font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Ninguno / Compra Directa</option>
                    {(proveedores || []).map(prov => (
                      <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4 mb-8 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar-dark">
                  {(purchaseCart || []).map(item => (
                    <div key={item.id} className="bg-slate-800 p-4 rounded-2xl border border-slate-700 relative">
                      <button 
                        onClick={() => setPurchaseCart(purchaseCart.filter(p => p.id !== item.id))}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <p className="font-bold text-sm mb-3 truncate pr-4">{item.descripcion}</p>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-[9px] text-slate-400 uppercase mb-1">Cant.</label>
                          <input 
                            type="number" 
                            min="1"
                            value={item.cant_comprar}
                            onChange={(e) => handleUpdateCart(item.id, 'cant_comprar', parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-900 border-0 rounded-xl p-2 text-center font-mono text-sm outline-none"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-[9px] text-slate-400 uppercase mb-1">Costo Unit.</label>
                          <input 
                            type="number" 
                            step="0.01"
                            value={item.costo_unitario}
                            onChange={(e) => handleUpdateCart(item.id, 'costo_unitario', parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-900 border-0 rounded-xl p-2 text-center font-mono text-sm outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {purchaseCart.length === 0 && (
                    <p className="text-center text-slate-500 text-sm py-4">Agrega productos para registrar entrada</p>
                  )}
                </div>

                <div className="border-t border-slate-800 pt-6">
                  <div className="flex justify-between items-end mb-6">
                    <span className="text-slate-400 font-bold">TOTAL COMPRA</span>
                    <span className="text-3xl font-black text-emerald-400">
                      ${(purchaseCart || []).reduce((acc, item) => acc + (item.cant_comprar * item.costo_unitario), 0).toFixed(2)}
                    </span>
                  </div>
                  <button 
                    onClick={handleSubmitPurchase}
                    className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Registrar Entrada
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: PROVEEDORES --- */}
      {activeTab === 'PROVEEDORES' && (
        <div className="animate-in slide-in-from-right-4 duration-300">
          
          {/* Seccion Calendario / Timeline */}
          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl mb-12">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-black text-slate-800">Calendario de Visitas</h3>
                <p className="text-slate-500 font-medium">Historial y próximas visitas programadas.</p>
              </div>
              <button 
                onClick={() => setShowAddVisita(true)}
                className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-100 transition-all"
              >
                <Plus className="w-5 h-5" /> AGENDAR VISITA
              </button>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
              {(visitas || []).length === 0 ? (
                <p className="text-slate-400 text-sm font-bold w-full text-center py-6">No hay visitas registradas aún.</p>
              ) : (visitas || []).map(v => {
                const date = new Date(v.fecha_visita);
                const isPast = date < new Date();
                return (
                  <div key={v.id} className={`min-w-[200px] flex-shrink-0 p-5 rounded-[2rem] border-2 flex flex-col gap-2 ${isPast ? 'bg-slate-50 border-slate-100' : 'bg-indigo-50 border-indigo-200'}`}>
                    <div className="flex justify-between items-start">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${isPast ? 'bg-slate-200 text-slate-500' : 'bg-indigo-200 text-indigo-700'}`}>
                        {isPast ? 'COMPLETADA' : 'PROGRAMADA'}
                      </span>
                    </div>
                    <p className="text-xl font-black text-slate-800 mt-2">{v.proveedor?.nombre}</p>
                    <p className={`text-sm font-bold ${isPast ? 'text-slate-400' : 'text-indigo-600'}`}>
                      {date.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                    {v.notas && <p className="text-xs text-slate-500 line-clamp-2 mt-2">{v.notas}</p>}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black text-slate-800">Directorio de Proveedores</h3>
            <button 
              onClick={() => setShowAddProveedor(true)}
              className="px-6 py-3 bg-amber-500 text-white rounded-2xl font-black flex items-center gap-2 hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-5 h-5" /> NUEVO PROVEEDOR
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(proveedores || []).map(prov => {
              const lastVisita = visitas.find(v => v.id_proveedor === prov.id && new Date(v.fecha_visita) < new Date());
              return (
                <div key={prov.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col group hover:border-amber-500 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-amber-100 group-hover:text-amber-600 transition-all">
                      <Building2 className="w-7 h-7" />
                    </div>
                    {lastVisita && (
                      <div className="text-right">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Última Visita</span>
                        <span className="text-xs font-bold text-emerald-600">{new Date(lastVisita.fecha_visita).toLocaleDateString('es-MX')}</span>
                      </div>
                    )}
                  </div>
                  <h4 className="text-xl font-black text-slate-800 mb-2">{prov.nombre}</h4>
                  <div className="space-y-2 mt-auto">
                    <p className="text-sm font-medium text-slate-500 flex items-center gap-2"><Users className="w-4 h-4 text-slate-400" /> {prov.contacto || 'Sin contacto'}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" /> {prov.telefono || 'Sin teléfono'}
                      </p>
                      {prov.telefono && (
                        <a 
                          href={`https://wa.me/${prov.telefono.replace(/\D/g, '')}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"
                          title="WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Modal Nuevo Proveedor */}
          {showAddProveedor && (
            <div className="absolute inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 animate-in zoom-in-95 duration-200">
                <h3 className="text-2xl font-black text-slate-800 mb-8">Registrar Proveedor</h3>
                <div className="space-y-4 mb-8">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nombre / Empresa *</label>
                    <input 
                      type="text" 
                      value={newProv.nombre}
                      onChange={e => setNewProv({...newProv, nombre: e.target.value})}
                      className="w-full bg-slate-50 border-0 rounded-2xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/20" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Contacto (Vendedor)</label>
                    <input 
                      type="text" 
                      value={newProv.contacto}
                      onChange={e => setNewProv({...newProv, contacto: e.target.value})}
                      className="w-full bg-slate-50 border-0 rounded-2xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/20" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Teléfono</label>
                    <input 
                      type="text" 
                      value={newProv.telefono}
                      onChange={e => setNewProv({...newProv, telefono: e.target.value})}
                      className="w-full bg-slate-50 border-0 rounded-2xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/20" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setShowAddProveedor(false)}
                    className="py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-all"
                  >
                    CANCELAR
                  </button>
                  <button 
                    onClick={handleSaveProveedor}
                    className="py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black transition-all shadow-xl shadow-amber-500/20"
                  >
                    GUARDAR
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Agendar Visita */}
          {showAddVisita && (
            <div className="absolute inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 animate-in zoom-in-95 duration-200">
                <h3 className="text-2xl font-black text-slate-800 mb-8">Agendar Visita</h3>
                <div className="space-y-4 mb-8">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Proveedor *</label>
                    <select 
                      value={newVisita.id_proveedor}
                      onChange={e => setNewVisita({...newVisita, id_proveedor: e.target.value})}
                      className="w-full bg-slate-50 border-0 rounded-2xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/20" 
                    >
                      <option value="">Seleccionar Proveedor</option>
                      {(proveedores || []).map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Fecha *</label>
                    <input 
                      type="date" 
                      value={newVisita.fecha_visita}
                      onChange={e => setNewVisita({...newVisita, fecha_visita: e.target.value})}
                      className="w-full bg-slate-50 border-0 rounded-2xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/20" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Notas (Opcional)</label>
                    <input 
                      type="text" 
                      value={newVisita.notas}
                      onChange={e => setNewVisita({...newVisita, notas: e.target.value})}
                      className="w-full bg-slate-50 border-0 rounded-2xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/20" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setShowAddVisita(false)}
                    className="py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-all"
                  >
                    CANCELAR
                  </button>
                  <button 
                    onClick={handleSaveVisita}
                    className="py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-black transition-all shadow-xl shadow-indigo-500/20"
                  >
                    AGENDAR
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB: CONTEOS --- */}
      {activeTab === 'CONTEOS' && (
        <div className="animate-in slide-in-from-right-4 duration-300">
          {!conteoActivo ? (
            /* Setup Conteo or History */
            <div className="space-y-6">
              {/* Sub-tab navigation */}
              <div className="flex gap-6 border-b border-slate-200 pb-4 max-w-5xl mx-auto">
                <button 
                  onClick={() => setCycleSubTab('NUEVO')}
                  className={clsx(
                    "pb-2 font-black text-xs uppercase tracking-widest transition-all relative",
                    cycleSubTab === 'NUEVO' ? "text-rose-600 after:absolute after:bottom-[-17px] after:left-0 after:right-0 after:h-[4px] after:bg-rose-500 after:rounded-full" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  Nueva Auditoría
                </button>
                <button 
                  onClick={() => setCycleSubTab('HISTORIAL')}
                  className={clsx(
                    "pb-2 font-black text-xs uppercase tracking-widest transition-all relative",
                    cycleSubTab === 'HISTORIAL' ? "text-rose-600 after:absolute after:bottom-[-17px] after:left-0 after:right-0 after:h-[4px] after:bg-rose-500 after:rounded-full" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  Historial de Ajustes
                </button>
              </div>

              {cycleSubTab === 'NUEVO' ? (
                /* Original Setup Box */
                <div className="max-w-2xl mx-auto bg-white rounded-[3rem] border border-slate-200 shadow-xl p-10 mt-6 animate-in fade-in duration-300">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center">
                      <RefreshCw className="w-8 h-8 animate-spin" style={{ animationDuration: '4s' }} />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-slate-800">Conteo Cíclico</h3>
                      <p className="text-slate-500 font-medium">Auditoría rápida y control de stock real.</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-slate-600 text-sm font-medium leading-relaxed mb-8">
                    Esta herramienta te permite auditar de forma rápida las existencias de productos en el almacén.
                    Selecciona una categoría (o todo el inventario) para iniciar la sesión. Podrás ingresar los conteos 
                    físicos reales y el sistema registrará los ajustes correspondientes (entradas/salidas) automáticamente.
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Categoría a Auditar</label>
                      <select
                        value={conteoCategoria}
                        onChange={(e) => setConteoCategoria(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-rose-500/10"
                      >
                        <option value="TODOS">Todas las Categorías (Inventario Completo)</option>
                        {existingCategories.map((cat, idx) => (
                          <option key={idx} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleIniciarConteo}
                      disabled={loading}
                      className="w-full py-5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-black rounded-2xl uppercase tracking-widest transition-all shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2"
                    >
                      {loading ? 'Preparando Auditoría...' : 'Iniciar Sesión de Conteo'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Historial de Ajustes View */
                <div className="max-w-5xl mx-auto bg-white rounded-[3rem] border border-slate-200 shadow-xl p-10 mt-6 animate-in fade-in duration-300">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                      <h3 className="text-2xl font-black text-slate-800">Historial de Ajustes</h3>
                      <p className="text-slate-500 font-medium">Registro de auditorías, mermas y conteos cíclicos anteriores.</p>
                    </div>
                    
                    <div className="flex gap-3 w-full md:w-auto">
                      <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={historySearchTerm}
                          onChange={(e) => {
                            setHistorySearchTerm(e.target.value);
                            setHistoryPage(1);
                          }}
                          placeholder="Buscar SKU o producto..."
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-0 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-rose-500/10"
                        />
                      </div>
                      
                      <button
                        onClick={() => handleExportCSV(
                          adjustmentsHistory,
                          'historial_ajustes_inventario',
                          [
                            { key: 'fecha', label: 'Fecha' },
                            { key: 'producto.sku', label: 'SKU' },
                            { key: 'producto.descripcion', label: 'Producto' },
                            { key: 'producto.categoria', label: 'Categoría' },
                            { key: 'cantidad', label: 'Ajuste' },
                            { key: 'producto.unidad', label: 'Unidad' },
                            { key: 'motivo', label: 'Motivo' },
                            { key: 'usuario.nombre', label: 'Usuario' }
                          ]
                        )}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2"
                        title="Exportar Historial a Excel/CSV"
                      >
                        <Download className="w-4 h-4" /> EXPORTAR
                      </button>
                    </div>
                  </div>

                  {loadingHistory ? (
                    <div className="text-center py-20 text-slate-400 font-bold">
                      <RefreshCw className="w-10 h-10 animate-spin mx-auto mb-4 text-rose-500" />
                      Cargando historial de ajustes...
                    </div>
                  ) : (() => {
                    const filtered = adjustmentsHistory.filter(adj => 
                      adj.producto?.descripcion?.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
                      adj.producto?.sku?.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
                      adj.motivo?.toLowerCase().includes(historySearchTerm.toLowerCase())
                    );

                    const historyItemsPerPage = 10;
                    const totalHistoryPages = Math.ceil(filtered.length / historyItemsPerPage);
                    const paginated = filtered.slice((historyPage - 1) * historyItemsPerPage, historyPage * historyItemsPerPage);

                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-20 text-slate-300 font-bold italic">
                          No se encontraron ajustes de inventario
                        </div>
                      );
                    }

                    return (
                      <div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <th className="pb-4">Fecha</th>
                                <th className="pb-4">SKU</th>
                                <th className="pb-4">Producto</th>
                                <th className="pb-4 text-center">Ajuste</th>
                                <th className="pb-4">Motivo</th>
                                <th className="pb-4">Usuario</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-700">
                              {paginated.map((adj) => {
                                const isPositive = adj.cantidad > 0;
                                return (
                                  <tr key={adj.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 text-slate-400">{new Date(adj.fecha).toLocaleDateString('es-MX', { dateStyle: 'short' })} {new Date(adj.fecha).toLocaleTimeString('es-MX', { timeStyle: 'short' })}</td>
                                    <td className="py-4 text-slate-900">{adj.producto?.sku}</td>
                                    <td className="py-4">
                                      <p className="font-bold">{adj.producto?.descripcion}</p>
                                      <span className="text-[10px] text-slate-400 font-normal uppercase">{adj.producto?.categoria}</span>
                                    </td>
                                    <td className={`py-4 text-center font-black ${isPositive ? 'text-indigo-600' : 'text-rose-600'}`}>
                                      {isPositive ? `+${adj.cantidad}` : adj.cantidad} {adj.producto?.unidad}
                                    </td>
                                    <td className="py-4 text-slate-500 font-medium">{adj.motivo}</td>
                                    <td className="py-4 text-slate-400 font-medium">{adj.usuario?.nombre || 'Admin'}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {totalHistoryPages > 1 && (
                          <div className="flex justify-between items-center mt-8 border-t border-slate-100 pt-6">
                            <span className="text-slate-400 text-xs font-bold">
                              Página {historyPage} de {totalHistoryPages}
                            </span>
                            <div className="flex gap-2">
                              <button
                                disabled={historyPage === 1}
                                onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-600 rounded-xl text-xs font-black transition-all"
                              >
                                Anterior
                              </button>
                              <button
                                disabled={historyPage === totalHistoryPages}
                                onClick={() => setHistoryPage(p => Math.min(totalHistoryPages, p + 1))}
                                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-600 rounded-xl text-xs font-black transition-all"
                              >
                                Siguiente
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          ) : (
            /* Active Conteo Session */
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
              {/* Left Panel: Audit Grid */}
              <div className="xl:col-span-3">
                <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl mb-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                      <h3 className="text-2xl font-black text-slate-800">Productos en Auditoría</h3>
                      <p className="text-slate-500 font-medium">Categoría: <span className="font-bold text-rose-500">{conteoCategoria}</span></p>
                    </div>
                    
                    <div className="relative w-full md:w-80">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={cycleSearchTerm}
                        onChange={(e) => setCycleSearchTerm(e.target.value)}
                        placeholder="Buscar producto por SKU o descripción..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-rose-500/10 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-[60vh] overflow-y-auto custom-scrollbar border border-slate-100 rounded-3xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Producto</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Stock Esperado</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-40">Stock Contado</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Diferencia</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {conteoProductos
                          .filter(p => 
                            p.descripcion.toLowerCase().includes(cycleSearchTerm.toLowerCase()) ||
                            p.sku.toLowerCase().includes(cycleSearchTerm.toLowerCase())
                          )
                          .map(p => {
                            const diff = p.cantidad_contada !== null ? p.cantidad_contada - p.stock_actual : 0;
                            return (
                              <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                  <p className="font-bold text-slate-800">{p.descripcion}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">SKU: {p.sku}</p>
                                </td>
                                <td className="px-6 py-4 text-center font-bold text-slate-600">
                                  {p.stock_actual} {p.unidad}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="N/A"
                                    value={p.cantidad_contada === null ? '' : p.cantidad_contada}
                                    onChange={(e) => {
                                      const val = e.target.value === '' ? null : parseFloat(e.target.value);
                                      handleUpdateConteoQty(p.id, val);
                                    }}
                                    className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-slate-800 focus:bg-white focus:ring-4 focus:ring-rose-500/10 outline-none"
                                  />
                                </td>
                                <td className="px-6 py-4 text-center">
                                  {p.cantidad_contada === null ? (
                                    <span className="px-3 py-1 bg-slate-100 text-slate-400 rounded-lg text-[10px] font-black uppercase">Pendiente</span>
                                  ) : diff === 0 ? (
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-lg text-[10px] font-black uppercase">Coincide</span>
                                  ) : diff > 0 ? (
                                    <span className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-lg text-[10px] font-black uppercase">+{diff} Sobrante</span>
                                  ) : (
                                    <span className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-[10px] font-black uppercase">{diff} Faltante</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  {p.cantidad_contada !== p.stock_actual && (
                                    <button
                                      onClick={() => handleUpdateConteoQty(p.id, p.stock_actual)}
                                      className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-500 hover:text-white text-slate-600 font-bold rounded-lg text-[10px] uppercase transition-all"
                                      title="Auto-completar con stock esperado"
                                    >
                                      Coincidir
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Panel: Progress & Sidebar */}
              <div className="xl:col-span-1">
                <div className="space-y-6 sticky top-8">
                  {/* Status Box */}
                  <div className="bg-slate-900 text-white rounded-[2.5rem] p-6 shadow-2xl border border-slate-800">
                    <h4 className="font-black text-lg mb-4 flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 text-rose-400 animate-spin" style={{ animationDuration: '6s' }} />
                      Progreso de Auditoría
                    </h4>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                          <span>AVANCE DE CONTEO</span>
                          <span>{conteoProductos.filter(p => p.cantidad_contada !== null).length} / {conteoProductos.length}</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2">
                          <div 
                            className="bg-rose-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(conteoProductos.filter(p => p.cantidad_contada !== null).length / conteoProductos.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="bg-slate-800 p-3 rounded-2xl text-center">
                          <span className="text-[9px] font-black text-slate-400 block uppercase">Diferencias</span>
                          <span className="text-xl font-black text-rose-400">
                            {conteoProductos.filter(p => p.cantidad_contada !== null && p.cantidad_contada !== p.stock_actual).length}
                          </span>
                        </div>
                        <div className="bg-slate-800 p-3 rounded-2xl text-center">
                          <span className="text-[9px] font-black text-slate-400 block uppercase">Pendientes</span>
                          <span className="text-xl font-black text-slate-300">
                            {conteoProductos.filter(p => p.cantidad_contada === null).length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pending items checklist */}
                  <div className="bg-white rounded-[2.5rem] p-6 border border-slate-200 shadow-xl max-h-[30vh] overflow-y-auto custom-scrollbar flex flex-col">
                    <h5 className="font-black text-sm text-slate-700 mb-3 uppercase tracking-wider">Productos Pendientes</h5>
                    <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                      {conteoProductos.filter(p => p.cantidad_contada === null).length === 0 ? (
                        <p className="text-xs font-bold text-emerald-600 text-center py-4">¡Todos los productos han sido contados!</p>
                      ) : (
                        conteoProductos.filter(p => p.cantidad_contada === null).map(p => (
                          <div key={p.id} className="text-xs font-bold text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex justify-between items-center">
                            <span className="truncate mr-2">{p.descripcion}</span>
                            <span className="text-[10px] text-slate-400 shrink-0">SKU: {p.sku}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleFinalizarConteo}
                      disabled={savingConteo || conteoProductos.filter(p => p.cantidad_contada !== null).length === 0}
                      className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-black rounded-2xl uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 text-xs text-center"
                    >
                      {savingConteo ? 'Guardando Ajustes...' : 'Aplicar Ajustes'}
                    </button>
                    <button
                      onClick={handleCancelarConteo}
                      className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl uppercase tracking-widest transition-all text-xs text-center"
                    >
                      Cancelar Conteo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Ajuste de Inventario */}
      {showAjusteModal && selectedForAjuste && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-slate-800 mb-2">Ajustar Inventario</h3>
            <p className="text-slate-500 font-medium mb-6">Producto: {selectedForAjuste.descripcion}</p>
            
            <div className="bg-amber-50 border border-amber-200 p-5 rounded-[2rem] mb-8">
              <div className="flex gap-4">
                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                <div>
                  <p className="text-[11px] text-amber-900 font-black uppercase tracking-wider mb-1">Aviso de Responsabilidad</p>
                  <p className="text-xs text-amber-800 font-medium leading-relaxed">
                    Este es un <strong>ajuste manual</strong>. Al proceder, el sistema modificará el stock sin una transacción de venta o compra. Esta acción será auditada bajo tu nombre de usuario.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6 mb-8">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Cantidad (+ para sumar, - para restar)</label>
                <input 
                  type="number" 
                  value={ajusteData.cantidad}
                  onChange={e => setAjusteData({...ajusteData, cantidad: e.target.value})}
                  placeholder="Ej: -5"
                  className="w-full bg-slate-50 border-0 rounded-2xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/20" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Motivo</label>
                <select 
                  value={ajusteData.motivo}
                  onChange={e => setAjusteData({...ajusteData, motivo: e.target.value})}
                  className="w-full bg-slate-50 border-0 rounded-2xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/20" 
                >
                  <option value="Merma (Dañado/Caducado)">🛑 Merma (Dañado/Caducado)</option>
                  <option value="Merma (Robo/Extravío)">⚠️ Merma (Robo/Extravío)</option>
                  <option value="Corrección por Auditoría">🔍 Corrección por Auditoría</option>
                  <option value="Consumo Interno">🏢 Consumo Interno</option>
                  <option value="Devolución a Proveedor">📦 Devolución a Proveedor</option>
                  <option value="Otro">📝 Otro</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setShowAjusteModal(false)}
                className="py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-all"
              >
                CANCELAR
              </button>
              <button 
                onClick={handleAjusteStock}
                className="py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black transition-all shadow-xl shadow-emerald-500/20"
              >
                APLICAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nuevo Producto */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl p-10 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-3xl font-black text-slate-800">Alta de Producto</h3>
                <p className="text-slate-500 font-medium">Registra un nuevo artículo en tu inventario maestro.</p>
              </div>
              <button onClick={() => setShowAddProductModal(false)} className="p-3 bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              {/* Información Básica */}
              <div className="space-y-6">
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Información Básica</h4>
                
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">SKU / Código de Barras*</label>
                    <input 
                      type="text" 
                      value={newProduct.sku}
                      onChange={e => setNewProduct({...newProduct, sku: e.target.value})}
                      placeholder="Escanea o escribe..."
                      className="w-full bg-slate-50 border-0 rounded-2xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/20" 
                    />
                  </div>
                  <button 
                    onClick={() => setNewProduct({...newProduct, sku: Math.random().toString(36).substring(2, 10).toUpperCase()})}
                    className="mt-6 px-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl transition-all"
                    title="Generar SKU Aleatorio"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Descripción del Producto*</label>
                  <input 
                    type="text" 
                    value={newProduct.descripcion}
                    onChange={e => setNewProduct({...newProduct, descripcion: e.target.value})}
                    placeholder="Ej: Coca Cola 600ml"
                    className="w-full bg-slate-50 border-0 rounded-2xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/20" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Categoría</label>
                    <input 
                      list="existing-categories"
                      type="text" 
                      value={newProduct.categoria}
                      onChange={e => setNewProduct({...newProduct, categoria: e.target.value})}
                      placeholder="Ej: Bebidas"
                      className="w-full bg-slate-50 border-0 rounded-2xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/20" 
                    />
                    <datalist id="existing-categories">
                      {existingCategories.map(cat => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Unidad de Medida</label>
                    <select 
                      value={newProduct.unidad}
                      onChange={e => setNewProduct({...newProduct, unidad: e.target.value})}
                      className="w-full bg-slate-50 border-0 rounded-2xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/20" 
                    >
                      <option value="PZ">Pieza (PZ)</option>
                      <option value="KG">Kilogramo (KG)</option>
                      <option value="LT">Litro (LT)</option>
                      <option value="CAJA">Caja</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Precios y Stock */}
              <div className="space-y-6">
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Precios y Stock</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Costo de Compra</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                      <input 
                        type="number" 
                        value={newProduct.precio_costo}
                        onChange={e => setNewProduct({...newProduct, precio_costo: e.target.value})}
                        className="w-full bg-slate-50 border-0 rounded-2xl pl-8 p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/20" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Precio de Venta*</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                      <input 
                        type="number" 
                        value={newProduct.precio_venta}
                        onChange={e => setNewProduct({...newProduct, precio_venta: e.target.value})}
                        className="w-full bg-slate-50 border-0 rounded-2xl pl-8 p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/20" 
                      />
                    </div>
                  </div>
                </div>

                {/* Calculador de Margen */}
                {newProduct.precio_venta && newProduct.precio_costo && (
                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex justify-between items-center animate-in fade-in slide-in-from-top-2">
                    <span className="text-xs font-black text-emerald-700 uppercase">Utilidad Estimada:</span>
                    <span className="text-lg font-black text-emerald-600">
                      ${(Number(newProduct.precio_venta) - Number(newProduct.precio_costo)).toFixed(2)} 
                      <span className="text-[10px] ml-2">
                        ({(((Number(newProduct.precio_venta) - Number(newProduct.precio_costo)) / Number(newProduct.precio_venta)) * 100).toFixed(1)}%)
                      </span>
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Stock Inicial</label>
                    <input 
                      type="number" 
                      value={newProduct.stock_actual}
                      onChange={e => setNewProduct({...newProduct, stock_actual: e.target.value})}
                      className="w-full bg-slate-50 border-0 rounded-2xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/20" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-red-400 uppercase mb-2">Minimo</label>
                    <input 
                      type="number" 
                      value={newProduct.stock_minimo}
                      onChange={e => setNewProduct({...newProduct, stock_minimo: e.target.value})}
                      className="w-full bg-red-50/50 border-0 rounded-2xl p-4 font-bold text-red-700 outline-none focus:ring-4 focus:ring-red-500/20" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-indigo-400 uppercase mb-2">Máximo</label>
                    <input 
                      type="number" 
                      value={newProduct.stock_maximo}
                      onChange={e => setNewProduct({...newProduct, stock_maximo: e.target.value})}
                      className="w-full bg-indigo-50/50 border-0 rounded-2xl p-4 font-bold text-indigo-700 outline-none focus:ring-4 focus:ring-indigo-500/20" 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setShowAddProductModal(false)}
                className="flex-1 py-5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-3xl font-bold transition-all uppercase tracking-widest text-xs"
              >
                DESCARTAR
              </button>
              <button 
                onClick={handleAddProduct}
                className="flex-[2] py-5 bg-slate-900 text-white rounded-3xl font-black hover:bg-slate-800 transition-all shadow-2xl uppercase tracking-widest text-xs flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5 text-emerald-400" /> GUARDAR PRODUCTO MAESTRO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: EDITAR PRODUCTO (MAESTRO) --- */}
      {showEditProductModal && selectedForEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] w-full max-w-4xl rounded-[3.5rem] p-10 shadow-2xl border border-[var(--border-color)] animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start mb-10">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Edit className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-[var(--text-main)] italic">Editar Maestro</h3>
                  <p className="text-[var(--text-muted)] font-bold uppercase tracking-widest text-xs">ID: {selectedForEdit.id} | Actualizando metadatos del producto</p>
                </div>
              </div>
              <button onClick={() => setShowEditProductModal(false)} className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-5 rounded-[2rem] mb-10 flex gap-4">
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
              <div>
                <p className="text-[11px] text-amber-900 font-black uppercase tracking-wider mb-1">Aviso de Auditoría de Maestro</p>
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                  Cualquier cambio en el campo <strong>Físico</strong> generará un registro de ajuste automático vinculado a tu usuario. Asegúrate de que los cambios en precios y categorías sean correctos.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
              {/* Info Básica */}
              <div className="space-y-6">
                <h4 className="text-sm font-black text-[var(--text-muted)] uppercase tracking-widest border-b border-[var(--border-color)] pb-2">Información Básica</h4>
                
                <div>
                  <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase mb-2">SKU / Código de Barras*</label>
                  <input 
                    type="text" 
                    value={editProductData.sku}
                    onChange={e => setEditProductData({...editProductData, sku: e.target.value})}
                    className="w-full bg-[var(--bg-main)] border-0 rounded-2xl p-4 font-bold text-[var(--text-main)] outline-none focus:ring-4 focus:ring-emerald-500/20" 
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase mb-2">Descripción del Producto*</label>
                  <input 
                    type="text" 
                    value={editProductData.descripcion}
                    onChange={e => setEditProductData({...editProductData, descripcion: e.target.value})}
                    className="w-full bg-[var(--bg-main)] border-0 rounded-2xl p-4 font-bold text-[var(--text-main)] outline-none focus:ring-4 focus:ring-emerald-500/20" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase mb-2">Categoría</label>
                    <input 
                      list="existing-categories-edit"
                      type="text" 
                      value={editProductData.categoria}
                      onChange={e => setEditProductData({...editProductData, categoria: e.target.value})}
                      className="w-full bg-[var(--bg-main)] border-0 rounded-2xl p-4 font-bold text-[var(--text-main)] outline-none focus:ring-4 focus:ring-emerald-500/20" 
                    />
                    <datalist id="existing-categories-edit">
                      {existingCategories.map(cat => <option key={cat} value={cat} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase mb-2">Unidad</label>
                    <select 
                      value={editProductData.unidad}
                      onChange={e => setEditProductData({...editProductData, unidad: e.target.value})}
                      className="w-full bg-[var(--bg-main)] border-0 rounded-2xl p-4 font-bold text-[var(--text-main)] outline-none focus:ring-4 focus:ring-emerald-500/20" 
                    >
                      <option value="PZ">Pieza (PZ)</option>
                      <option value="KG">Kilogramo (KG)</option>
                      <option value="LT">Litro (LT)</option>
                      <option value="CAJA">Caja</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Precios y Stock */}
              <div className="space-y-6">
                <h4 className="text-sm font-black text-[var(--text-muted)] uppercase tracking-widest border-b border-[var(--border-color)] pb-2">Precios y Stock</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase mb-2">Costo Promedio</label>
                    <input 
                      type="number" 
                      value={editProductData.precio_costo}
                      onChange={e => setEditProductData({...editProductData, precio_costo: e.target.value})}
                      className="w-full bg-[var(--bg-main)] border-0 rounded-2xl p-4 font-bold text-[var(--text-main)] outline-none focus:ring-4 focus:ring-emerald-500/20" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase mb-2">Precio Venta*</label>
                    <input 
                      type="number" 
                      value={editProductData.precio_venta}
                      onChange={e => setEditProductData({...editProductData, precio_venta: e.target.value})}
                      className="w-full bg-[var(--bg-main)] border-0 rounded-2xl p-4 font-bold text-[var(--text-main)] outline-none focus:ring-4 focus:ring-emerald-500/20" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase mb-2 text-center">Físico</label>
                    <input 
                      type="number" 
                      value={editProductData.stock_actual}
                      onChange={e => setEditProductData({...editProductData, stock_actual: e.target.value})}
                      className="w-full bg-[var(--bg-main)] border-0 rounded-2xl p-4 font-bold text-[var(--text-main)] text-center outline-none focus:ring-4 focus:ring-emerald-500/20" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-red-400 uppercase mb-2 text-center">Mínimo</label>
                    <input 
                      type="number" 
                      value={editProductData.stock_minimo}
                      onChange={e => setEditProductData({...editProductData, stock_minimo: e.target.value})}
                      className="w-full bg-red-50/50 border-0 rounded-2xl p-4 font-bold text-red-700 text-center outline-none focus:ring-4 focus:ring-red-500/20" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-indigo-400 uppercase mb-2 text-center">Máximo</label>
                    <input 
                      type="number" 
                      value={editProductData.stock_maximo}
                      onChange={e => setEditProductData({...editProductData, stock_maximo: e.target.value})}
                      className="w-full bg-indigo-50/50 border-0 rounded-2xl p-4 font-bold text-indigo-700 text-center outline-none focus:ring-4 focus:ring-indigo-500/20" 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setShowEditProductModal(false)}
                className="flex-1 py-5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-3xl font-bold transition-all uppercase tracking-widest text-xs"
              >
                CANCELAR
              </button>
              <button 
                onClick={handleUpdateProduct}
                className="flex-[2] py-5 bg-slate-900 text-white rounded-3xl font-black hover:bg-slate-800 transition-all shadow-2xl uppercase tracking-widest text-xs flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5 text-emerald-400" /> ACTUALIZAR PRODUCTO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Off-screen Printable Report */}
      <div className="absolute left-[-9999px] top-[-9999px]">
        <ReporteConteoComponent 
          ref={printRef}
          productos={conteoProductos}
          categoria={conteoCategoria}
          config={businessConfig}
          fecha={fechaEmision}
        />
      </div>

    </div>
  );
}

