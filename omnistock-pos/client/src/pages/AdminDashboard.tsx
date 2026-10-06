import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import api from '../api/axios';
import { useThemeStore } from '../store/themeStore';
import { 
  TrendingUp, AlertTriangle, Activity, PackageCheck, 
  ShoppingCart, ChevronRight, Package, DollarSign,
  MessageSquare, User as UserIcon, X,
  Calculator, Banknote, Coins, Receipt, CreditCard, CheckCircle2, ArrowUpRight, ArrowDownRight, Printer,
  Store, Monitor, Clock
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
  fondoInicial: string;
  fechaEmision: string;
  cajaNombre: string;
}

const ReporteCortePrintComponent = React.forwardRef<HTMLDivElement, ReporteCorteProps>(({ corte, declarado, fondoInicial, fechaEmision, cajaNombre }, ref) => {
  if (!corte) return null;
  const decVal = parseFloat(declarado) || 0;
  const fondoVal = parseFloat(fondoInicial) || 0;
  const totalEsperadoEnGaveta = Math.round((fondoVal + (corte.efectivoEsperado || 0)) * 100) / 100;
  const diff = declarado !== '' ? Math.round((decVal - totalEsperadoEnGaveta) * 100) / 100 : 0;

  return (
    <div ref={ref} className="p-12 bg-white text-slate-800 font-sans leading-relaxed text-xs max-w-[800px] mx-auto print:p-6 print:text-[10px]">
      {/* Header / Membrete */}
      <div className="text-center border-b-2 border-slate-900 pb-6 mb-6">
        <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-1">OMNISTOCK POS</h1>
        <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Reporte de Corte de Caja y Arqueo</p>
        <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">Caja: {cajaNombre} | Fecha de Corte: {new Date(corte.fecha).toLocaleDateString('es-MX')}</p>
      </div>

      {/* Info de Emisión */}
      <div className="flex justify-between mb-6 text-[10px] font-bold text-slate-500 uppercase">
        <span>Fecha de Emisión: {fechaEmision}</span>
        <span>Generado por: Administrador / Supervisor</span>
      </div>

      {/* Desglose de Métodos de Pago y Operaciones */}
      <div className="border border-slate-200 rounded-2xl p-5 mb-6">
        <h2 className="font-black text-xs uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-2 mb-3">Desglose Operativo por Medios de Pago</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[11px]">
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Ventas en Efectivo:</span>
            <span className="font-bold font-mono text-slate-900">${(corte.ventas.efectivo || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Cobranza / Abonos Efectivo:</span>
            <span className="font-bold font-mono text-emerald-700">+${(corte.abonos?.total || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Salidas Caja Chica (Gastos):</span>
            <span className="font-bold font-mono text-red-600">-${(corte.gastos?.totalCaja || 0).toFixed(2)}</span>
          </div>
          {corte.devoluciones?.total > 0 && (
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Reembolsos / Devoluciones Efectivo:</span>
              <span className="font-bold font-mono text-rose-600">-${(corte.devoluciones.total || 0).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Ventas con Tarjeta (Bancos):</span>
            <span className="font-bold font-mono text-blue-700">${(corte.ventas.tarjeta || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Ventas a Crédito (Cuentas x Cobrar):</span>
            <span className="font-bold font-mono text-amber-700">${(corte.ventas.credito || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Total Facturación Bruta ({corte.ventas.cantidad} vts):</span>
            <span className="font-black font-mono text-slate-900">${corte.ventas.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Arqueo de Caja (Gaveta Física) */}
      <div className="border border-slate-950 rounded-2xl p-6 mb-8 bg-slate-50/50">
        <h2 className="font-black text-sm uppercase tracking-wide border-b border-slate-300 pb-2 mb-4 text-slate-900">Arqueo y Conciliación de Efectivo en Gaveta</h2>
        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between font-bold">
            <span className="text-slate-600 uppercase tracking-wider text-[10px]">(+) Fondo Inicial de Caja (Apertura / Cambio):</span>
            <span className="text-slate-800 font-mono">${fondoVal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span className="text-slate-600 uppercase tracking-wider text-[10px]">(+) Flujo Neto del Turno (Ventas + Abonos - Gastos):</span>
            <span className="text-slate-800 font-mono">${corte.efectivoEsperado.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-black text-slate-900 border-t border-slate-200 pt-2">
            <span className="uppercase tracking-wider text-[10px]">(=) Efectivo Total Esperado en Gaveta:</span>
            <span className="font-mono text-sm">${totalEsperadoEnGaveta.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold border-t border-slate-200 pt-2">
            <span className="text-slate-600 uppercase tracking-wider text-[10px]">Efectivo Físico Contado (Declarado):</span>
            <span className="text-slate-800 font-mono">{declarado !== '' ? `$${decVal.toFixed(2)}` : 'No declarado'}</span>
          </div>
          <div className="flex justify-between font-black text-sm border-t-2 border-slate-900 pt-3">
            <span className="uppercase tracking-wider text-[10px]">Diferencia de Arqueo:</span>
            {declarado === '' ? (
              <span className="text-slate-400 font-bold italic">N/D</span>
            ) : Math.abs(diff) < 0.01 ? (
              <span className="text-emerald-700 font-mono">+$0.00 (Arqueo Cuadrado)</span>
            ) : diff > 0 ? (
              <span className="text-indigo-700 font-mono">+${diff.toFixed(2)} (Sobrante)</span>
            ) : (
              <span className="text-red-600 font-mono">-${Math.abs(diff).toFixed(2)} (Faltante)</span>
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
  const [fondoInicialCaja, setFondoInicialCaja] = useState<string>('');
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
      setMonthlyReportData(res.data);
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
      setFondoInicialCaja(res.data.data?.fondoInicialDefault !== undefined ? String(res.data.data.fondoInicialDefault) : '500');
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
    <div className="p-4 sm:p-6 lg:p-8 bg-transparent h-full overflow-y-auto custom-scrollbar">
      {/* --- Header --- */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 sm:mb-10">
        <div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[var(--text-main)] tracking-tight italic">Panel de Control</h2>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <p className="text-[var(--text-muted)] font-medium text-xs sm:text-sm">Análisis de rendimiento y métricas clave</p>
            <div className="flex items-center gap-2 px-2.5 py-0.5 sm:px-3 sm:py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
              <div className="relative flex h-2 w-2">
                <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></div>
                <div className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></div>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">En Vivo</span>
            </div>
            {selectedDate && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-black rounded-full uppercase animate-in fade-in zoom-in">
                Filtrado: {new Date(selectedDate).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric' })}
                <button onClick={() => { setSelectedDate(null); fetchDashboard(); }} className="ml-1 hover:text-emerald-900">×</button>
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button 
            onClick={() => setShowMonthlyModal(true)}
            className="flex-1 sm:flex-none bg-indigo-500 text-white px-4 sm:px-6 py-2.5 rounded-xl sm:rounded-2xl shadow-lg hover:bg-indigo-600 transition-all font-black text-xs flex items-center justify-center gap-2 active:scale-95"
          >
            <Activity className="w-4 h-4" /> REPORTE MENSUAL
          </button>
          <button 
            onClick={() => setShowExpenseModal(true)}
            className="flex-1 sm:flex-none bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-2.5 rounded-xl sm:rounded-2xl shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 hover:border-red-100 transition-all font-black text-xs flex items-center justify-center gap-2 active:scale-95"
          >
            <DollarSign className="w-4 h-4 text-red-500" /> REGISTRAR GASTO
          </button>
          <button 
            onClick={() => handleShowCorte('all')}
            className="w-full sm:w-auto bg-slate-900 dark:bg-emerald-500 text-white px-4 sm:px-6 py-2.5 rounded-xl sm:rounded-2xl shadow-lg hover:bg-slate-800 dark:hover:bg-emerald-600 transition-all font-black text-xs flex items-center justify-center gap-2 active:scale-95"
          >
            <DollarSign className="w-4 h-4 text-emerald-400 dark:text-white" /> CORTE DE CAJA
          </button>
        </div>
      </div>

      {/* --- Métricas Principales --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6 sm:mb-8">
        <div 
          onClick={() => scrollToSection('recent-sales')}
          className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-emerald-500/50 relative overflow-hidden group transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4 relative">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400 px-2.5 py-1 rounded-lg uppercase tracking-wider">
              Neto: ${((data?.metrics.todayTotal || 0) - (data?.metrics.todayCost || 0)).toFixed(2)}
            </span>
          </div>
          <h3 className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider">{selectedDate ? 'Venta Bruta' : 'Ventas de Hoy'}</h3>
          <p className="text-3xl font-black text-[var(--text-main)] mt-1.5 tracking-tight font-mono tabular-nums">
            ${data?.metrics.todayTotal.toFixed(2)}
          </p>
        </div>

        <div 
          onClick={() => navigate('/admin/inventory')}
          className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-red-500/50 relative overflow-hidden group transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4 relative">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center font-black">
              <AlertTriangle className="w-6 h-6" />
            </div>
            {data?.metrics.criticalCount! > 0 && (
              <span className="text-[10px] font-black text-red-600 bg-red-100 dark:bg-red-950/50 dark:text-red-400 px-2.5 py-1 rounded-lg uppercase tracking-wider animate-pulse">REVISAR</span>
            )}
          </div>
          <h3 className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider">Stock Crítico</h3>
          <p className="text-3xl font-black text-[var(--text-main)] mt-1.5 tracking-tight font-mono tabular-nums">{data?.metrics.criticalCount}</p>
          
          {data?.metrics.criticalCount! > 0 && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                const list = data?.metrics.criticalProducts.map((p: any) => `- ${p.descripcion}: ${p.stock_actual} ${p.unidad}`).join('%0A');
                const msg = `Hola! Reporte de Stock Crítico en OmniStock:%0A%0A${list}`;
                window.open(`https://wa.me/?text=${msg}`, '_blank');
              }}
              className="mt-3.5 w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <MessageSquare className="w-3.5 h-3.5" /> ENVIAR POR WHATSAPP
            </button>
          )}
        </div>

        <div 
          className={`bg-[var(--bg-card)] rounded-2xl p-6 border shadow-sm hover:shadow-md relative overflow-hidden group transition-all cursor-pointer ${ (data?.metrics as any).todayWastage > 0 ? 'border-orange-500/50 bg-orange-50/5' : 'border-[var(--border-color)] hover:border-orange-500/50'}`}
        >
          <div className="flex items-center justify-between mb-4 relative">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black ${ (data?.metrics as any).todayWastage > 0 ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            {(data?.metrics as any).todayWastage > 0 && (
              <span className="text-[10px] font-black text-orange-600 bg-orange-100 dark:bg-orange-950/50 dark:text-orange-400 px-2.5 py-1 rounded-lg uppercase tracking-wider">Pérdida Crítica</span>
            )}
          </div>
          <h3 className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider">
            Mermas del Período
          </h3>
          <p className="text-3xl font-black text-[var(--text-main)] mt-1.5 tracking-tight font-mono tabular-nums">
            ${(data?.metrics as any).todayWastage.toFixed(2)}
          </p>
        </div>

        <div 
          onClick={() => navigate('/admin/inventory')}
          className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-purple-500/50 relative overflow-hidden group transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4 relative">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black">
              <PackageCheck className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider">Valor Inventario</h3>
          <p className="text-3xl font-black text-[var(--text-main)] mt-1.5 tracking-tight font-mono tabular-nums">
            ${data?.metrics.inventoryValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* --- Gráfica y Listas --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        
        {/* Gráfica de Ventas */}
        <div id="performance-chart" className="lg:col-span-2 bg-[var(--bg-card)] rounded-2xl p-4 sm:p-6 lg:p-8 border border-[var(--border-color)] shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6 sm:mb-8">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-[var(--text-main)] tracking-tight italic">Rendimiento Semanal</h3>
              <p className="text-[var(--text-muted)] font-medium text-xs sm:text-sm mt-0.5">Comparativa dinámica de crecimiento</p>
            </div>
            <div className="flex flex-wrap gap-2.5 sm:gap-4">
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
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-6 sm:mb-8">
            {data?.salesChart.map((day, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedDate(day.fullDate);
                  fetchDashboard(day.fullDate);
                }}
                className={`px-3.5 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black tracking-widest transition-all duration-300 ${
                  selectedDate === day.fullDate 
                  ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/40 scale-105 sm:scale-110 -translate-y-0.5 sm:-translate-y-1' 
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700 hover:scale-105'
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
        <div className="bg-[var(--bg-card)] rounded-2xl p-6 sm:p-8 border border-[var(--border-color)] shadow-sm relative">
          {loading && data && (
             <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-2xl">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
             </div>
          )}
          <h3 className="text-xl font-black text-[var(--text-main)] tracking-tight mb-6 italic">Lo Más Vendido</h3>
          <div className="space-y-4">
            {data?.topProducts.length === 0 ? (
              <div className="text-center py-16">
                <Package className="w-10 h-10 text-[var(--text-muted)] opacity-20 mx-auto mb-3" />
                <p className="text-[var(--text-muted)] font-bold text-xs">Sin datos este día</p>
              </div>
            ) : (
              data?.topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-3.5 group">
                  <div className="w-10 h-10 bg-[var(--bg-main)] rounded-xl flex items-center justify-center text-[var(--text-muted)] group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-all font-black text-sm font-mono">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-[var(--text-main)] text-xs uppercase truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono tabular-nums">{p.sales} unidades</p>
                  </div>
                  <div className="w-20 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden shrink-0">
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
        <div className="bg-[var(--bg-card)] rounded-2xl p-6 sm:p-8 border border-[var(--border-color)] shadow-sm">
           <h3 className="text-xl font-black text-[var(--text-main)] tracking-tight mb-6 italic">Ingresos por Caja</h3>
           <div className="space-y-3">
              {data?.salesByCaja?.length === 0 ? (
                <div className="text-center py-10 opacity-30 italic text-sm">Sin ventas registradas</div>
              ) : (
                data?.salesByCaja?.map((c, i) => (
                  <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex justify-between items-center border border-[var(--border-color)] hover:border-emerald-500/30 transition-all">
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-0.5">{c.nombre}</p>
                      <p className="text-[10px] font-bold text-emerald-500 uppercase">{c.cantidad} tickets generados</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-[var(--text-main)] font-mono tabular-nums">${c.total.toFixed(2)}</p>
                    </div>
                  </div>
                ))
              )}
           </div>
        </div>
      </div>

      {/* --- Tabla de Ventas Recientes --- */}
      <div id="recent-sales" className="bg-[var(--bg-card)] rounded-2xl p-4 sm:p-6 lg:p-8 border border-[var(--border-color)] shadow-sm relative">
        {loading && data && (
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-2xl">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
        )}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-[var(--text-main)] tracking-tight">Transacciones {selectedDate ? 'del Período' : 'Recientes'}</h3>
            <p className="text-[var(--text-muted)] font-medium text-xs sm:text-sm">Historial detallado de ventas y gastos</p>
          </div>
          <div>
            <button onClick={() => navigate('/')} className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-emerald-500 text-white font-black text-xs rounded-xl sm:rounded-2xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-95">
              <ShoppingCart className="w-4 h-4" /> NUEVA VENTA
            </button>
          </div>
        </div>
        <div className="max-h-[500px] overflow-y-auto overflow-x-auto custom-scrollbar">
          <table className="w-full relative min-w-[640px]">
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
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col p-6 sm:p-7 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button 
              onClick={() => setShowTicketModal(false)}
              className="absolute top-5 right-5 p-2 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>

            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mx-auto mb-3">
                <ShoppingCart className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-[var(--text-main)] uppercase">OmniStock POS</h3>
              <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider mt-0.5">Comprobante de Venta</p>
            </div>

            <div className="bg-[var(--bg-main)] rounded-xl p-5 border border-[var(--border-color)] mb-5 flex-1 overflow-y-auto max-h-[380px] custom-scrollbar">
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
      {/* --- Modal de Corte y Arqueo de Caja (Rediseñado Responsive Desktop/Mobile) --- */}
      {showCorteModal && corteData && (
        <div className="fixed inset-0 z-[110] bg-slate-950/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-4xl rounded-t-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh] transition-all">
            
            {/* Header Sticky */}
            <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-[var(--border-color)] bg-slate-50/70 dark:bg-slate-900/70 shrink-0">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Calculator className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg sm:text-2xl font-black text-[var(--text-main)] tracking-tight">Corte y Arqueo de Caja</h3>
                    <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                      Oficial
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--text-muted)] font-medium mt-0.5">
                    Resumen financiero del {new Date(corteData.fecha).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowCorteModal(false)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-600 dark:bg-slate-800 dark:hover:bg-red-950/40 text-slate-400 transition-all flex items-center justify-center active:scale-95"
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selector de Caja en Pestañas (Píldoras limpias sin desborde) */}
            <div className="px-5 sm:px-7 pt-3.5 pb-1 shrink-0">
              <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <button
                  type="button"
                  onClick={() => handleShowCorte('all')}
                  className={clsx(
                    "px-4 sm:px-5 py-2 rounded-xl text-xs font-bold leading-normal tracking-wide whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0",
                    selectedCajaCorte === 'all' 
                      ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm font-black" 
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  )}
                >
                  <Store className="w-3.5 h-3.5 shrink-0" />
                  <span>Resumen General</span>
                </button>
                {availableCajas.map((caja) => (
                  <button
                    key={caja.id}
                    type="button"
                    onClick={() => handleShowCorte(caja.id.toString())}
                    className={clsx(
                      "px-4 sm:px-5 py-2 rounded-xl text-xs font-bold leading-normal tracking-wide whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0",
                      selectedCajaCorte === caja.id.toString() 
                        ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm font-black" 
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    )}
                  >
                    <Monitor className="w-3.5 h-3.5 shrink-0" />
                    <span>{caja.nombre}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Contenido Principal con Scroll Interno Elegante */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-4 space-y-4 sm:space-y-5 custom-scrollbar">

              {/* Banner Destacado: Flujo Neto de Efectivo del Turno */}
              {(() => {
                const flujo = corteData.efectivoEsperado || 0;
                const isPos = flujo >= 0;
                return (
                  <div className={clsx(
                    "rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white relative overflow-hidden shadow-lg border transition-all",
                    isPos 
                      ? "bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/70 border-emerald-900/40" 
                      : "bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/70 border-rose-900/40"
                  )}>
                    <div className={clsx(
                      "absolute -right-10 -top-10 w-44 h-44 rounded-full blur-3xl pointer-events-none",
                      isPos ? "bg-emerald-500/15" : "bg-rose-500/15"
                    )} />

                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                            Flujo Neto de Efectivo del Turno
                          </span>
                          <span className={clsx(
                            "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                            isPos ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                          )}>
                            {isPos ? 'Balance Positivo' : 'Salidas superan ingresos'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium">
                          (Ventas Efectivo + Cobranza de Abonos − Salidas Caja Chica{corteData.devoluciones?.total > 0 ? ` − Reembolsos Efectivo $${corteData.devoluciones.total.toFixed(2)}` : ''})
                        </p>
                      </div>

                      <div className="text-left sm:text-right shrink-0">
                        <p className={clsx(
                          "text-3xl sm:text-4xl md:text-5xl font-black font-mono tabular-nums tracking-tight leading-none",
                          isPos ? "text-emerald-400" : "text-rose-400"
                        )}>
                          {isPos ? `+$${flujo.toFixed(2)}` : `-$${Math.abs(flujo).toFixed(2)}`}
                        </p>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">
                          Moneda: MXN
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Desglose Operativo por Medio de Pago (5 Tarjetas Adaptativas) */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-[var(--text-muted)]">
                    Desglose Operativo por Medio de Pago
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400">5 Categorías</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
                  {/* 1. Ventas Efectivo */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Ventas Efectivo</p>
                        <Banknote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/70 font-medium">En gaveta física (+)</p>
                    </div>
                    <p className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono tabular-nums mt-2">
                      ${(corteData.ventas?.efectivo || 0).toFixed(2)}
                    </p>
                  </div>

                  {/* 2. Abonos Cobrados */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-900/40 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-black text-teal-700 dark:text-teal-400 uppercase tracking-wider">Abonos Fiado</p>
                        <Coins className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      </div>
                      <p className="text-[10px] text-teal-600/80 dark:text-teal-400/70 font-medium">Cobranza recibida (+)</p>
                    </div>
                    <p className="text-lg sm:text-xl font-black text-teal-700 dark:text-teal-300 font-mono tabular-nums mt-2">
                      +${(corteData.abonos?.total || 0).toFixed(2)}
                    </p>
                  </div>

                  {/* 3. Caja Chica (Gastos) */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider">Caja Chica</p>
                        <Receipt className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      </div>
                      <p className="text-[10px] text-rose-600/80 dark:text-rose-400/70 font-medium">Retiros de gaveta (−)</p>
                    </div>
                    <p className="text-lg sm:text-xl font-black text-rose-700 dark:text-rose-300 font-mono tabular-nums mt-2">
                      -${(corteData.gastos?.totalCaja || 0).toFixed(2)}
                    </p>
                  </div>

                  {/* 4. Ventas Tarjeta */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider">Ventas Tarjeta</p>
                        <CreditCard className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="text-[10px] text-blue-600/80 dark:text-blue-400/70 font-medium">Terminal bancaria</p>
                    </div>
                    <p className="text-lg sm:text-xl font-black text-blue-700 dark:text-blue-300 font-mono tabular-nums mt-2">
                      ${(corteData.ventas?.tarjeta || 0).toFixed(2)}
                    </p>
                  </div>

                  {/* 5. Ventas Crédito */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 col-span-2 sm:col-span-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">Ventas Crédito</p>
                        <DollarSign className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <p className="text-[10px] text-amber-600/80 dark:text-amber-400/70 font-medium">Fiado pendiente</p>
                    </div>
                    <p className="text-lg sm:text-xl font-black text-amber-700 dark:text-amber-300 font-mono tabular-nums mt-2">
                      ${(corteData.ventas?.credito || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Panel de Arqueo Físico y Conciliación con Fondo Inicial */}
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-700/70">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-[var(--text-main)] uppercase tracking-wider">
                      Arqueo Físico y Conciliación de Gaveta
                    </h4>
                    <p className="text-[11px] text-[var(--text-muted)] font-medium">
                      Fórmula: Fondo Inicial + Flujo Neto = Total en Gaveta Esperado
                    </p>
                  </div>
                  <span className="hidden sm:inline-flex text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Auditoría en vivo
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-stretch">
                  {/* Campo 1: Fondo Inicial */}
                  <div className="md:col-span-4 bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between shadow-sm">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
                        (+) Fondo Inicial (Apertura)
                      </label>
                      <p className="text-[10px] text-slate-400 mb-2">Dinero base para cambio al abrir turno</p>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                        <input 
                          type="number" 
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={fondoInicialCaja}
                          onChange={e => setFondoInicialCaja(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-7 pr-3 py-2.5 font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 text-base font-mono tabular-nums" 
                        />
                      </div>
                    </div>
                    <div className="flex gap-1.5 mt-2.5">
                      {[200, 500, 1000].map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setFondoInicialCaja(amt.toString())}
                          className="flex-1 py-1 px-1 text-[10px] font-black rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-all"
                        >
                          ${amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Campo 2: Conteo Físico Real */}
                  <div className="md:col-span-4 bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between shadow-sm">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
                        (=) Conteo Físico Real
                      </label>
                      <p className="text-[10px] text-slate-400 mb-2">Total de billetes y monedas en gaveta</p>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                        <input 
                          type="number" 
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={efectivoFisicoDeclarado}
                          onChange={e => setEfectivoFisicoDeclarado(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-7 pr-3 py-2.5 font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 text-base font-mono tabular-nums" 
                        />
                      </div>
                    </div>
                    {(() => {
                      const fondo = parseFloat(fondoInicialCaja) || 0;
                      const esperado = Math.round((fondo + (corteData.efectivoEsperado || 0)) * 100) / 100;
                      return (
                        <button
                          type="button"
                          onClick={() => setEfectivoFisicoDeclarado(esperado.toFixed(2))}
                          className="mt-2.5 py-1 px-2 text-[10px] font-black rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 transition-all text-center"
                        >
                          Rellenar con total esperado (${esperado.toFixed(2)})
                        </button>
                      );
                    })()}
                  </div>

                  {/* Campo 3: Veredicto de Arqueo en Vivo */}
                  {(() => {
                    const fondo = parseFloat(fondoInicialCaja) || 0;
                    const declarado = parseFloat(efectivoFisicoDeclarado) || 0;
                    const esperadoTotal = Math.round((fondo + (corteData.efectivoEsperado || 0)) * 100) / 100;
                    const diff = Math.round((declarado - esperadoTotal) * 100) / 100;
                    const hasInput = efectivoFisicoDeclarado !== '';

                    return (
                      <div className={clsx(
                        "md:col-span-4 p-4 rounded-2xl border flex flex-col justify-between transition-all shadow-sm",
                        !hasInput
                          ? "bg-slate-100/70 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700"
                          : Math.abs(diff) < 0.01
                            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800"
                            : diff > 0
                              ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800"
                              : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800"
                      )}>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                            Resultado de Arqueo
                          </span>
                          <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                            Esperado en gaveta: <span className="font-mono font-black text-slate-900 dark:text-white">${esperadoTotal.toFixed(2)}</span>
                          </p>
                        </div>

                        <div className="mt-3">
                          {!hasInput ? (
                            <div>
                              <span className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 dark:text-slate-400">
                                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>Pendiente de conteo</span>
                              </span>
                              <p className="text-[10px] text-slate-400 mt-0.5">Ingresa el conteo físico para validar</p>
                            </div>
                          ) : Math.abs(diff) < 0.01 ? (
                            <div>
                              <span className="inline-flex items-center gap-1.5 text-base font-black text-emerald-700 dark:text-emerald-400">
                                <CheckCircle2 className="w-4 h-4" /> Arqueo Cuadrado
                              </span>
                              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400/80 uppercase tracking-wide">
                                Diferencia: $0.00 (Sin faltantes)
                              </p>
                            </div>
                          ) : diff > 0 ? (
                            <div>
                              <span className="inline-flex items-center gap-1.5 text-base font-black text-indigo-700 dark:text-indigo-400 font-mono tabular-nums">
                                <ArrowUpRight className="w-4 h-4" /> Sobrante: +${diff.toFixed(2)}
                              </span>
                              <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400/80 uppercase tracking-wide">
                                Hay dinero de más en gaveta
                              </p>
                            </div>
                          ) : (
                            <div>
                              <span className="inline-flex items-center gap-1.5 text-base font-black text-rose-700 dark:text-rose-400 font-mono tabular-nums">
                                <ArrowDownRight className="w-4 h-4" /> Faltante: -${Math.abs(diff).toFixed(2)}
                              </span>
                              <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400/80 uppercase tracking-wide">
                                Falta dinero en la gaveta
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Detalle de Salidas y Gastos */}
              <div className="border border-[var(--border-color)] rounded-2xl p-4 sm:p-5 bg-white dark:bg-slate-900/40">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-slate-400" />
                    <h4 className="text-xs sm:text-sm font-black text-[var(--text-main)] uppercase tracking-wider">
                      Detalle de Salidas y Gastos ({corteData.gastos?.detalles?.length || 0})
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono font-black text-rose-600 dark:text-rose-400">
                    Total: -${(corteData.gastos?.totalCaja || 0).toFixed(2)}
                  </span>
                </div>

                {!corteData.gastos?.detalles || corteData.gastos.detalles.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">No se registraron gastos de caja chica en este turno.</p>
                ) : (
                  <div className="max-h-44 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {corteData.gastos.detalles.map((g: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700 text-xs">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-800 dark:text-slate-100">{g.descripcion}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span>{new Date(g.fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{g.usuario?.nombre_completo || 'Admin'}</span>
                            <span>•</span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase text-[9px] font-bold">
                              {g.categoria || 'GENERAL'}
                            </span>
                          </div>
                        </div>
                        <span className="font-black text-rose-600 dark:text-rose-400 font-mono tabular-nums shrink-0 ml-3">
                          -${g.monto.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {corteData.cancelaciones?.cantidad > 0 && (
                  <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-xl border border-orange-200/80 dark:border-orange-800/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
                      <div>
                        <p className="text-xs font-black text-orange-800 dark:text-orange-200">
                          {corteData.cancelaciones.cantidad} Ventas Canceladas
                        </p>
                        <p className="text-[10px] text-orange-600 dark:text-orange-400">
                          Monto de devoluciones registrado en auditoría
                        </p>
                      </div>
                    </div>
                    <span className="font-black text-orange-700 dark:text-orange-300 font-mono tabular-nums text-sm">
                      ${corteData.cancelaciones.total.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

            </div>

            {/* Sticky Footer */}
            <div className="px-5 sm:px-7 py-3 sm:py-4 border-t border-[var(--border-color)] bg-slate-50/70 dark:bg-slate-900/70 flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 shrink-0">
              <button 
                type="button"
                onClick={() => setShowCorteModal(false)}
                className="w-full sm:w-auto sm:px-6 py-3 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-black text-xs uppercase tracking-wider transition-all order-2 sm:order-1 active:scale-95 text-center"
              >
                Cerrar
              </button>
              <button 
                type="button"
                onClick={handlePrintCorteTrigger}
                className="w-full sm:flex-1 py-3 px-6 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-xl sm:rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 order-1 sm:order-2"
              >
                <Printer className="w-4 h-4 text-emerald-400 dark:text-white" />
                <span>Imprimir Corte de Caja (Ticket / PDF)</span>
              </button>
            </div>

          </div>
        </div>
      )}
      {/* --- Modal de Reporte Mensual --- */}
      {showMonthlyModal && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col p-4 sm:p-6 lg:p-8 max-h-[90vh]">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3 sm:gap-5">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-100 dark:bg-indigo-950/60 rounded-2xl sm:rounded-3xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner shrink-0">
                  <Activity className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 dark:text-white tracking-tight">Reporte Mensual</h3>
                  <p className="text-slate-400 font-bold uppercase text-[9px] sm:text-[10px] tracking-widest mt-0.5">Análisis Financiero y de Rendimiento</p>
                </div>
              </div>
              <button 
                onClick={() => setShowMonthlyModal(false)}
                className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl sm:rounded-2xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all shrink-0"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-6">
              <div className="flex gap-2 flex-1 sm:max-w-xs">
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value={1}>Enero</option><option value={2}>Febrero</option><option value={3}>Marzo</option>
                  <option value={4}>Abril</option><option value={5}>Mayo</option><option value={6}>Junio</option>
                  <option value={7}>Julio</option><option value={8}>Agosto</option><option value={9}>Septiembre</option>
                  <option value={10}>Octubre</option><option value={11}>Noviembre</option><option value={12}>Diciembre</option>
                </select>
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-24 sm:w-28 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                </select>
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={exportMonthlyReportToCSV}
                  className="w-full sm:w-auto bg-emerald-500 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all active:scale-95"
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
              <div className="flex-1 overflow-y-auto space-y-6 sm:space-y-8 pr-1 custom-scrollbar">
                {/* Métricas Mensuales */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                  <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ventas Brutas</p>
                    <p className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white font-mono tabular-nums">${monthlyReportData.totalSales.toFixed(2)}</p>
                  </div>
                  <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Utilidad Bruta</p>
                    <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">${monthlyReportData.grossProfit.toFixed(2)}</p>
                  </div>
                  <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gastos Totales</p>
                    <p className="text-2xl sm:text-3xl font-black text-red-500 font-mono tabular-nums">${monthlyReportData.totalExpenses.toFixed(2)}</p>
                  </div>
                  <div className="p-4 sm:p-6 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-600/10">
                    <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Utilidad Neta</p>
                    <p className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums">${monthlyReportData.netProfit.toFixed(2)}</p>
                  </div>
                </div>

                {/* Desglose por Método de Pago */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col p-6 sm:p-7 max-h-[90vh] overflow-y-auto custom-scrollbar">
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
          fondoInicial={fondoInicialCaja}
          fechaEmision={fechaEmisionCorte}
          cajaNombre={selectedCajaCorte === 'all' ? 'Resumen General' : (availableCajas.find(c => c.id.toString() === selectedCajaCorte)?.nombre || 'Caja')}
        />
      </div>

    </div>
  );
}


