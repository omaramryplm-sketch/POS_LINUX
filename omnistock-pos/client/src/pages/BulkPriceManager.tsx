import { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  Save, RefreshCw, TrendingUp, DollarSign, 
  Percent, Filter, CheckSquare, Square, ChevronRight,
  Sparkles, Zap, Tags
} from 'lucide-react';

interface Producto {
  id: number;
  sku: string;
  descripcion: string;
  categoria: string;
  precio_venta: number;
}

export default function BulkPriceManager() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [category, setCategory] = useState('TODOS');
  const [categories, setCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Herramientas de ajuste
  const [adjustmentValue, setAdjustmentValue] = useState<number>(0);
  const [adjustmentType, setAdjustmentType] = useState<'PERCENT' | 'FIXED' | 'DIRECT'>('PERCENT');
  const [rounding, setRounding] = useState<'NONE' | '.50' | '.90' | '.00'>('NONE');
  
  const [previewData, setPreviewData] = useState<Record<number, string | number>>({});
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/inventory-prices');
      setProductos(res.data.data.productos);
      setCategories(['TODOS', ...res.data.data.categories]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [category, searchTerm]);

  const filteredProducts = productos.filter(p => {
    const matchesCategory = category === 'TODOS' || p.categoria === category;
    const matchesSearch = p.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.sku.includes(searchTerm);
    return matchesCategory && matchesSearch;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map(p => p.id));
    }
  };

  const toggleProduct = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleManualChange = (id: number, value: string) => {
    // Permitir números y un solo punto decimal
    const val = value.replace(/[^0-9.]/g, '');
    
    setPreviewData(prev => ({ ...prev, [id]: val }));
    if (!selectedIds.includes(id)) {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  // Calcular previsualización masiva
  useEffect(() => {
    if (adjustmentValue === 0 && rounding === 'NONE') return;

    const newPreview: Record<number, string | number> = { ...previewData };
    selectedIds.forEach(id => {
      const p = productos.find(prod => prod.id === id);
      if (!p) return;

      let newPrice = p.precio_venta;
      if (adjustmentType === 'PERCENT') {
        newPrice = p.precio_venta * (1 + adjustmentValue / 100);
      } else if (adjustmentType === 'FIXED') {
        newPrice = p.precio_venta + adjustmentValue;
      } else {
        newPrice = adjustmentValue;
      }

      if (rounding === '.00') newPrice = Math.round(newPrice);
      if (rounding === '.50') newPrice = Math.floor(newPrice) + 0.5;
      if (rounding === '.90') newPrice = Math.floor(newPrice) + 0.9;

      newPreview[id] = Number(newPrice.toFixed(2));
    });
    setPreviewData(newPreview);
  }, [adjustmentValue, adjustmentType, rounding]); // Quitamos selectedIds de aquí para no sobreescribir manuales al marcar checkbox

  const handleSave = async () => {
    if (selectedIds.length === 0) return;
    setSaving(true);
    try {
      await api.post('/admin/bulk-price-update', {
        updates: selectedIds.map(id => ({
          id,
          nuevo_precio: parseFloat(String(previewData[id])) || 0
        }))
      });
      alert('¡Precios actualizados con éxito!');
      fetchData();
      setSelectedIds([]);
      setAdjustmentValue(0);
      setPreviewData({});
    } catch (err) {
      alert('Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-4xl font-black text-[var(--text-main)] tracking-tight italic">Ajuste de Precios</h2>
          <div className="flex items-center gap-2 mt-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <p className="text-[var(--text-muted)] font-medium uppercase text-[10px] tracking-widest">Gestión Masiva de Inventario</p>
          </div>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={selectedIds.length === 0 || saving}
          className={`flex items-center gap-3 px-10 py-5 rounded-[2rem] font-black transition-all shadow-2xl ${
            selectedIds.length > 0 
            ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/30' 
            : 'bg-slate-100 text-slate-300'
          }`}
        >
          {saving ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
          GUARDAR {selectedIds.length} CAMBIOS
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* PANEL DE HERRAMIENTAS (Sidebar Izquierdo) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl shadow-slate-200/40">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filtros
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-2 block">Buscar Producto</label>
                <div className="relative">
                  <input 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nombre o Código..."
                    className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none pr-10"
                  />
                  <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-2 block">Categoría</label>
                <select 
                  value={category}
                  onChange={(e) => { setCategory(e.target.value); setSelectedIds([]); }}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl text-white">
            <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-8 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Ajuste Rápido
            </h3>
            
            <div className="space-y-6">
              <div className="flex bg-slate-800 rounded-2xl p-1 gap-1">
                <button 
                  onClick={() => setAdjustmentType('PERCENT')}
                  className={`flex-1 py-3 rounded-xl text-[8px] font-black transition-all ${adjustmentType === 'PERCENT' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                  <Percent className="w-3 h-3 mx-auto mb-1" /> % PORC.
                </button>
                <button 
                  onClick={() => setAdjustmentType('FIXED')}
                  className={`flex-1 py-3 rounded-xl text-[8px] font-black transition-all ${adjustmentType === 'FIXED' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                  <DollarSign className="w-3 h-3 mx-auto mb-1" /> + SUMA
                </button>
                <button 
                  onClick={() => setAdjustmentType('DIRECT')}
                  className={`flex-1 py-3 rounded-xl text-[8px] font-black transition-all ${adjustmentType === 'DIRECT' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                  <Tags className="w-3 h-3 mx-auto mb-1" /> DIRECTO
                </button>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-2 block">Valor del Ajuste</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={adjustmentValue}
                    onChange={(e) => setAdjustmentValue(Number(e.target.value))}
                    className="w-full bg-slate-800 border-none rounded-2xl p-4 font-black text-2xl text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-black">
                    {adjustmentType === 'PERCENT' ? '%' : '$'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-2 block">Redondeo Inteligente</label>
                <div className="grid grid-cols-2 gap-2">
                  {['NONE', '.00', '.50', '.90'].map(r => (
                    <button 
                      key={r}
                      onClick={() => setRounding(r as any)}
                      className={`py-3 rounded-xl text-xs font-black border-2 transition-all ${rounding === r ? 'border-emerald-500 bg-emerald-500/10 text-white' : 'border-slate-800 text-slate-500 hover:text-slate-300'}`}
                    >
                      {r === 'NONE' ? 'SIN REDONDEO' : r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TABLA DE PRODUCTOS (Cuerpo Derecho) */}
        <div className="lg:col-span-3 bg-white rounded-[3rem] p-10 border border-slate-200 shadow-xl shadow-slate-200/40 relative overflow-hidden">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-2xl font-black text-slate-800">Catálogo de Venta</h3>
              <p className="text-slate-400 font-medium">Selecciona los productos que deseas actualizar</p>
            </div>
            <button 
              onClick={toggleSelectAll}
              className="flex items-center gap-2 px-6 py-3 bg-slate-50 rounded-2xl text-[10px] font-black text-slate-500 border border-slate-100 hover:bg-slate-100 transition-all"
            >
              {selectedIds.length === filteredProducts.length ? <CheckSquare className="w-4 h-4 text-emerald-500" /> : <Square className="w-4 h-4" />}
              {selectedIds.length === filteredProducts.length ? 'DESELECCIONAR TODOS' : 'SELECCIONAR FILTRADOS'}
            </button>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar relative">
            <table className="w-full">
              <thead className="sticky top-0 bg-white z-10 shadow-sm">
                <tr className="text-left border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white">
                  <th className="pb-6"></th>
                  <th className="pb-6">Descripción</th>
                  <th className="pb-6">Categoría</th>
                  <th className="pb-6 text-right">Precio Actual</th>
                  <th className="pb-6 text-right">Nuevo Precio</th>
                  <th className="pb-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedProducts.map((p) => {
                  const isSelected = selectedIds.includes(p.id);
                  const hasPreview = isSelected && previewData[p.id] !== undefined;
                  const isChanged = hasPreview && previewData[p.id] !== p.precio_venta;

                  return (
                    <tr key={p.id} className={`group transition-colors ${isSelected ? 'bg-emerald-50/30' : 'hover:bg-slate-50/50'}`}>
                      <td className="py-6">
                        <button 
                          onClick={() => toggleProduct(p.id)}
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-transparent'}`}
                        >
                          <CheckSquare className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="py-6">
                        <p className="text-sm font-black text-slate-800 uppercase">{p.descripcion}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{p.sku}</p>
                      </td>
                      <td className="py-6">
                        <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase">{p.categoria}</span>
                      </td>
                      <td className="py-6 text-right font-bold text-slate-400">
                        ${p.precio_venta.toFixed(2)}
                      </td>
                      <td className="py-6 text-right">
                        <div className="flex flex-col items-end">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                            <input 
                              type="text"
                              value={previewData[p.id] !== undefined ? previewData[p.id] : p.precio_venta}
                              onChange={(e) => handleManualChange(p.id, e.target.value)}
                              className={`w-28 pl-6 pr-3 py-2 rounded-xl border-2 font-black text-right transition-all outline-none ${
                                isChanged 
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-lg shadow-emerald-500/10' 
                                : 'border-slate-100 bg-slate-50 text-slate-400 focus:border-indigo-500 focus:bg-white focus:text-slate-900'
                              }`}
                            />
                          </div>
                          {isChanged && (
                            <span className="text-[10px] font-black text-emerald-400 flex items-center gap-1 mt-1 animate-in slide-in-from-top-1">
                              <TrendingUp className="w-3 h-3" /> 
                              {(((parseFloat(String(previewData[p.id])) - p.precio_venta) / p.precio_venta) * 100).toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-6 text-right">
                        <ChevronRight className="w-5 h-5 text-slate-200" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between bg-white px-8 py-6 rounded-3xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Mostrando {Math.min(currentPage * itemsPerPage, filteredProducts.length)} de {filteredProducts.length} productos
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black disabled:opacity-50 hover:bg-slate-100 transition-all uppercase tracking-widest"
                >
                  Anterior
                </button>
                <div className="flex items-center px-4 text-xs font-black text-slate-700">
                  Página {currentPage} de {totalPages}
                </div>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black disabled:opacity-50 hover:bg-slate-800 transition-all uppercase tracking-widest"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
