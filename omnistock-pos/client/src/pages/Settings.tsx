import { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  User as UserIcon, Shield, Settings as SettingsIcon, 
  UserPlus, Trash2, Key, Check, Palette, Lock,
  Sun, Moon, Database, Monitor, ScanLine, Plus
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import clsx from 'clsx';

interface User {
  id: string;
  nombre_completo: string;
  username: string;
  rol: string;
  activo: boolean;
}

export default function Settings() {
  const { user: currentUser } = useAuthStore();
  const { mode, setMode, accentColor, setAccentColor } = useThemeStore();
  const [activeTab, setActiveTab] = useState<'USUARIOS' | 'PERFIL' | 'SISTEMA' | 'CAJAS'>(currentUser?.rol === 'ADMIN' ? 'USUARIOS' : 'PERFIL');
  const [users, setUsers] = useState<User[]>([]);
  const [cajas, setCajas] = useState<any[]>([]);
  
  // Modals
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAddCaja, setShowAddCaja] = useState(false);
  const [newCajaName, setNewCajaName] = useState('');
  
  // Forms
  const [userForm, setUserForm] = useState({ 
    nombre_completo: '', 
    nombre_usuario: '', // Keep internal form field name as nombre_usuario for simplicity in the input binding if desired, but we map it to 'username' in API
    password: '', 
    rol: 'CAJERO' 
  });
  
  const [businessForm, setBusinessForm] = useState({
    business_name: '',
    business_rfc: '',
    business_address: '',
    business_phone: '',
    business_slogan: 'Retail Solutions',
    business_website: '',
    business_social: ''
  });

  const fetchUsers = async () => {
    try {
      console.log('Fetching users...');
      const res = await api.get('/users');
      console.log('Users received:', res.data.data);
      setUsers(res.data.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await api.get('/admin/config');
      setBusinessForm(prev => ({ ...prev, ...res.data.data }));
    } catch (err) {
      console.error('Error fetching config', err);
    }
  };

  const fetchCajas = async () => {
    try {
      const res = await api.get('/admin/cajas');
      setCajas(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'USUARIOS') fetchUsers();
    if (activeTab === 'SISTEMA') fetchConfig();
    if (activeTab === 'CAJAS') fetchCajas();
  }, [activeTab]);

  const handleUpdateBusiness = async () => {
    try {
      await api.post('/admin/config', businessForm);
      alert('Datos del negocio actualizados con éxito');
    } catch (err) {
      alert('Error al actualizar datos del negocio');
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const response = await api.get('/admin/export/backup', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `OmniStock_Respaldo_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Error al descargar el respaldo');
    }
  };

  const handleCreateUser = async () => {
    try {
      await api.post('/users', userForm);
      setShowAddUser(false);
      setUserForm({ nombre_completo: '', nombre_usuario: '', password: '', rol: 'CAJERO' });
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al crear usuario');
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    try {
      await api.put(`/users/${selectedUser.id}`, userForm);
      setShowEditUser(false);
      setSelectedUser(null);
      setUserForm({ nombre_completo: '', nombre_usuario: '', password: '', rol: 'CAJERO' });
      fetchUsers();
    } catch (err: any) {
      alert('Error al actualizar usuario');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('¿Estás seguro de dar de baja a este usuario?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar');
    }
  };

  const handleCreateCaja = async () => {
    try {
      await api.post('/admin/cajas', { nombre: newCajaName });
      setNewCajaName('');
      setShowAddCaja(false);
      fetchCajas();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al crear caja');
    }
  };

  const handleToggleCaja = async (id: number, currentEstado: string) => {
    try {
      await api.put(`/admin/cajas/${id}`, { 
        estado: currentEstado === 'ACTIVA' ? 'INACTIVA' : 'ACTIVA' 
      });
      fetchCajas();
    } catch (err) {
      alert('Error al cambiar estado de la caja');
    }
  };

  const handleDeleteCaja = async (id: number) => {
    if (!confirm('¿Seguro que quieres eliminar esta caja?')) return;
    try {
      await api.delete(`/admin/cajas/${id}`);
      fetchCajas();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar caja');
    }
  };

  return (
    <div className="p-10 max-w-7xl mx-auto min-h-full pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h2 className="text-4xl font-black text-[var(--text-main)] tracking-tight flex items-center gap-4 italic">
            <SettingsIcon className="w-10 h-10 text-emerald-500" />
            Configuración
          </h2>
          <p className="text-[var(--text-muted)] font-medium mt-2 text-lg">Gestiona usuarios, seguridad y preferencias del sistema.</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex p-1.5 bg-[var(--bg-main)] rounded-[2rem] w-fit mb-12 backdrop-blur-sm border border-[var(--border-color)]">
        {currentUser?.rol === 'ADMIN' && (
          <button 
            onClick={() => setActiveTab('USUARIOS')}
            className={clsx(
              "px-8 py-3 rounded-[1.5rem] text-sm font-black transition-all flex items-center gap-2",
              activeTab === 'USUARIOS' ? "bg-[var(--bg-card)] text-emerald-600 shadow-xl shadow-emerald-500/10" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            )}
          >
            <Shield className="w-4 h-4" /> USUARIOS
          </button>
        )}
        <button 
          onClick={() => setActiveTab('PERFIL')}
          className={clsx(
            "px-8 py-3 rounded-[1.5rem] text-sm font-black transition-all flex items-center gap-2",
            activeTab === 'PERFIL' ? "bg-[var(--bg-card)] text-emerald-600 shadow-xl shadow-emerald-500/10" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
          )}
        >
          <UserIcon className="w-4 h-4" /> MI PERFIL
        </button>
        <button 
          onClick={() => setActiveTab('SISTEMA')}
          className={clsx(
            "px-8 py-3 rounded-[1.5rem] text-sm font-black transition-all flex items-center gap-2",
            activeTab === 'SISTEMA' ? "bg-[var(--bg-card)] text-emerald-600 shadow-xl shadow-emerald-500/10" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
          )}
        >
          <Palette className="w-4 h-4" /> SISTEMA
        </button>
        {currentUser?.rol === 'ADMIN' && (
          <button 
            onClick={() => setActiveTab('CAJAS')}
            className={clsx(
              "px-8 py-3 rounded-[1.5rem] text-sm font-black transition-all flex items-center gap-2",
              activeTab === 'CAJAS' ? "bg-[var(--bg-card)] text-emerald-600 shadow-xl shadow-emerald-500/10" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            )}
          >
            <Monitor className="w-4 h-4" /> CAJAS / POS
          </button>
        )}
      </div>

      {/* TAB CONTENT: USUARIOS */}
      {activeTab === 'USUARIOS' && (
        <div className="animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tight italic">Control de Usuarios</h3>
            <button 
              onClick={() => {
                setUserForm({ nombre_completo: '', nombre_usuario: '', password: '', rol: 'CAJERO' });
                setShowAddUser(true);
              }}
              className="px-6 py-3 bg-emerald-500 text-white rounded-2xl font-black flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
            >
              <UserPlus className="w-5 h-5" /> NUEVO USUARIO
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {users.map(u => (
              <div key={u.id} className="bg-[var(--bg-card)] p-8 rounded-[3rem] border border-[var(--border-color)] shadow-sm hover:shadow-xl hover:border-emerald-500/30 transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <div className={clsx(
                    "w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all",
                    u.rol === 'ADMIN' ? "bg-indigo-100 text-indigo-600" : "bg-emerald-100 text-emerald-600"
                  )}>
                    <UserIcon className="w-8 h-8" />
                  </div>
                  <span className={clsx(
                    "px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase",
                    u.rol === 'ADMIN' ? "bg-indigo-50 text-indigo-700" : "bg-emerald-50 text-emerald-700"
                  )}>
                    {u.rol}
                  </span>
                </div>
                
                <h4 className="text-xl font-black text-[var(--text-main)] mb-1">{u.nombre_completo}</h4>
                <p className="text-[var(--text-muted)] font-bold text-sm mb-6">@{u.username}</p>
                
                <div className="flex gap-2 pt-4 border-t border-slate-50">
                  <button 
                    onClick={() => {
                      setSelectedUser(u);
                      setUserForm({ nombre_completo: u.nombre_completo, nombre_usuario: u.username, password: '', rol: u.rol });
                      setShowEditUser(true);
                    }}
                    className="flex-1 py-3 bg-[var(--bg-main)] hover:bg-slate-900 hover:text-white dark:hover:bg-emerald-500 text-[var(--text-main)] rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 border border-[var(--border-color)]"
                  >
                    <Key className="w-4 h-4" /> EDITAR
                  </button>
                  {u.id !== currentUser?.id && (
                    <button 
                      onClick={() => handleDeleteUser(u.id)}
                      className="w-12 h-12 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all flex items-center justify-center"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {users.length === 0 && (
            <div className="text-center py-20 bg-[var(--bg-main)] rounded-[3rem] border-2 border-dashed border-[var(--border-color)]">
              <UserIcon className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <p className="text-[var(--text-muted)] font-bold uppercase text-sm tracking-widest">No hay otros usuarios registrados</p>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: PERFIL */}
      {activeTab === 'PERFIL' && (
        <div className="animate-in slide-in-from-bottom-4 duration-300 max-w-2xl mx-auto">
          <div className="bg-[var(--bg-card)] p-10 rounded-[3rem] border border-[var(--border-color)] shadow-xl">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 rounded-3xl flex items-center justify-center mb-8 mx-auto">
              <UserIcon className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-[var(--text-main)] text-center mb-2 italic">{currentUser?.nombre_completo}</h3>
            <p className="text-[var(--text-muted)] font-medium text-center mb-10">Gestiona tu seguridad y acceso.</p>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Contraseña Actual</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input 
                    type="password" 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-0 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/20"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nueva Contraseña</label>
                  <input type="password" placeholder="••••••••" className="w-full px-4 py-4 bg-slate-50 border-0 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-emerald-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Confirmar</label>
                  <input type="password" placeholder="••••••••" className="w-full px-4 py-4 bg-slate-50 border-0 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-emerald-500/20" />
                </div>
              </div>
              <button className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black transition-all shadow-xl shadow-emerald-500/20 mt-4">
                ACTUALIZAR MI PERFIL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: SISTEMA */}
      {activeTab === 'SISTEMA' && (
        <div className="animate-in slide-in-from-bottom-4 duration-300">
           <div className={`grid grid-cols-1 ${currentUser?.rol === 'ADMIN' ? 'md:grid-cols-2' : 'max-w-2xl'} gap-8 mx-auto`}>
              {/* Apariencia */}
              <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl dark:bg-slate-900 dark:border-slate-800">
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mb-8">
                  <Palette className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-4">Apariencia</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed">
                  Personaliza cómo se ve tu punto de venta.
                </p>
                
                <div className="space-y-8">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Modo de Pantalla</label>
                    <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
                      <button 
                        onClick={() => setMode('light')}
                        className={clsx(
                          "px-6 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all",
                          mode === 'light' ? "bg-[var(--bg-card)] text-[var(--text-main)] shadow-md" : "text-[var(--text-muted)]"
                        )}
                      >
                        <Sun className="w-4 h-4" /> CLARO
                      </button>
                      <button 
                        onClick={() => setMode('dark')}
                        className={clsx(
                          "px-6 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all",
                          mode === 'dark' ? "bg-slate-700 text-white shadow-md" : "text-slate-500"
                        )}
                      >
                        <Moon className="w-4 h-4" /> OSCURO
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Color de Acento</label>
                    <div className="flex flex-wrap gap-4">
                       {[
                         { name: 'Esmeralda', hex: '#10b981' },
                         { name: 'Índigo', hex: '#6366f1' },
                         { name: 'Carmesí', hex: '#f43f5e' },
                         { name: 'Ámbar', hex: '#f59e0b' },
                         { name: 'Cian', hex: '#06b6d4' },
                         { name: 'Púrpura', hex: '#a855f7' }
                       ].map(c => (
                         <button 
                          key={c.hex}
                          onClick={() => setAccentColor(c.hex)}
                          className={clsx(
                            "w-12 h-12 rounded-full transition-all hover:scale-110 relative",
                            accentColor === c.hex ? "ring-4 ring-offset-4 ring-slate-200 dark:ring-slate-700" : ""
                          )}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                         >
                           {accentColor === c.hex && <Check className="w-6 h-6 text-white absolute inset-0 m-auto" />}
                         </button>
                       ))}
                    </div>
                  </div>
                </div>
              </div>

              {currentUser?.rol === 'ADMIN' && (
                <>
                  {/* Información del Sistema */}
                  <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl dark:bg-slate-900 dark:border-slate-800">
                     <div className="w-16 h-16 bg-slate-100 text-slate-600 rounded-3xl flex items-center justify-center mb-8">
                      <SettingsIcon className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-4 italic">Datos del Negocio</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">
                      Estos datos aparecerán impresos en tus tickets de venta.
                    </p>
                    
                    <div className="space-y-4 mb-8">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nombre Comercial</label>
                        <input 
                          type="text" 
                          value={businessForm.business_name}
                          onChange={e => setBusinessForm({...businessForm, business_name: e.target.value})}
                          placeholder="Ej: Abarrotes 'La Esperanza'"
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-emerald-500/20" 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">RFC</label>
                          <input 
                            type="text" 
                            value={businessForm.business_rfc}
                            onChange={e => setBusinessForm({...businessForm, business_rfc: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-emerald-500/20" 
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Teléfono</label>
                          <input 
                            type="text" 
                            value={businessForm.business_phone}
                            onChange={e => setBusinessForm({...businessForm, business_phone: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-emerald-500/20" 
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Dirección</label>
                        <input 
                          type="text" 
                          value={businessForm.business_address}
                          onChange={e => setBusinessForm({...businessForm, business_address: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-emerald-500/20" 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sitio Web</label>
                          <input 
                            type="text" 
                            value={businessForm.business_website}
                            onChange={e => setBusinessForm({...businessForm, business_website: e.target.value})}
                            placeholder="www.tuweb.com"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-emerald-500/20" 
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Red Social</label>
                          <input 
                            type="text" 
                            value={businessForm.business_social}
                            onChange={e => setBusinessForm({...businessForm, business_social: e.target.value})}
                            placeholder="@tusocial"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-emerald-500/20" 
                          />
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={handleUpdateBusiness}
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs tracking-widest hover:bg-emerald-500 transition-all shadow-xl"
                    >
                      GUARDAR DATOS DEL TICKET
                    </button>
                  </div>

                  {/* Información Técnica */}
                  <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl dark:bg-slate-900 dark:border-slate-800">
                     <div className="w-16 h-16 bg-slate-100 text-slate-600 rounded-3xl flex items-center justify-center mb-8">
                      <Shield className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-4">Mantenimiento</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mb-6">
                      Descarga una copia completa de tu base de datos para seguridad externa.
                    </p>
                    <button 
                      onClick={handleDownloadBackup}
                      className="w-full py-4 border-2 border-dashed border-slate-200 text-slate-500 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl font-black text-xs tracking-widest transition-all mb-8 flex items-center justify-center gap-2"
                    >
                      <Database className="w-4 h-4" /> DESCARGAR RESPALDO (.JSON)
                    </button>

                    <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-4">Información Técnica</h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                        <p className="text-xs font-black text-slate-400 uppercase mb-1">Base de Datos</p>
                        <p className="font-bold text-slate-700 dark:text-slate-200">Microsoft SQL Server</p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                        <p className="text-xs font-black text-slate-400 uppercase mb-1">Versión</p>
                        <p className="font-bold text-slate-700 dark:text-slate-200">v2.5.0-Enterprise</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
           </div>
        </div>
      )}

      {/* MODAL: ADD USER */}
      {showAddUser && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] w-full max-w-md rounded-[3rem] shadow-2xl p-10 animate-in zoom-in-95 duration-200 border border-[var(--border-color)]">
            <h3 className="text-2xl font-black text-[var(--text-main)] mb-8 italic">Crear Nuevo Usuario</h3>
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nombre Completo</label>
                <input 
                  type="text" 
                  value={userForm.nombre_completo}
                  onChange={e => setUserForm({...userForm, nombre_completo: e.target.value})}
                  className="w-full bg-slate-50 border-0 rounded-2xl p-4 font-bold outline-none focus:ring-4 focus:ring-emerald-500/20" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Usuario (Login)</label>
                <input 
                  type="text" 
                  value={userForm.nombre_usuario}
                  onChange={e => setUserForm({...userForm, nombre_usuario: e.target.value})}
                  className="w-full bg-slate-50 border-0 rounded-2xl p-4 font-bold outline-none focus:ring-4 focus:ring-emerald-500/20" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Contraseña Asignada</label>
                <input 
                  type="password" 
                  value={userForm.password}
                  onChange={e => setUserForm({...userForm, password: e.target.value})}
                  className="w-full bg-slate-50 border-0 rounded-2xl p-4 font-bold outline-none focus:ring-4 focus:ring-emerald-500/20" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Rol</label>
                <select 
                  value={userForm.rol}
                  onChange={e => setUserForm({...userForm, rol: e.target.value})}
                  className="w-full bg-slate-50 border-0 rounded-2xl p-4 font-bold outline-none focus:ring-4 focus:ring-emerald-500/20"
                >
                  <option value="CAJERO">Cajero (Solo POS)</option>
                  <option value="ADMIN">Administrador (Acceso Total)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setShowAddUser(false)}
                className="py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-all"
              >
                CANCELAR
              </button>
              <button 
                onClick={handleCreateUser}
                className="py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black transition-all"
              >
                CREAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER */}
      {showEditUser && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] w-full max-w-md rounded-[3rem] shadow-2xl p-10 animate-in zoom-in-95 duration-200 border border-[var(--border-color)]">
            <h3 className="text-2xl font-black text-[var(--text-main)] mb-8 italic">Editar Usuario</h3>
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nombre Completo</label>
                <input 
                  type="text" 
                  value={userForm.nombre_completo}
                  onChange={e => setUserForm({...userForm, nombre_completo: e.target.value})}
                  className="w-full bg-slate-50 border-0 rounded-2xl p-4 font-bold outline-none focus:ring-4 focus:ring-emerald-500/20" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nueva Contraseña (Dejar vacío para no cambiar)</label>
                <input 
                  type="password" 
                  value={userForm.password}
                  onChange={e => setUserForm({...userForm, password: e.target.value})}
                  className="w-full bg-slate-50 border-0 rounded-2xl p-4 font-bold outline-none focus:ring-4 focus:ring-emerald-500/20" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Rol</label>
                <select 
                  value={userForm.rol}
                  onChange={e => setUserForm({...userForm, rol: e.target.value})}
                  className="w-full bg-slate-50 border-0 rounded-2xl p-4 font-bold outline-none focus:ring-4 focus:ring-emerald-500/20"
                >
                  <option value="CAJERO">Cajero</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setShowEditUser(false)}
                className="py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-all"
              >
                CANCELAR
              </button>
              <button 
                onClick={handleUpdateUser}
                className="py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black transition-all"
              >
                GUARDAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Pestaña de Cajas --- */}
      {activeTab === 'CAJAS' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tight italic">Gestión de Cajas</h3>
              <p className="text-[var(--text-muted)] font-bold text-xs uppercase tracking-widest mt-1">Administra los puntos de venta físicos</p>
            </div>
            <button 
              onClick={() => setShowAddCaja(true)}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" /> NUEVA CAJA
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cajas.map((caja) => (
              <div key={caja.id} className="bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border-color)] shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                 <div className={clsx(
                   "absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full blur-3xl opacity-10 transition-all",
                   caja.estado === 'ACTIVA' ? "bg-emerald-500" : "bg-slate-500"
                 )}></div>

                 <div className="flex items-start justify-between mb-6">
                    <div className={clsx(
                      "w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner",
                      caja.estado === 'ACTIVA' ? "bg-emerald-50 text-emerald-500" : "bg-slate-50 text-slate-400"
                    )}>
                      <Monitor className="w-7 h-7" />
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleToggleCaja(caja.id, caja.estado)}
                        className={clsx(
                          "p-2 rounded-xl transition-all",
                          caja.estado === 'ACTIVA' ? "bg-amber-50 text-amber-600 hover:bg-amber-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        )}
                        title={caja.estado === 'ACTIVA' ? "Desactivar" : "Activar"}
                      >
                        <Lock className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteCaja(caja.id)}
                        className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                 </div>

                 <h4 className="text-xl font-black text-[var(--text-main)] uppercase mb-1">{caja.nombre}</h4>
                 <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-6 italic">ID de Registro: #{caja.id.toString().padStart(3, '0')}</p>

                 <div className="flex items-center gap-2">
                    <div className={clsx(
                      "w-2 h-2 rounded-full",
                      caja.estado === 'ACTIVA' ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                    )}></div>
                    <span className={clsx(
                      "text-[10px] font-black uppercase tracking-widest",
                      caja.estado === 'ACTIVA' ? "text-emerald-600" : "text-slate-400"
                    )}>
                      {caja.estado === 'ACTIVA' ? 'En Línea / Activa' : 'Fuera de Servicio'}
                    </span>
                 </div>
              </div>
            ))}
          </div>

          {cajas.length === 0 && (
            <div className="text-center py-20 bg-[var(--bg-main)] rounded-[3rem] border-2 border-dashed border-[var(--border-color)]">
              <Monitor className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <p className="text-[var(--text-muted)] font-bold uppercase text-sm tracking-widest">No hay cajas registradas</p>
              <button 
                onClick={() => setShowAddCaja(true)}
                className="mt-6 text-emerald-600 font-black text-xs uppercase tracking-widest hover:underline"
              >
                Comienza agregando tu primera caja
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- Modal Nueva Caja --- */}
      {showAddCaja && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-[var(--bg-card)] w-full max-w-md rounded-[3rem] shadow-2xl p-10 animate-in zoom-in duration-300 border border-[var(--border-color)]">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 mx-auto">
                 <ScanLine className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-[var(--text-main)] text-center mb-1 uppercase tracking-tight italic">Nueva Caja</h3>
              <p className="text-[var(--text-muted)] font-bold text-center mb-8 uppercase text-[10px] tracking-widest">Identifica tu punto de venta</p>
              
              <div className="space-y-6 mb-10">
                 <div>
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase ml-2 mb-2 block tracking-widest">Nombre de la Caja</label>
                    <input 
                      autoFocus
                      type="text"
                      value={newCajaName}
                      onChange={(e) => setNewCajaName(e.target.value)}
                      placeholder="Ej: Caja 01 - Principal"
                      className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl p-4 font-black text-[var(--text-main)] focus:ring-4 focus:ring-emerald-500/10 outline-none uppercase"
                    />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <button 
                   onClick={() => setShowAddCaja(false)}
                   className="py-4 bg-[var(--bg-main)] text-[var(--text-muted)] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all border border-[var(--border-color)]"
                 >
                   CANCELAR
                 </button>
                 <button 
                   onClick={handleCreateCaja}
                   disabled={!newCajaName}
                   className="py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50"
                 >
                   CREAR CAJA
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
