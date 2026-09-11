import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import api from '../api/axios';
import { useThemeStore } from '../store/themeStore';
import { 
  TrendingUp, AlertTriangle, Activity, PackageCheck, 
  ShoppingCart, ChevronRight, Package, DollarSign,
  MessageSquare, User as UserIcon, X
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import clsx from 'clsx';

interface DashboardData {
  selectedDate: string;
  metrics: {
    todayTotal: number;
    todayCost: number;
    todayWastage: number;
    criticalCount: number;
    inventoryValue: number;
    avgTraffic: number;
    avgRevenue: number;
    criticalProducts: any[];
  };
  salesChart: any[];
  recentSales: any[];
  topProducts: any[];
  salesByCaja?: any[]; // Nuevo campo
}

interface ReporteCorteProps {
  corte: any;
  declarado: string;
  fechaEmision: string;
  cajaNombre: string;
}

const ReporteCortePrintComponent = React.forwardRef<HTMLDivElement, ReporteCorteProps>(({ corte, declarado, fechaEmision, cajaNombre }, ref) => {
  if (!corte) return null;
  const decVal = parseFloat(declarado) || 0;
  const diff = decVal - corte.efectivoEsperado;

  return (
    <div ref={ref} className="p-12 bg-white text-slate-800 font-sans leading-relaxed text-xs max-w-[800px] mx-auto print:p-6 print:text-[10px]">
      {/* Header / Membrete */}
      <div className="text-center border-b-2 border-slate-900 pb-6 mb-6">
        <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-1">OMNISTOCK POS</h1>
        <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Reporte de Corte de Caja</p>
        <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">Caja: {cajaNombre} | Fecha de Corte: {new Date(corte.fecha).toLocaleDateString('es-MX')}</p>
      </div>

      {/* Info de Emisión */}
      <div className="flex justify-between mb-8 text-[10px] font-bold text-slate-500 uppercase">
        <span>Fecha de Emisión: {fechaEmision}</span>
        <span>Generado por: Administrador</span>
      </div>

      {/* Resumen Financiero */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
          <p className="font-bold text-slate-500 uppercase tracking-widest text-[8px] mb-1">Ventas Netas ({corte.ventas.cantidad})</p>
          <p className="text-lg font-black text-slate-900">${corte.ventas.total.toFixed(2)}</p>
        </div>
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
          <p className="font-bold text-slate-500 uppercase tracking-widest text-[8px] mb-1">Gastos Totales ({corte.gastos.cantidad})</p>
          <p className="text-lg font-black text-slate-900">-${corte.gastos.total.toFixed(2)}</p>
        </div>
        <div className="p-4 bg-slate-900 text-white rounded-xl text-center">
          <p className="font-bold text-slate-400 uppercase tracking-widest text-[8px] mb-1">Efectivo Esperado</p>
          <p className="text-lg font-black">${corte.efectivoEsperado.toFixed(2)}</p>
        </div>
      </div>

      {/* Arqueo de Caja */}
      <div className="border border-slate-950 rounded-2xl p-6 mb-8">
        <h2 className="font-black text-sm uppercase tracking-wide border-b border-slate-200 pb-2 mb-4">Arqueo de Caja (Conciliación)</h2>
        <div className="space-y-3">
          <div className="flex justify-between font-bold">
            <span className="text-slate-500 uppercase tracking-wider text-[9px]">Efectivo Esperado:</span>
            <span className="text-slate-800">${corte.efectivoEsperado.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span className="text-slate-500 uppercase tracking-wider text-[9px]">Efectivo Físico Declarado:</span>
            <span className="text-slate-800">{declarado !== '' ? `$${decVal.toFixed(2)}` : 'No declarado'}</span>
          </div>
          <div className="flex justify-between font-black text-sm border-t border-slate-100 pt-3">
            <span className="uppercase tracking-wider text-[10px]">Diferencia de Arqueo:</span>
            {declarado === '' ? (
              <span className="text-slate-400 font-bold italic">N/D</span>
            ) : Math.abs(diff) < 0.01 ? (
              <span className="text-emerald-600">+$0.00 (Arqueo Cuadrado)</span>
            ) : diff > 0 ? (
              <span className="text-indigo-600">+${diff.toFixed(2)} (Sobrante)</span>
            ) : (
              <span className="text-red-600">-${Math.abs(diff).toFixed(2)} (Faltante)</span>
            )}
          </div>
        </div>
      </div>

      {/* Detalle de Gastos */}
      {corte.gastos.detalles.length > 0 && (
        <div className="mb-8">
          <h2 className="font-black text-sm uppercase tracking-wide border-b border-slate-200 pb-2 mb-4">Desglose de Gastos</h2>
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-slate-300 font-black text-slate-500 uppercase tracking-wider text-left">
                <th className="py-2">Hora</th>
                <th className="py-2">Descripción</th>
                <th className="py-2">Registró</th>
                <th className="py-2 text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {corte.gastos.detalles.map((g: any, i: number) => (
                <tr key={i} className="border-b border-slate-100 font-bold text-slate-700">
                  <td className="py-2 text-slate-400">{new Date(g.fecha).toLocaleTimeString('es-MX')}</td>
                  <td className="py-2">{g.descripcion}</td>
                  <td className="py-2 text-slate-500">{g.usuario?.nombre_completo || 'Admin'}</td>
                  <td className="py-2 text-right font-black text-red-600">-${g.monto.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Firmas de Conformidad */}
      <div className="grid grid-cols-2 gap-12 mt-16 text-center">
        <div>
          <div className="border-b border-slate-400 h-10 w-48 mx-auto mb-2"></div>
          <p className="font-bold text-slate-700">Firma del Cajero</p>
          <p className="text-[9px] text-slate-400 uppercase tracking-widest">Responsable de Turno</p>
        </div>
        <div>
          <div className="border-b border-slate-400 h-10 w-48 mx-auto mb-2"></div>
          <p className="font-bold text-slate-700">Firma del Administrador</p>
          <p className="text-[9px] text-slate-400 uppercase tracking-widest">Supervisor de Auditoría</p>
        </div>
      </div>
    </div>
  );
});

ReporteCortePrintComponent.displayName = 'ReporteCortePrintComponent';

export default function AdminDashboard() {
  const { mode } = useThemeStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showCorteModal, setShowCorteModal] = useState(false);
  const [corteData, setCorteData] = useState<any>(null);
  const [selectedCajaCorte, setSelectedCajaCorte] = useState<string>('all');
  const [availableCajas, setAvailableCajas] = useState<any[]>([]);
  const [efectivoFisicoDeclarado, setEfectivoFisicoDeclarado] = useState<string>('');
  const [fechaEmisionCorte, setFechaEmisionCorte] = useState<string>('');
  const printCorteRef = useRef<HTMLDivElement>(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showMonthlyModal, setShowMonthlyModal] = useState(false);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  const [monthlyReportData, setMonthlyReportData] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchMonthlyReport = async () => {
    try {
      const res = await api.get(`/admin/reports/monthly?month=${selectedMonth}&year=${selectedYear}`);
      setMonthlyReportData(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (showMonthlyModal) fetchMonthlyReport();
  }, [showMonthlyModal, selectedMonth, selectedYear]);

  const exportMonthlyReportToCSV = () => {
    if (!monthlyReportData) return;
    const headers = ['Concepto', 'Valor'];
    const rows = [
      ['Mes', monthlyReportData.monthLabel],
      ['Año', monthlyReportData.year],
      ['Ventas Totales', monthlyReportData.totalSales.toFixed(2)],
      ['Costo de Ventas', monthlyReportData.totalCost.toFixed(2)],
      ['Utilidad Bruta', monthlyReportData.grossProfit.toFixed(2)],
      ['Gastos Totales', monthlyReportData.totalExpenses.toFixed(2)],
      ['Utilidad Neta', monthlyReportData.netProfit.toFixed(2)],
      ['', ''],
      ['VENTAS DIARIAS', ''],
      ['Fecha', 'Total']
    ];
    
    monthlyReportData.dailyData.forEach((d: any) => {
      rows.push([d.date, d.total.toFixed(2)]);
    });

    const csvContent = "\ufeffsep=;\r\n" + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `OmniStock_Reporte_${monthlyReportData.monthLabel}_${monthlyReportData.year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchDashboard = async (date?: string, isBackground = false) => {
    if (!isBackground && !data) setLoading(true);
    try {
      const url = date ? `/admin/stats?date=${date}` : '/admin/stats';
      const res = await api.get(`${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`);
      setData(res.data.data);
    } catch (err) {
      console.error('Error fetching dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(selectedDate || undefined);
    
    const interval = setInterval(() => {
      fetchDashboard(selectedDate || undefined, true);
    }, 15000); // 15s para el dashboard

    const onFocus = () => fetchDashboard(selectedDate || undefined, true);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [selectedDate]);

  useEffect(() => {
    setCurrentPage(1); // Reset page when date changes
  }, [selectedDate]);

  const totalPages = Math.ceil((data?.recentSales?.length || 0) / itemsPerPage);
  const paginatedSales = data?.recentSales?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) || [];

  const handleShowCorte = async (cajaId: string = 'all') => {
    try {
      let url = selectedDate ? `/admin/corte?date=${selectedDate}` : '/admin/corte';
      if (cajaId !== 'all') {
        url += (url.includes('?') ? '&' : '?') + `id_caja=${cajaId}`;
      }
      const res = await api.get(url);
      setCorteData(res.data.data);
      setSelectedCajaCorte(cajaId);
      setEfectivoFisicoDeclarado('');
      setShowCorteModal(true);
    } catch (err) {
      alert('Error al generar corte');
    }
  };

  const handlePrintCorte = useReactToPrint({
    contentRef: printCorteRef,
  });

  const handlePrintCorteTrigger = () => {
    const nowStr = new Date().toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
    setFechaEmisionCorte(nowStr);
    setTimeout(() => {
      handlePrintCorte();
    }, 150);
  };

  const fetchCajas = async () => {
    try {
      const res = await api.get('/admin/cajas');
      setAvailableCajas(res.data.data);
    } catch (err) {
      console.error('Error fetching cajas', err);
    }
  };

  useEffect(() => {
    fetchCajas();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-transparent min-h-full">
      {/* --- Header --- */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-4xl font-black text-[var(--text-main)] tracking-tight italic">Panel de Control</h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-[var(--text-muted)] font-medium">Análisis de rendimiento y métricas clave</p>
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full">
              <div className="relative flex h-2 w-2">
                <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></div>
                <div className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></div>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">En Vivo</span>
            </div>
            {selectedDate && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full uppercase animate-in fade-in zoom-in">
                Filtrado: {new Date(selectedDate).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric' })}
                <button onClick={() => { setSelectedDate(null); fetchDashboard(); }} className="ml-1 hover:text-emerald-900">×</button>
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowMonthlyModal(true)}
            className="bg-indigo-500 text-white px-6 py-2 rounded-2xl shadow-xl hover:bg-indigo-600 transition-all font-black text-xs flex items-center gap-2"
          >
            <Activity className="w-4 h-4" /> REPORTE MENSUAL
          </button>
          <button 
            onClick={() => setShowExpenseModal(true)}
            className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-6 py-2 rounded-2xl shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 hover:border-red-100 transition-all font-black text-xs flex items-center gap-2"
          >
            <DollarSign className="w-4 h-4 text-red-500" /> REGISTRAR GASTO
          </button>
          <button 
            onClick={() => handleShowCorte('all')}
            className="bg-slate-900 dark:bg-emerald-500 text-white px-6 py-2 rounded-2xl shadow-xl hover:bg-slate-800 dark:hover:bg-emerald-600 transition-all font-black text-xs flex items-center gap-2"
          >
            <DollarSign className="w-4 h-4 text-emerald-400" /> CORTE DE CAJA
          </button>
        </div>
      </div>

      {/* --- Métricas Principales --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div 
          onClick={() => scrollToSection('recent-sales')}
          className="bg-[var(--bg-card)] rounded-[2.5rem] p-8 border border-[var(--border-color)] shadow-xl shadow-slate-200/50 relative overflow-hidden group hover:scale-[1.02] hover:border-emerald-500 transition-all cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 opacity-10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <div className="flex items-center justify-between mb-6 relative">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <TrendingUp className="text-white w-7 h-7" />
            </div>
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-3 py-1.5 rounded-full uppercase">Neto: ${((data?.metrics.todayTotal || 0) - (data?.metrics.todayCost || 0)).toFixed(2)}</span>
          </div>
          <h3 className="text-[var(--text-muted)] text-xs font-black uppercase tracking-widest">{selectedDate ? 'Venta Bruta' : 'Ventas de Hoy'}</h3>
          <p className="text-4xl font-black text-[var(--text-main)] mt-2 tracking-tighter">
            ${data?.metrics.todayTotal.toFixed(2)}
          </p>
        </div>

        <div 
          onClick={() => navigate('/admin/inventory')}
          className="bg-[var(--bg-card)] rounded-[2.5rem] p-8 border border-[var(--border-color)] shadow-xl shadow-slate-200/50 relative overflow-hidden group hover:scale-[1.02] hover:border-red-500 transition-all cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 opacity-10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <div className="flex items-center justify-between mb-6 relative">
            <div className="w-14 h-14 rounded-2xl bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/20">
              <AlertTriangle className="text-white w-7 h-7" />
            </div>
            {data?.metrics.criticalCount! > 0 && (
              <span className="text-xs font-black text-red-600 bg-red-100 px-3 py-1.5 rounded-full animate-pulse">REVISAR</span>
            )}
          </div>
          <h3 className="text-[var(--text-muted)] text-xs font-black uppercase tracking-widest">Stock Crítico</h3>
          <p className="text-4xl font-black text-[var(--text-main)] mt-2 tracking-tighter">{data?.metrics.criticalCount}</p>
          
          {data?.metrics.criticalCount! > 0 && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                const list = data?.metrics.criticalProducts.map((p: any) => `- ${p.descripcion}: ${p.stock_actual} ${p.unidad}`).join('%0A');
                const msg = `Hola! Reporte de Stock Crítico en OmniStock:%0A%0A${list}`;
                window.open(`https://wa.me/?text=${msg}`, '_blank');
              }}
              className="mt-4 w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
            >
              <MessageSquare className="w-4 h-4" /> ENVIAR POR WHATSAPP
            </button>
          )}
        </div>

        <div 
          className={`bg-[var(--bg-card)] rounded-[2.5rem] p-8 border shadow-xl shadow-slate-200/50 relative overflow-hidden group hover:scale-[1.02] transition-all cursor-pointer ${ (data?.metrics as any).todayWastage > 0 ? 'border-orange-500 bg-orange-50/10' : 'border-[var(--border-color)]'}`}
        >
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 ${ (data?.metrics as any).todayWastage > 0 ? 'bg-orange-100 opacity-10' : 'bg-blue-50 opacity-10'}`}></div>
          <div className="flex items-center justify-between mb-6 relative">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-colors ${ (data?.metrics as any).todayWastage > 0 ? 'bg-orange-600 shadow-orange-500/20' : 'bg-blue-500 shadow-blue-500/20'}`}>
              <AlertTriangle className="text-white w-7 h-7" />
            </div>
            {(data?.metrics as any).todayWastage > 0 && <span className="text-[10px] font-black text-orange-600 bg-orange-100 px-2 py-1 rounded-lg uppercase tracking-widest">Pérdida Crítica</span>}
          </div>
          <h3 className="text-[var(--text-muted)] text-xs font-black uppercase tracking-widest">
            Mermas del Período
          </h3>
          <p className="text-4xl font-black text-[var(--text-main)] mt-2 tracking-tighter">
            ${(data?.metrics as any).todayWastage.toFixed(2)}
          </p>
        </div>

        <div 
          onClick={() => navigate('/admin/inventory')}
          className="bg-[var(--bg-card)] rounded-[2.5rem] p-8 border border-[var(--border-color)] shadow-xl shadow-slate-200/50 relative overflow-hidden group hover:scale-[1.02] hover:border-purple-500 transition-all cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 opacity-10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <div className="flex items-center justify-between mb-6 relative">
            <div className="w-14 h-14 rounded-2xl bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <PackageCheck className="text-white w-7 h-7" />
            </div>
          </div>
          <h3 className="text-[var(--text-muted)] text-xs font-black uppercase tracking-widest">Valor Inventario</h3>
          <p className="text-4xl font-black text-[var(--text-main)] mt-2 tracking-tighter">
            ${data?.metrics.inventoryValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* --- Gráfica y Listas --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        
        {/* Gráfica de Ventas */}
        <div id="performance-chart" className="lg:col-span-2 bg-[var(--bg-card)] rounded-[3rem] p-10 border border-[var(--border-color)] shadow-xl shadow-slate-200/40">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tight italic">Rendimiento Semanal</h3>
              <p className="text-[var(--text-muted)] font-medium text-sm mt-1">Comparativa dinámica de crecimiento</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hoy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ayer</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-slate-300 rounded-full border border-slate-400"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Semana Pasada</span>
              </div>
            </div>
          </div>

          {/* Selectores de Día */}
          <div className="flex flex-wrap gap-2 mb-8">
            {data?.salesChart.map((day, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedDate(day.fullDate);
                  fetchDashboard(day.fullDate);
                }}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black tracking-widest transition-all duration-300 ${
                  selectedDate === day.fullDate 
                  ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/40 scale-110 -translate-y-1' 
                  : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-100 hover:scale-105'
                }`}
              >
                {day.name.toUpperCase()}
              </button>
            ))}
            <button
              onClick={() => {
                setSelectedDate(null);
                fetchDashboard();
              }}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black tracking-widest transition-all duration-300 ${
                !selectedDate 
                ? 'bg-slate-800 text-white shadow-xl scale-110 -translate-y-1' 
                : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-100 hover:scale-105'
              }`}
            >
              HOY
            </button>
          </div>

          <div className="h-[300px] w-full cursor-pointer">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={data?.salesChart} 
                onMouseDown={(state: any) => {
                  if (state && state.activePayload && state.activePayload.length > 0) {
                    const dataPoint = state.activePayload[0].payload;
                    if (dataPoint.fullDate) {
                      setSelectedDate(dataPoint.fullDate);
                      fetchDashboard(dataPoint.fullDate);
                    }
                  }
                }}
              >
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPrev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorYest" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={mode === 'dark' ? '#1e293b' : '#f1f5f9'} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} 
                  dy={15} 
                />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dx={-10} />
                <Tooltip 
                  cursor={{stroke: '#10b981', strokeWidth: 2}}
                  contentStyle={{
                    borderRadius: '24px', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', 
                    padding: '20px',
                    backgroundColor: mode === 'dark' ? '#0F172A' : '#FFFFFF',
                    color: mode === 'dark' ? '#F8FAFC' : '#1e293b'
                  }} 
                  formatter={(value: any, name: any) => {
                    const label = name === 'current' ? 'Este Día' : name === 'yesterday' ? 'Día Anterior' : 'Semana Pasada';
                    const valNum = parseFloat(value) || 0;
                    return [`$${valNum.toFixed(2)}`, label];
                  }}
                  labelStyle={{ 
                    fontWeight: 900, 
                    color: mode === 'dark' ? '#94A3B8' : '#1e293b', 
                    marginBottom: '8px', 
                    textTransform: 'uppercase', 
                    fontSize: '10px', 
                    letterSpacing: '0.1em' 
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="prev" 
                  name="prev"
                  stroke="#94a3b8" 
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  fillOpacity={1} 
                  fill="url(#colorPrev)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="yesterday" 
                  name="yesterday"
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  strokeDasharray="3 3"
                  fillOpacity={1} 
                  fill="url(#colorYest)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="current" 
                  name="current"
                  stroke="#10b981" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorSales)"
                  activeDot={{ r: 8, fill: '#10b981', stroke: 'white', strokeWidth: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Productos */}
        <div className="bg-[var(--bg-card)] rounded-[3rem] p-10 border border-[var(--border-color)] shadow-xl shadow-slate-200/40 relative">
          {loading && data && (
             <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-[3rem]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
             </div>
          )}
          <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tight mb-8 italic">Lo Más Vendido</h3>
          <div className="space-y-6">
            {data?.topProducts.length === 0 ? (
              <div className="text-center py-20">
                <Package className="w-12 h-12 text-[var(--text-muted)] opacity-20 mx-auto mb-4" />
                <p className="text-[var(--text-muted)] font-bold">Sin datos este día</p>
              </div>
            ) : (
              data?.topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="w-12 h-12 bg-[var(--bg-main)] rounded-2xl flex items-center justify-center text-[var(--text-muted)] group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all font-black text-lg">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-[var(--text-main)] text-sm uppercase truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{p.sales} unidades</p>
                  </div>
                  <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${(p.sales / (data?.topProducts[0]?.sales || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Resumen por Cajas (NUEVO) */}
        <div className="bg-[var(--bg-card)] rounded-[3rem] p-10 border border-[var(--border-color)] shadow-xl shadow-slate-200/40">
           <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tight mb-8 italic">Ingresos por Caja</h3>
           <div className="space-y-4">
              {data?.salesByCaja?.length === 0 ? (
                <div className="text-center py-10 opacity-30 italic text-sm">Sin ventas registradas</div>
              ) : (
                data?.salesByCaja?.map((c, i) => (
                  <div key={i} className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl flex justify-between items-center border border-transparent hover:border-emerald-500/20 transition-all">
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{c.nombre}</p>
                      <p className="text-[10px] font-bold text-emerald-500 uppercase">{c.cantidad} tickets generados</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-[var(--text-main)]">${c.total.toFixed(2)}</p>
                    </div>
                  </div>
                ))
              )}
           </div>
        </div>
      </div>

      {/* --- Tabla de Ventas Recientes --- */}
      <div id="recent-sales" className="bg-[var(--bg-card)] rounded-[3rem] p-10 border border-[var(--border-color)] shadow-xl shadow-slate-200/40 relative">
        {loading && data && (
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-[3rem]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
        )}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Transacciones {selectedDate ? 'del Período' : 'Recientes'}</h3>
            <p className="text-[var(--text-muted)] font-medium">Historial detallado de ventas y gastos</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-black text-xs rounded-2xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all">
              <ShoppingCart className="w-4 h-4" /> NUEVA VENTA
            </button>
          </div>
        </div>
        <div className="max-h-[500px] overflow-y-auto overflow-x-auto custom-scrollbar">
          <table className="w-full relative">
            <thead className="sticky top-0 bg-[var(--bg-card)] z-10">
              <tr className="text-left border-b border-[var(--border-color)] text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest bg-[var(--bg-card)]">
                <th className="py-4">Folio</th>
                <th className="py-4">Fecha / Hora</th>
                <th className="py-4">Atendió</th>
                <th className="py-4 text-center">Caja</th>
                <th className="py-4">Tipo</th>
                <th className="py-4 text-right">Total</th>
                <th className="py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {data?.recentSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-[var(--text-muted)] font-bold">No hubo transacciones este día</td>
                </tr>
              ) : (
                paginatedSales.map((v, i) => {
                  const isGasto = v._type === 'GASTO';
                  const isAjuste = v._type === 'AJUSTE';
                  return (
                  <tr key={i} className="group">
                    <td className="py-6">
                      <span className={clsx(
                        "px-3 py-1 rounded-lg text-xs font-black",
                        isGasto ? "bg-red-50 text-red-600" : isAjuste ? "bg-amber-50 text-amber-600" : "bg-[var(--bg-main)] text-[var(--text-muted)]"
                      )}>
                        {isAjuste ? 'AJU' : isGasto ? 'GST' : 'VTA'}-{v.id.toString().substring(0,6)}
                      </span>
                    </td>
                    <td className="py-6">
                      <p className="text-sm font-bold text-[var(--text-main)]">{new Date(v.fecha).toLocaleDateString()}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">{new Date(v.fecha).toLocaleTimeString()}</p>
                    </td>
                    <td className="py-6 flex items-center gap-2">
                      <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{v.usuario?.nombre_completo || 'Admin'}</span>
                    </td>
                    <td className="py-6 text-center">
                       {v.caja ? (
                         <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-black rounded-lg text-slate-500 uppercase tracking-tighter">
                           {v.caja.nombre}
                         </span>
                       ) : (
                         <span className="text-[10px] text-slate-300 italic">-</span>
                       )}
                    </td>
                    <td className="py-6">
                      {isAjuste ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> Ajuste
                        </span>
                      ) : isGasto ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-red-50 text-red-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Gasto
                        </span>
                      ) : v.estado === 'CANCELADA' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-500">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div> Cancelada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Ingreso
                        </span>
                      )}
                      {v.metodo_pago === 'TARJETA' && (
                        <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[8px] font-black uppercase bg-indigo-50 text-indigo-600 border border-indigo-100">
                           Terminal
                        </span>
                      )}
                    </td>
                    <td className={clsx(
                      "py-6 text-right font-black text-lg",
                      isGasto ? "text-red-500" : isAjuste ? (v.total > 0 ? "text-emerald-500" : "text-amber-500") : v.estado === 'CANCELADA' ? "text-[var(--text-muted)] line-through" : "text-emerald-500 dark:text-emerald-400"
                    )}>
                      {isAjuste ? (v.total > 0 ? '+' : '') : isGasto ? '-' : '$'}
                      {isAjuste ? Number(v.total || 0).toString() : Number(isGasto ? (v.monto || 0) : (v.total || 0)).toFixed(2)}
                      {isAjuste && <span className="text-[10px] ml-1">und</span>}
                    </td>
                    <td className="py-6 text-right">
                      {(!isGasto && !isAjuste) ? (
                        <button 
                          onClick={() => { setSelectedTicket(v); setShowTicketModal(true); }}
                          className="p-2 text-[var(--text-muted)] hover:text-emerald-500 transition-colors"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                      ) : (
                        <div className="flex justify-end group/hint relative">
                           <div className="px-4 py-2 bg-[var(--bg-main)] rounded-2xl border border-[var(--border-color)] max-w-[150px] hover:max-w-[300px] transition-all duration-500 shadow-sm hover:shadow-md cursor-default">
                              <p className="text-[10px] font-black text-[var(--text-muted)] truncate group-hover/hint:whitespace-normal italic leading-relaxed">
                                {v.descripcion || 'Sin descripción'}
                              </p>
                           </div>
                           {/* Decorative dot for premium feel */}
                           <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse opacity-0 group-hover/hint:opacity-100 transition-opacity"></div>
                        </div>
                      )}
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="px-8 py-6 border-t border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-card)]">
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">
              Mostrando {Math.min(currentPage * itemsPerPage, data?.recentSales.length || 0)} de {data?.recentSales.length} movimientos
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-xs font-black disabled:opacity-50 hover:bg-slate-100 transition-all uppercase tracking-widest"
              >
                Anterior
              </button>
              <div className="flex items-center px-4 text-xs font-black text-[var(--text-main)]">
                Página {currentPage} de {totalPages}
              </div>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black disabled:opacity-50 hover:bg-slate-800 transition-all uppercase tracking-widest"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- Visor de Ticket Digital --- */}
      {showTicketModal && selectedTicket && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden flex flex-col p-8 relative">
            <button 
              onClick={() => setShowTicketModal(false)}
              className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase">OmniStock POS</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Comprobante de Venta</p>
            </div>

            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 mb-6 flex-1 overflow-y-auto max-h-[400px]">
              <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Folio: #{selectedTicket.id}</span>
                <span className="text-[10px] font-bold text-slate-500">{new Date(selectedTicket.fecha).toLocaleString()}</span>
              </div>

              <div className="space-y-3">
                {selectedTicket.detalles?.map((d: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <div className="flex-1 pr-4">
                      <p className="font-bold text-slate-800 uppercase text-xs truncate">{d.producto?.descripcion}</p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {d.cantidad} {d.producto?.unidad?.toUpperCase()} x ${d.precio_unitario.toFixed(2)}
                      </p>
                    </div>
                    <span className="font-black text-slate-900">${d.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-dashed border-slate-300">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-400 uppercase">Subtotal</span>
                  <span className="text-sm font-bold text-slate-600">${(selectedTicket.total + (selectedTicket.descuento || 0)).toFixed(2)}</span>
                </div>
                {(selectedTicket.descuento || 0) > 0 && (
                  <div className="flex justify-between items-center mb-1 text-red-500">
                    <span className="text-xs font-bold uppercase">Descuento</span>
                    <span className="text-sm font-bold">-${(selectedTicket.descuento || 0).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center mb-3 mt-2">
                  <span className="text-lg font-black text-slate-800 uppercase">Total</span>
                  <span className="text-2xl font-black text-emerald-600">${selectedTicket.total.toFixed(2)}</span>
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Método de Pago</span>
                  <div className="flex flex-col items-end">
                    <span className={`text-[10px] font-black uppercase ${selectedTicket.metodo_pago === 'TARJETA' ? 'text-indigo-600' : 'text-emerald-600'}`}>
                      {selectedTicket.metodo_pago || 'EFECTIVO'}
                    </span>
                    {selectedTicket.referencia_pago && (
                      <span className="text-[8px] text-slate-400 font-bold">Ref: {selectedTicket.referencia_pago}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mb-8">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Atendió: {selectedTicket.usuario?.nombre_completo || 'Admin'}</p>
              {selectedTicket.estado === 'CANCELADA' && (
                <div className="mt-2 py-1 px-4 bg-red-100 text-red-600 text-[10px] font-black rounded-full inline-block uppercase tracking-widest animate-pulse">
                  Ticket Cancelado
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setShowTicketModal(false)}
                className="py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-xl"
              >
                CERRAR
              </button>
              {selectedTicket.estado !== 'CANCELADA' && (
                <button 
                  onClick={async () => {
                    if (window.confirm('¿Estás SEGURO de cancelar esta venta? El stock se devolverá al inventario automáticamente.')) {
                      try {
                        await api.post(`/admin/cancel-sale/${selectedTicket.id}`);
                        setShowTicketModal(false);
                        fetchDashboard(selectedDate || undefined);
                        alert('¡Venta cancelada con éxito!');
                      } catch (err) {
                        alert('Error al cancelar venta');
                      }
                    }
                  }}
                  className="py-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl font-black text-sm hover:bg-red-100 transition-all"
                >
                  CANCELAR VENTA
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* --- Modal de Corte de Caja --- */}
      {showCorteModal && corteData && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col p-10 max-h-[90vh]">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Corte de Caja</h3>
                <p className="text-slate-500 font-medium">Resumen financiero del {new Date(corteData.fecha).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setShowCorteModal(false)} className="p-3 bg-slate-100 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all">
                <ChevronRight className="w-6 h-6 rotate-180" />
              </button>
            </div>

            {/* Selector de Caja en el Corte (NUEVO) */}
            <div className="flex gap-2 mb-8 p-1.5 bg-slate-100 rounded-2xl overflow-x-auto custom-scrollbar no-scrollbar">
              <button
                onClick={() => handleShowCorte('all')}
                className={clsx(
                  "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
                  selectedCajaCorte === 'all' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Resumen General
              </button>
              {availableCajas.map((caja) => (
                <button
                  key={caja.id}
                  onClick={() => handleShowCorte(caja.id.toString())}
                  className={clsx(
                    "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
                    selectedCajaCorte === caja.id.toString() ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {caja.nombre}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Ventas Netas ({corteData.ventas.cantidad})</p>
                <p className="text-4xl font-black text-emerald-700">${corteData.ventas.total.toFixed(2)}</p>
              </div>
              <div className="p-6 bg-red-50 rounded-[2rem] border border-red-100">
                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Gastos Totales ({corteData.gastos.cantidad})</p>
                <p className="text-4xl font-black text-red-700">-${corteData.gastos.total.toFixed(2)}</p>
              </div>
            </div>

            <div className="bg-slate-900 rounded-[2rem] p-8 text-white mb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Efectivo Esperado en Caja</p>
              <p className="text-6xl font-black text-emerald-400 tracking-tighter">${corteData.efectivoEsperado.toFixed(2)}</p>
            </div>

            {/* Reconciliation Fields (NUEVO) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-[2rem]">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Efectivo Físico Declarado ($)</label>
                <input 
                  type="number" 
                  min="0"
                  step="0.01"
                  placeholder="Ingresa efectivo real..."
                  value={efectivoFisicoDeclarado}
                  onChange={e => setEfectivoFisicoDeclarado(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl p-4 font-bold text-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/10 text-xl" 
                />
              </div>

              <div className="p-6 rounded-[2rem] flex flex-col justify-center border border-slate-200 bg-slate-50">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Resultado de Arqueo</span>
                {efectivoFisicoDeclarado === '' ? (
                  <span className="text-slate-400 text-sm font-bold italic">Pendiente de declarar</span>
                ) : (() => {
                  const declarado = parseFloat(efectivoFisicoDeclarado) || 0;
                  const diff = declarado - corteData.efectivoEsperado;
                  if (Math.abs(diff) < 0.01) {
                    return (
                      <div>
                        <p className="text-xl font-black text-emerald-600">Arqueo Cuadrado</p>
                        <p className="text-[10px] font-bold text-emerald-500 uppercase">Sin diferencias</p>
                      </div>
                    );
                  } else if (diff > 0) {
                    return (
                      <div>
                        <p className="text-xl font-black text-indigo-600">Sobrante: +${diff.toFixed(2)}</p>
                        <p className="text-[10px] font-bold text-indigo-500 uppercase">Dinero de más en caja</p>
                      </div>
                    );
                  } else {
                    return (
                      <div>
                        <p className="text-xl font-black text-red-600">Faltante: -${Math.abs(diff).toFixed(2)}</p>
                        <p className="text-[10px] font-bold text-red-500 uppercase">Falta dinero en caja</p>
                      </div>
                    );
                  }
                })()}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Detalle de Gastos</h4>
              {corteData.gastos.detalles.length === 0 ? (
                <p className="text-sm font-bold text-slate-300 italic">No hubo gastos registrados hoy</p>
              ) : (
                <div className="space-y-3">
                  {corteData.gastos.detalles.map((g: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{g.descripcion}</p>
                        <div className="flex gap-2">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(g.fecha).toLocaleTimeString()}</p>
                          <span className="text-[10px] text-emerald-500 font-bold uppercase">• {g.usuario?.nombre_completo || 'Admin'}</span>
                        </div>
                      </div>
                      <span className="font-black text-red-600">-${g.monto.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              {corteData.cancelaciones.cantidad > 0 && (
                <div className="mt-8 p-4 bg-orange-50 rounded-2xl border border-orange-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <div>
                      <p className="text-sm font-black text-orange-700">{corteData.cancelaciones.cantidad} Ventas Canceladas</p>
                      <p className="text-[10px] font-bold text-orange-600 uppercase">Monto no ingresado</p>
                    </div>
                  </div>
                  <span className="text-lg font-black text-orange-700">${corteData.cancelaciones.total.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => setShowCorteModal(false)}
                className="flex-1 py-5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-[2rem] font-black text-sm transition-all uppercase tracking-widest"
              >
                CERRAR
              </button>
              <button 
                onClick={handlePrintCorteTrigger}
                className="flex-[2] py-5 bg-slate-900 text-white rounded-[2rem] font-black text-sm hover:bg-slate-800 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <DollarSign className="w-5 h-5 text-emerald-400" /> IMPRIMIR CORTE / PDF
              </button>
            </div>
          </div>
        </div>
      )}
      {/* --- Modal de Reporte Mensual --- */}
      {showMonthlyModal && (
        <div className="absolute inset-0 z-[120] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col p-10 max-h-[90vh]">
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-indigo-100 rounded-3xl flex items-center justify-center text-indigo-600 shadow-inner">
                  <Activity className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-800 tracking-tight">Reporte Mensual</h3>
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Análisis Financiero y de Rendimiento</p>
                </div>
              </div>
              <button 
                onClick={() => setShowMonthlyModal(false)}
                className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="col-span-2 flex gap-2">
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="flex-1 bg-slate-50 border-0 rounded-2xl px-4 py-3 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/20"
                >
                  <option value={1}>Enero</option><option value={2}>Febrero</option><option value={3}>Marzo</option>
                  <option value={4}>Abril</option><option value={5}>Mayo</option><option value={6}>Junio</option>
                  <option value={7}>Julio</option><option value={8}>Agosto</option><option value={9}>Septiembre</option>
                  <option value={10}>Octubre</option><option value={11}>Noviembre</option><option value={12}>Diciembre</option>
                </select>
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-32 bg-slate-50 border-0 rounded-2xl px-4 py-3 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/20"
                >
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                </select>
              </div>
              <div className="col-span-2 flex justify-end">
                <button 
                  onClick={exportMonthlyReportToCSV}
                  className="bg-emerald-500 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 flex items-center gap-2 hover:bg-emerald-600 transition-all"
                >
                  <PackageCheck className="w-4 h-4" /> Exportar a Excel (CSV)
                </button>
              </div>
            </div>

            {!monthlyReportData ? (
              <div className="flex-1 flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
                {/* Métricas Mensuales */}
                <div className="grid grid-cols-4 gap-6">
                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ventas Brutas</p>
                    <p className="text-3xl font-black text-slate-800">${monthlyReportData.totalSales.toFixed(2)}</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Utilidad Bruta</p>
                    <p className="text-3xl font-black text-emerald-600">${monthlyReportData.grossProfit.toFixed(2)}</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gastos Totales</p>
                    <p className="text-3xl font-black text-red-500">${monthlyReportData.totalExpenses.toFixed(2)}</p>
                  </div>
                  <div className="p-6 bg-indigo-600 rounded-[2rem] shadow-xl shadow-indigo-600/10">
                    <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Utilidad Neta</p>
                    <p className="text-3xl font-black text-white">${monthlyReportData.netProfit.toFixed(2)}</p>
                  </div>
                </div>

                {/* Desglose por Método de Pago */}
                <div className="grid grid-cols-2 gap-6">
                  {monthlyReportData.paymentBreakdown?.map((pb: any) => (
                    <div key={pb.method} className={`p-6 rounded-[2rem] border ${pb.method === 'TARJETA' ? 'bg-indigo-50 border-indigo-100' : 'bg-emerald-50 border-emerald-100'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${pb.method === 'TARJETA' ? 'text-indigo-600' : 'text-emerald-600'}`}>
                          {pb.method === 'TARJETA' ? 'Ventas con Tarjeta' : 'Ventas en Efectivo'}
                        </p>
                        <span className="text-[10px] font-bold opacity-60">{pb.count} transacciones</span>
                      </div>
                      <p className={`text-2xl font-black ${pb.method === 'TARJETA' ? 'text-indigo-700' : 'text-emerald-700'}`}>
                        ${pb.total.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Gráfico de Ventas Diarias */}
                <div className="h-64 bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyReportData.dailyData}>
                      <defs>
                        <linearGradient id="colorTotalMonth" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                      <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                      <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorTotalMonth)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Detalle de Gastos */}
                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8">
                   <h4 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                     <DollarSign className="w-5 h-5 text-red-500" /> Detalle de Gastos del Mes
                   </h4>
                   <table className="w-full text-left">
                     <thead>
                       <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                         <th className="pb-4">Concepto</th>
                         <th className="pb-4">Fecha</th>
                         <th className="pb-4 text-right">Monto</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                       {monthlyReportData.expenses.map((g: any) => (
                         <tr key={g.id} className="text-sm font-bold">
                           <td className="py-4 text-slate-700">{g.descripcion}</td>
                           <td className="py-4 text-slate-400">{new Date(g.fecha).toLocaleDateString()}</td>
                           <td className="py-4 text-right text-red-500">-${g.monto.toFixed(2)}</td>
                         </tr>
                       ))}
                       {monthlyReportData.expenses.length === 0 && (
                         <tr><td colSpan={3} className="py-8 text-center text-slate-400 font-medium italic">No hay gastos registrados en este mes.</td></tr>
                       )}
                     </tbody>
                   </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- Modal de Gasto --- */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden flex flex-col p-10">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mb-6 mx-auto">
              <DollarSign className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 text-center mb-1 uppercase">Registrar Gasto</h3>
            <p className="text-slate-400 font-bold text-center mb-8 uppercase text-xs tracking-widest">Salida de efectivo (Admin)</p>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-2 block">Descripción</label>
                <input 
                  type="text"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  placeholder="Ej: Pago de renta, proveedores, etc."
                  className="w-full bg-slate-50 border-0 rounded-2xl p-4 font-bold text-slate-700 focus:ring-4 focus:ring-red-500/10 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-2 block">Monto ($)</label>
                <input 
                  type="number"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border-0 rounded-2xl p-4 font-bold text-slate-700 focus:ring-4 focus:ring-red-500/10 outline-none text-2xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setShowExpenseModal(false)}
                className="py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-all"
              >
                CANCELAR
              </button>
              <button 
                onClick={async () => {
                  if (!expenseDesc || !expenseAmount) return alert('Llena todos los campos');
                  try {
                    await api.post('/admin/gastos', { descripcion: expenseDesc, monto: expenseAmount });
                    setShowExpenseModal(false);
                    setExpenseDesc('');
                    setExpenseAmount('');
                    fetchDashboard(selectedDate || undefined);
                    alert('Gasto registrado con éxito');
                  } catch (err) {
                    alert('Error al registrar gasto');
                  }
                }}
                className="py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black transition-all shadow-xl shadow-red-500/20"
              >
                REGISTRAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Off-screen Printable Corte */}
      <div className="absolute left-[-9999px] top-[-9999px]">
        <ReporteCortePrintComponent 
          ref={printCorteRef}
          corte={corteData}
          declarado={efectivoFisicoDeclarado}
          fechaEmision={fechaEmisionCorte}
          cajaNombre={selectedCajaCorte === 'all' ? 'Resumen General' : (availableCajas.find(c => c.id.toString() === selectedCajaCorte)?.nombre || 'Caja')}
        />
      </div>

    </div>
  );
}


