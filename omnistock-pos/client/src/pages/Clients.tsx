import { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  Users, Search, UserPlus, Phone, MapPin, 
  DollarSign, History, ShieldAlert, Ban, CheckCircle2, ArrowUpRight
} from 'lucide-react';

export default function Clients() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editClient, setEditClient] = useState({ nombre: '', telefono: '', direccion: '' });
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clientDetail, setClientDetail] = useState<any>(null);

  // Form states
  const [newClient, setNewClient] = useState({ nombre: '', telefono: '', direccion: '', limite_credito: 100 });
  const [abonoMonto, setAbonoMonto] = useState('');
  const [abonoNotas, setAbonoNotas] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await api.get('/clientes');
      setClients(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientDetail = async (id: number) => {
    try {
      const res = await api.get(`/clientes/${id}`);
      setClientDetail(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = () => {
    if (!selectedClient) return;
    setEditClient({
      nombre: selectedClient.nombre,
      telefono: selectedClient.telefono || '',
      direccion: selectedClient.direccion || ''
    });
    setShowEditModal(true);
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/clientes', newClient);
      setShowAddModal(false);
      setNewClient({ nombre: '', telefono: '', direccion: '', limite_credito: 100 });
      fetchClients();
    } catch (err) {
      alert('Error al crear cliente');
    }
  };

  const handleAbono = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/clientes/abono', {
        id_cliente: selectedClient.id,
        monto: abonoMonto,
        metodo_pago: 'EFECTIVO',
        notas: abonoNotas
      });
      setShowAbonoModal(false);
      setAbonoMonto('');
      setAbonoNotas('');
      fetchClients();
      setSelectedClient(res.data.data.cliente);
      if (selectedClient) fetchClientDetail(selectedClient.id);
    } catch (err) {
      alert('Error al registrar abono');
    }
  };

  const handleUpdateClient = async (id: number, data: any) => {
    try {
      const res = await api.put(`/clientes/${id}`, data);
      fetchClients();
      setSelectedClient(res.data.data);
      fetchClientDetail(id);
    } catch (err) {
      alert('Error al actualizar cliente');
    }
  };

  const filteredClients = clients.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.telefono || '').includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-main)]">
        <div className="w-16 h-16 border-4 border-indigo-500 border-b-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-8 bg-[var(--bg-main)]">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight italic uppercase">Gestión de Clientes</h2>
          <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mt-2">Control de créditos y cuentas por cobrar</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
        >
          <UserPlus className="w-5 h-5" /> NUEVO CLIENTE
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
        {/* Listado de Clientes */}
        <div className="w-full lg:w-[450px] flex flex-col bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50">
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="text"
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border-0 rounded-2xl pl-14 pr-6 py-4 font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {filteredClients.map((c) => (
              <button 
                key={c.id}
                onClick={() => { setSelectedClient(c); fetchClientDetail(c.id); }}
                className={`w-full flex items-center justify-between p-6 rounded-3xl transition-all border ${selectedClient?.id === c.id ? 'bg-indigo-600 border-indigo-700 shadow-xl shadow-indigo-600/20 text-white' : 'bg-slate-50 border-transparent hover:bg-white hover:border-slate-200 text-slate-800'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${selectedClient?.id === c.id ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                    {c.nombre.charAt(0)}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <p className="font-black uppercase text-sm truncate max-w-[120px]">{c.nombre}</p>
                      {c.betado && (
                        <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[8px] font-black rounded-md animate-pulse">VETADO</span>
                      )}
                    </div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${selectedClient?.id === c.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {c.telefono || 'Sin teléfono'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-black ${c.saldo_deudor > 0 ? (selectedClient?.id === c.id ? 'text-white' : 'text-red-500') : (c.saldo_deudor < 0 ? (selectedClient?.id === c.id ? 'text-white' : 'text-emerald-500') : (selectedClient?.id === c.id ? 'text-indigo-200' : 'text-slate-400'))}`}>
                    {c.saldo_deudor < 0 ? `-$${Math.abs(c.saldo_deudor).toFixed(2)}` : `$${c.saldo_deudor.toFixed(2)}`}
                  </p>
                  <p className={`text-[8px] font-black uppercase tracking-widest ${selectedClient?.id === c.id ? 'text-indigo-300' : 'text-slate-300'}`}>
                    {c.saldo_deudor < 0 ? 'A FAVOR' : 'DEUDA'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detalle del Cliente */}
        <div className="flex-1 flex flex-col bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden p-10 relative">
          {!selectedClient ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
              <Users className="w-24 h-24 opacity-10 mb-6" />
              <p className="text-xl font-bold uppercase tracking-widest">Selecciona un cliente</p>
              <p className="text-sm font-medium mt-1">Para gestionar su línea de crédito y pagos</p>
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex justify-between items-start mb-10 pb-10 border-b border-slate-50">
                <div className="flex items-center gap-8">
                  <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-indigo-600/30">
                    {selectedClient.nombre.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight">{selectedClient.nombre}</h3>
                      <button onClick={openEditModal} className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex gap-4 mt-3">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                        <Phone className="w-3.5 h-3.5" /> {selectedClient.telefono || 'N/A'}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                        <MapPin className="w-3.5 h-3.5" /> {selectedClient.direccion || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                   <div className={`${selectedClient.betado ? 'bg-red-600 text-white' : (selectedClient.saldo_deudor < 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100')} p-6 rounded-[2rem] border text-right min-w-[200px] transition-all`}>
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70">
                          {selectedClient.saldo_deudor < 0 ? 'Saldo a Favor' : 'Saldo a Liquidar'}
                        </p>
                        {selectedClient.betado && <ShieldAlert className="w-4 h-4" />}
                        {selectedClient.saldo_deudor < 0 && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                      <p className="text-4xl font-black">${Math.abs(selectedClient.saldo_deudor).toFixed(2)}</p>
                   </div>
                   <div className="flex gap-2">
                    <button 
                      onClick={() => setShowAbonoModal(true)}
                      className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-black text-xs rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                    >
                      <DollarSign className="w-4 h-4" /> REGISTRAR ABONO
                    </button>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-8 mb-8">
                 <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Límite de Crédito</p>
                    <div className="flex items-center gap-3">
                       <span className="text-2xl font-black text-slate-800">$</span>
                       <input 
                         type="number"
                         defaultValue={selectedClient.limite_credito}
                         onBlur={(e) => handleUpdateClient(selectedClient.id, { limite_credito: Number(e.target.value) })}
                         className="bg-white border-0 rounded-xl px-4 py-2 w-full font-black text-xl text-indigo-600 shadow-inner focus:ring-4 focus:ring-indigo-500/10 transition-all"
                       />
                    </div>
                 </div>

                 <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col justify-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Estatus de Cuenta</p>
                    <button 
                      onClick={() => handleUpdateClient(selectedClient.id, { betado: !selectedClient.betado })}
                      className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${selectedClient.betado ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                    >
                      {selectedClient.betado ? <><Ban className="w-4 h-4" /> VETADO / BLOQUEADO</> : <><CheckCircle2 className="w-4 h-4" /> CUENTA ACTIVA</>}
                    </button>
                 </div>

                 <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 flex flex-col justify-center">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Crédito Disponible</p>
                    <p className={`text-2xl font-black ${(selectedClient.limite_credito - selectedClient.saldo_deudor) > 0 ? 'text-indigo-600' : 'text-red-500'}`}>
                      ${(selectedClient.limite_credito - selectedClient.saldo_deudor).toFixed(2)}
                    </p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-8 flex-1 min-h-0 overflow-hidden">
                {/* Historial de Compras */}
                <div className="flex flex-col min-h-0 bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100">
                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <History className="w-4 h-4" /> Últimas Compras a Crédito
                  </h4>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {clientDetail?.ventas.filter((v:any) => v.metodo_pago === 'CREDITO').map((v: any) => (
                      <div key={v.id} className="p-4 bg-white rounded-2xl border border-slate-100 flex justify-between items-center group">
                        <div>
                          <p className="text-xs font-black text-slate-800">TICKET #{v.id}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(v.fecha).toLocaleDateString()}</p>
                        </div>
                        <span className="text-sm font-black text-slate-700">${v.total.toFixed(2)}</span>
                      </div>
                    ))}
                    {clientDetail?.ventas.length === 0 && <p className="text-center text-slate-300 py-10 font-bold italic">Sin compras recientes</p>}
                  </div>
                </div>

                {/* Historial de Abonos */}
                <div className="flex flex-col min-h-0 bg-indigo-50/50 rounded-[2.5rem] p-8 border border-indigo-50">
                  <h4 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <ArrowUpRight className="w-4 h-4" /> Historial de Abonos
                  </h4>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {clientDetail?.abonos.map((a: any) => (
                      <div key={a.id} className="p-4 bg-white rounded-2xl border border-indigo-100 flex justify-between items-center group">
                        <div>
                          <p className="text-xs font-black text-indigo-600">ABONO REALIZADO</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(a.fecha).toLocaleDateString()}</p>
                          {a.notas && <p className="text-[8px] text-slate-400 italic mt-1">{a.notas}</p>}
                        </div>
                        <span className="text-sm font-black text-emerald-600">+${a.monto.toFixed(2)}</span>
                      </div>
                    ))}
                    {clientDetail?.abonos.length === 0 && <p className="text-center text-slate-300 py-10 font-bold italic">Sin abonos registrados</p>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

            {/* Modal Editar Cliente */}
      {showEditModal && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
          <form onSubmit={async (e) => {
            e.preventDefault();
            await handleUpdateClient(selectedClient.id, editClient);
            setShowEditModal(false);
          }} className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10">
            <h3 className="text-2xl font-black text-slate-800 text-center mb-8 uppercase tracking-tight">Editar Cliente</h3>
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nombre Completo</label>
                <input type="text" required value={editClient.nombre} onChange={e => setEditClient({...editClient, nombre: e.target.value})} className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Tel�fono</label>
                <input type="text" value={editClient.telefono} onChange={e => setEditClient({...editClient, telefono: e.target.value})} className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Direcci�n</label>
                <input type="text" value={editClient.direccion} onChange={e => setEditClient({...editClient, direccion: e.target.value})} className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button type="button" onClick={() => setShowEditModal(false)} className="py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">CANCELAR</button>
              <button type="submit" className="py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl">GUARDAR</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Agregar Cliente */}
      {showAddModal && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
          <form onSubmit={handleCreateClient} className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10">
            <h3 className="text-2xl font-black text-slate-800 text-center mb-8 uppercase tracking-tight">Nuevo Cliente</h3>
            <div className="space-y-4 mb-8">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-2 block">Nombre Completo</label>
                <input required type="text" value={newClient.nombre} onChange={e => setNewClient({...newClient, nombre: e.target.value})} className="w-full bg-slate-50 border-0 rounded-2xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-2 block">Teléfono</label>
                <input type="text" value={newClient.telefono || ''} onChange={e => setNewClient({...newClient, telefono: e.target.value})} className="w-full bg-slate-50 border-0 rounded-2xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-2 block">Dirección</label>
                <input type="text" value={newClient.direccion || ''} onChange={e => setNewClient({...newClient, direccion: e.target.value})} className="w-full bg-slate-50 border-0 rounded-2xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button type="button" onClick={() => setShowAddModal(false)} className="py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">CANCELAR</button>
              <button type="submit" className="py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl">GUARDAR</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Registrar Abono */}
      {showAbonoModal && selectedClient && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
          <form onSubmit={handleAbono} className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10">
            <h3 className="text-2xl font-black text-slate-800 text-center mb-1 uppercase tracking-tight">Registrar Abono</h3>
            <p className="text-slate-400 font-bold text-center mb-8 uppercase text-[10px] tracking-widest">Pago parcial de deuda</p>
            
            <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100 mb-8 flex justify-between items-center">
              <span className="text-[10px] font-black text-red-400 uppercase">Deuda Actual</span>
              <span className="text-2xl font-black text-red-600">${selectedClient.saldo_deudor.toFixed(2)}</span>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-2 block">Monto del Abono ($)</label>
                <input required autoFocus type="number" step="0.01" value={abonoMonto} onChange={e => setAbonoMonto(e.target.value)} className="w-full bg-slate-50 border-0 rounded-2xl p-4 font-black text-emerald-600 text-3xl outline-none focus:ring-4 focus:ring-emerald-500/10" placeholder="0.00" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-2 block">Notas / Concepto</label>
                <input type="text" value={abonoNotas} onChange={e => setAbonoNotas(e.target.value)} placeholder="Ej: Pago semanal, depósito, etc." className="w-full bg-slate-50 border-0 rounded-2xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button type="button" onClick={() => setShowAbonoModal(false)} className="py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">CANCELAR</button>
              <button type="submit" className="py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20">REGISTRAR PAGO</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}




