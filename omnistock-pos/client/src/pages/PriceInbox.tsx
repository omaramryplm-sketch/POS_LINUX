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
    <div className="p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 sm:mb-12">
        <div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <h2 className="text-2xl sm:text-4xl font-black text-[var(--text-main)] tracking-tight">Bandeja de Precios</h2>
            <div className="flex items-center gap-2">
              <span className="px-3 sm:px-4 py-1 sm:py-1.5 bg-indigo-600 text-white text-base sm:text-xl font-black rounded-xl sm:rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none">
                {sugerencias.length}
              </span>
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                <div className="relative flex h-2 w-2">
                  <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></div>
                  <div className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></div>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">En Vivo</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1 sm:mt-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <p className="text-[var(--text-muted)] font-medium text-xs sm:text-sm italic">Inteligencia competitiva activada</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <button
            onClick={handleScrape}
            disabled={scanning}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-[1.5rem] font-black text-xs sm:text-sm tracking-tight transition-all active:scale-95 ${
              scanning 
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed' 
              : 'bg-slate-900 dark:bg-emerald-500 text-white hover:bg-slate-800 dark:hover:bg-emerald-600 shadow-xl'
            }`}
          >
            <Activity className={`w-4 h-4 sm:w-5 sm:h-5 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? 'ESCANEANDO COMPETENCIA...' : 'ESCANEAR COMPETENCIA'}
          </button>
          
          {successMsg && (
            <div className="w-full sm:w-auto bg-emerald-500 text-white px-5 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-[1.5rem] shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 animate-in slide-in-from-right-10 text-xs sm:text-sm">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-bold tracking-tight">{successMsg}</span>
            </div>
          )}
        </div>
      </div>

      {sugerencias.length === 0 ? (
        <div className="bg-[var(--bg-card)] rounded-2xl sm:rounded-[3rem] p-8 sm:p-20 text-center border border-[var(--border-color)] shadow-xl">
          <div className="w-20 h-20 sm:w-32 sm:h-32 bg-emerald-50 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8">
            <Check className="w-10 h-10 sm:w-16 sm:h-16 text-emerald-500" />
          </div>
          <h3 className="text-xl sm:text-3xl font-black text-[var(--text-main)]">¡Todo en Orden!</h3>
          <p className="text-[var(--text-muted)] mt-2 sm:mt-4 max-w-md mx-auto text-sm sm:text-lg">
            No tienes sugerencias pendientes. Tus precios están alineados con la competencia.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {sugerencias.map((sug) => {
            const isIncrease = sug.precio_sugerido > sug.precio_actual;
            const diff = Math.abs(sug.precio_sugerido - sug.precio_actual);
            const diffPercentage = ((diff / sug.precio_actual) * 100).toFixed(1);

            return (
              <div key={sug.id} className="bg-[var(--bg-card)] rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 border border-[var(--border-color)] shadow-lg flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-10 transition-all hover:border-emerald-500/30">
                
                <div className="flex-1 w-full min-w-0">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <span className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl uppercase tracking-widest">
                      <Store className="w-3 h-3" /> {sug.competencia_referencia}
                    </span>
                    {sug.url_referencia && (
                      <a 
                        href={sug.url_referencia} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/40 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" /> Ver Fuente
                      </a>
                    )}
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {new Date(sug.fecha).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-lg sm:text-2xl font-black text-[var(--text-main)] uppercase tracking-tight mb-1 truncate">{sug.producto.descripcion}</h4>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-bold text-slate-400">SKU: {sug.producto.sku}</p>
                    <div className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
                    <p className={`text-xs font-black uppercase ${isIncrease ? 'text-emerald-500' : 'text-red-500'}`}>
                      {isIncrease ? 'Oportunidad de Ganancia' : 'Alerta Competencia'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-around gap-4 sm:gap-8 lg:gap-10 bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-[2rem] w-full lg:w-auto border border-slate-100 dark:border-slate-800 shadow-inner">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 mb-1 sm:mb-2 uppercase tracking-widest">Precio Actual</p>
                    <p className="text-lg sm:text-2xl font-bold text-slate-400 line-through">${sug.precio_actual.toFixed(2)}</p>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center">
                    <div className={`p-2 sm:p-3 rounded-full mb-1 sm:mb-2 ${isIncrease ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400'}`}>
                      {isIncrease ? <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" /> : <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6" />}
                    </div>
                    <span className={`text-xs sm:text-sm font-black ${isIncrease ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {isIncrease ? '+' : '-'}${diff.toFixed(2)} ({diffPercentage}%)
                    </span>
                  </div>

                  <div className="text-center">
                    <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 mb-1 sm:mb-2 uppercase tracking-widest">Detectado en {sug.competencia_referencia}</p>
                    <p className="text-3xl sm:text-4xl lg:text-5xl font-black text-[var(--text-main)] tracking-tight">${sug.precio_sugerido.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto">
                  <button
                    onClick={() => handleAction(sug.id, 'reject')}
                    className="flex-1 lg:flex-none flex items-center justify-center w-full lg:w-16 xl:w-20 h-12 sm:h-16 lg:h-20 rounded-xl sm:rounded-2xl lg:rounded-3xl bg-[var(--bg-main)] border border-[var(--border-color)] text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all active:scale-95"
                    title="Descartar Sugerencia"
                  >
                    <X className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" />
                  </button>
                  <button
                    onClick={() => handleAction(sug.id, 'approve')}
                    className="flex-1 lg:flex-none flex items-center justify-center w-full lg:w-16 xl:w-20 h-12 sm:h-16 lg:h-20 rounded-xl sm:rounded-2xl lg:rounded-3xl bg-emerald-500 text-white hover:bg-emerald-600 shadow-xl shadow-emerald-500/30 transition-all active:scale-95"
                    title="Aplicar Nuevo Precio"
                  >
                    <Check className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" />
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
