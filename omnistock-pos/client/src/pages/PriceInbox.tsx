import { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  Check, X, TrendingDown, TrendingUp, 
  Store, Sparkles, CheckCircle2, Activity, ExternalLink
} from 'lucide-react';

interface Producto {
  id: number;
  sku: string;
  descripcion: string;
}

interface Sugerencia {
  id: number;
  precio_actual: number;
  precio_sugerido: number;
  competencia_referencia: string;
  url_referencia: string;
  fecha: string;
  producto: Producto;
}

export default function PriceInbox() {
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchSugerencias = async (isBackground = false) => {
    if (!isBackground && sugerencias.length === 0) setLoading(true);
    try {
      const res = await api.get(`/admin/prices?t=${Date.now()}`);
      setSugerencias(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSugerencias();
    const interval = setInterval(() => fetchSugerencias(true), 5000);
    window.addEventListener('focus', () => fetchSugerencias(true));
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', () => fetchSugerencias(true));
    };
  }, []);

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    try {
      await api.post(`/admin/prices/${id}/${action}`);
      setSugerencias(prev => prev.filter(s => s.id !== id));
      setSuccessMsg(action === 'approve' ? '¡Precio actualizado!' : 'Sugerencia descartada');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
      alert('Error al procesar la acción');
    }
  };

  const handleScrape = async () => {
    setScanning(true);
    try {
      const res = await api.post('/admin/scrape');
      setSuccessMsg(`Escaneo finalizado: ${res.data.data.found} nuevas alertas`);
      fetchSugerencias(true);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
      alert('Error al conectar con el motor de escaneo');
    } finally {
      setScanning(false);
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
    <div className="p-10 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-start mb-12">
        <div>
          <div className="flex items-center gap-4">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Bandeja de Precios</h2>
            <div className="flex items-center gap-2">
              <span className="px-4 py-1.5 bg-indigo-600 text-white text-xl font-black rounded-2xl shadow-lg shadow-indigo-200">
                {sugerencias.length}
              </span>
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full">
                <div className="relative flex h-2 w-2">
                  <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></div>
                  <div className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></div>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">En Vivo</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <p className="text-slate-500 font-medium italic">Inteligencia competitiva activada</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={handleScrape}
            disabled={scanning}
            className={`flex items-center gap-2 px-8 py-4 rounded-[1.5rem] font-black text-sm tracking-tighter transition-all ${
              scanning 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-200 hover:-translate-y-1'
            }`}
          >
            <Activity className={`w-5 h-5 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? 'ESCANEANDO COMPETENCIA...' : 'ESCANEAR COMPETENCIA'}
          </button>
          
          {successMsg && (
            <div className="bg-emerald-500 text-white px-6 py-4 rounded-[1.5rem] shadow-xl shadow-emerald-500/20 flex items-center gap-2 animate-in slide-in-from-right-10">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-bold text-sm tracking-tight">{successMsg}</span>
            </div>
          )}
        </div>
      </div>

      {sugerencias.length === 0 ? (
        <div className="bg-white rounded-[3rem] p-20 text-center border border-slate-200 shadow-2xl shadow-slate-200/50">
          <div className="w-32 h-32 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <Check className="w-16 h-16 text-emerald-500" />
          </div>
          <h3 className="text-3xl font-black text-slate-800">¡Todo en Orden!</h3>
          <p className="text-slate-500 mt-4 max-w-md mx-auto text-lg">
            No tienes sugerencias pendientes. Tus precios están alineados con la competencia.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {sugerencias.map((sug) => {
            const isIncrease = sug.precio_sugerido > sug.precio_actual;
            const diff = Math.abs(sug.precio_sugerido - sug.precio_actual);
            const diffPercentage = ((diff / sug.precio_actual) * 100).toFixed(1);

            return (
              <div key={sug.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl shadow-slate-200/30 flex flex-col lg:flex-row items-center gap-10 transition-all hover:scale-[1.01] hover:border-emerald-500/30">
                
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl uppercase tracking-widest">
                      <Store className="w-3 h-3" /> {sug.competencia_referencia}
                    </span>
                    {sug.url_referencia && (
                      <a 
                        href={sug.url_referencia} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-xl transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" /> Ver Fuente
                      </a>
                    )}
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {new Date(sug.fecha).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-1">{sug.producto.descripcion}</h4>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-400">SKU: {sug.producto.sku}</p>
                    <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                    <p className={`text-xs font-black uppercase ${isIncrease ? 'text-emerald-500' : 'text-red-500'}`}>
                      {isIncrease ? 'Oportunidad de Ganancia' : 'Alerta Competencia'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-10 bg-slate-50 p-8 rounded-[2rem] w-full lg:w-auto border border-slate-100 shadow-inner">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Precio Actual</p>
                    <p className="text-2xl font-bold text-slate-300 line-through">${sug.precio_actual.toFixed(2)}</p>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center">
                    <div className={`p-3 rounded-full mb-2 ${isIncrease ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                      {isIncrease ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                    </div>
                    <span className={`text-sm font-black ${isIncrease ? 'text-emerald-600' : 'text-red-600'}`}>
                      {isIncrease ? '+' : '-'}${diff.toFixed(2)} ({diffPercentage}%)
                    </span>
                  </div>

                  <div className="text-center">
                    <p className="text-[10px] font-black text-emerald-600 mb-2 uppercase tracking-widest">Detectado en {sug.competencia_referencia}</p>
                    <p className="text-5xl font-black text-slate-900 tracking-tighter">${sug.precio_sugerido.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full lg:w-auto">
                  <button
                    onClick={() => handleAction(sug.id, 'reject')}
                    className="flex-1 lg:flex-none flex items-center justify-center w-20 h-20 rounded-3xl bg-white border-2 border-slate-100 text-slate-300 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all group"
                    title="Descartar Sugerencia"
                  >
                    <X className="w-10 h-10 group-hover:scale-110 transition-transform" />
                  </button>
                  <button
                    onClick={() => handleAction(sug.id, 'approve')}
                    className="flex-1 lg:flex-none flex items-center justify-center w-20 h-20 rounded-3xl bg-emerald-500 text-white hover:bg-emerald-600 shadow-2xl shadow-emerald-500/30 transition-all group"
                    title="Aplicar Nuevo Precio"
                  >
                    <Check className="w-10 h-10 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
