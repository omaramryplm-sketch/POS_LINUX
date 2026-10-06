import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { 
  ShoppingCart, LayoutDashboard, Tags, LogOut, 
  Settings as SettingsIcon, User as UserIcon, Package,
  Menu, X, Users, BookOpen
} from 'lucide-react';
import { useState, useEffect } from 'react';
import clsx from 'clsx';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const { mode, accentColor } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Punto de Venta', path: '/', icon: ShoppingCart, roles: ['ADMIN', 'CAJERO'] },
    { name: 'Clientes', path: '/clients', icon: Users, roles: ['ADMIN', 'CAJERO'] },
    { name: 'Panel Admin', path: '/admin', icon: LayoutDashboard, roles: ['ADMIN'] },
    { name: 'Inventario', path: '/admin/inventory', icon: Package, roles: ['ADMIN'] },
    { name: 'Ajuste Precios', path: '/admin/bulk-prices', icon: Tags, roles: ['ADMIN'] },
    { name: 'Capacitación 🎓', path: '/capacitacion', icon: BookOpen, roles: ['ADMIN', 'CAJERO'] },
  ];

  return (
    <div className={clsx("flex flex-col lg:flex-row h-screen overflow-hidden transition-colors duration-500", mode === 'dark' ? "dark bg-[#020617]" : "bg-[#F8FAFC]")}>
      <style>{`
        :root {
          --brand-500: ${accentColor};
          --brand-600: ${accentColor}dd;
          --brand-50: ${accentColor}11;
        }
        .bg-emerald-500 { background-color: var(--brand-500) !important; }
        .text-emerald-500 { color: var(--brand-500) !important; }
        .text-emerald-600 { color: var(--brand-500) !important; }
        .bg-emerald-100 { background-color: var(--brand-50) !important; }
        .text-emerald-700 { color: var(--brand-500) !important; }
        .border-emerald-500 { border-color: var(--brand-500) !important; }
        .hover\\:bg-emerald-600:hover { background-color: var(--brand-600) !important; }
        .shadow-emerald-500\\/20 { shadow-color: ${accentColor}33 !important; }
      `}</style>

      {/* Top Bar for Mobile */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#0F172A] text-white border-b border-slate-800 z-30 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20">
            <ShoppingCart className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight leading-none bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              OmniStock
            </h1>
            <p className="text-[8px] font-black text-emerald-400 tracking-widest uppercase">POS</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-800 rounded-full text-slate-300 border border-slate-700 truncate max-w-[120px]">
            {user?.nombre_completo?.split(' ')[0] || user?.username || 'Usuario'}
          </span>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-slate-300 hover:text-white rounded-xl bg-slate-800/80 active:scale-95 transition-all"
            aria-label="Abrir menú"
          >
            {isSidebarOpen ? <X className="w-5 h-5 text-emerald-400" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        "fixed lg:relative inset-y-0 left-0 w-60 xl:w-64 2xl:w-72 bg-[#0F172A] text-white flex flex-col shadow-2xl z-50 border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 shrink-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-4 xl:p-6 pb-2 xl:pb-4">
          <div className="flex items-center gap-3 mb-4 xl:mb-5">
            <div className="w-9 h-9 xl:w-10 xl:h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 transition-all duration-300 shrink-0">
              <ShoppingCart className="w-5 h-5 xl:w-5.5 xl:h-5.5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base xl:text-lg font-black tracking-tight text-white leading-none">
                  OmniStock
                </h1>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span> POS
                </span>
              </div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Terminal Inteligente</p>
            </div>
          </div>
          
          <div className="p-2.5 xl:p-3 bg-slate-800/50 rounded-xl xl:rounded-2xl border border-slate-700/50">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 xl:w-8 xl:h-8 bg-slate-700 rounded-full flex items-center justify-center border border-slate-600 shrink-0">
                <UserIcon className="w-3.5 h-3.5 text-slate-300" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs xl:text-sm font-bold truncate">{user?.nombre_completo}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{user?.rol}</p>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 xl:px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          <p className="px-3 text-[9px] xl:text-[10px] font-black text-slate-500 uppercase tracking-widest my-2">Menú Principal</p>
          {navItems.map((item) => {
            if (!item.roles.includes(user?.rol || '')) return null;
            
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  "flex items-center space-x-3 px-3.5 py-2.5 xl:py-3 rounded-xl xl:rounded-2xl transition-all duration-200 group relative text-xs xl:text-sm",
                  isActive 
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 font-bold" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200 font-medium"
                )}
              >
                <item.icon className={clsx("w-4 h-4 xl:w-5 xl:h-5 shrink-0", isActive ? "text-white" : "group-hover:text-emerald-400")} />
                <span className="truncate">{item.name}</span>
                {isActive && (
                   <div className="absolute right-3.5 w-1.5 h-1.5 bg-white rounded-full"></div>
                )}
              </Link>
            );
          })}

          <div className="pt-4">
            <p className="px-3 text-[9px] xl:text-[10px] font-black text-slate-500 uppercase tracking-widest my-2">Configuración</p>
            <Link 
              to="/admin/settings"
              className={clsx(
                "flex items-center space-x-3 px-3.5 py-2.5 xl:py-3 w-full rounded-xl xl:rounded-2xl transition-all text-xs xl:text-sm",
                location.pathname === '/admin/settings' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 font-bold" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200 font-medium"
              )}
            >
              <SettingsIcon className={clsx("w-4 h-4 xl:w-5 xl:h-5 shrink-0", location.pathname === '/admin/settings' ? "text-white" : "group-hover:text-emerald-400")} />
              <span className="truncate">Ajustes</span>
            </Link>
          </div>
        </nav>

        <div className="p-3 xl:p-4">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center space-x-2 px-3 py-2.5 xl:py-3 w-full bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl xl:rounded-2xl transition-all duration-200 text-xs xl:text-sm font-bold group"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden bg-[var(--bg-main)] relative flex flex-col h-full transition-colors duration-500 min-w-0">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full -mr-48 -mt-48 blur-3xl pointer-events-none"></div>
        
        <div key={location.pathname} className="relative z-10 flex-1 overflow-hidden flex flex-col h-full min-w-0 w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
