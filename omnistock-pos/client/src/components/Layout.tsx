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
    { name: 'Clientes', path: '/clients', icon: Users, roles: ['ADMIN'] },
    { name: 'Panel Admin', path: '/admin', icon: LayoutDashboard, roles: ['ADMIN'] },
    { name: 'Inventario', path: '/admin/inventory', icon: Package, roles: ['ADMIN'] },
    { name: 'Ajuste Precios', path: '/admin/bulk-prices', icon: Tags, roles: ['ADMIN'] },
    { name: 'Capacitación 🎓', path: '/capacitacion', icon: BookOpen, roles: ['ADMIN', 'CAJERO'] },
  ];

  return (
    <div className={clsx("flex h-screen transition-colors duration-500", mode === 'dark' ? "dark bg-[#020617]" : "bg-[#F8FAFC]")}>
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

      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-6 right-6 z-50 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all"
      >
        {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        "fixed lg:relative inset-y-0 left-0 w-72 bg-[#0F172A] text-white flex flex-col shadow-2xl z-50 border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 transition-all duration-500">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                OmniStock
              </h1>
              <p className="text-[10px] font-black text-emerald-500 tracking-widest uppercase">Professional POS</p>
            </div>
          </div>
          
          <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center border border-slate-600">
                <UserIcon className="w-4 h-4 text-slate-300" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate">{user?.nombre_completo}</p>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">{user?.rol}</p>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-2">
          <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Menú Principal</p>
          {navItems.map((item) => {
            if (!item.roles.includes(user?.rol || '')) return null;
            
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  "flex items-center space-x-3 px-4 py-4 rounded-2xl transition-all duration-300 group relative",
                  isActive 
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                )}
              >
                <item.icon className={clsx("w-5 h-5", isActive ? "text-white" : "group-hover:text-emerald-400")} />
                <span className="font-bold text-sm">{item.name}</span>
                {isActive && (
                   <div className="absolute right-4 w-1.5 h-1.5 bg-white rounded-full"></div>
                )}
              </Link>
            );
          })}

          <div className="pt-8">
            <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Configuración</p>
            <Link 
              to="/admin/settings"
              className={clsx(
                "flex items-center space-x-3 px-4 py-4 w-full rounded-2xl transition-all",
                location.pathname === '/admin/settings' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              )}
            >
              <SettingsIcon className={clsx("w-5 h-5", location.pathname === '/admin/settings' ? "text-white" : "group-hover:text-emerald-400")} />
              <span className="font-bold text-sm">Ajustes</span>
            </Link>
          </div>
        </nav>

        <div className="p-6">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center space-x-3 px-4 py-4 w-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl transition-all duration-300 group"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-bold text-sm">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden bg-[var(--bg-main)] relative flex flex-col h-full transition-colors duration-500">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full -mr-64 -mt-64 blur-3xl pointer-events-none"></div>
        
        <div key={location.pathname} className="relative z-10 flex-1 overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
