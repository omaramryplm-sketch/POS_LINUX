import os

with open('omnistock-pos/client/src/pages/Clients.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Edit icon
content = content.replace('CheckCircle2, ArrowUpRight', 'CheckCircle2, ArrowUpRight, Edit')

# 2. Add states
state_target = '  const [showAddModal, setShowAddModal] = useState(false);'
state_replacement = '''  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editClient, setEditClient] = useState({ nombre: '', telefono: '', direccion: '' });'''
content = content.replace(state_target, state_replacement)

# 3. Add openEditModal
fn_target = '  const handleCreateClient = async (e: React.FormEvent) => {'
fn_replacement = '''  const openEditModal = () => {
    if (!selectedClient) return;
    setEditClient({
      nombre: selectedClient.nombre,
      telefono: selectedClient.telefono || '',
      direccion: selectedClient.direccion || ''
    });
    setShowEditModal(true);
  };

  const handleCreateClient = async (e: React.FormEvent) => {'''
content = content.replace(fn_target, fn_replacement)

# 4. Add edit button to header
header_target = '<h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight">{selectedClient.nombre}</h3>'
header_replacement = '''<div className="flex items-center gap-3">
                      <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight">{selectedClient.nombre}</h3>
                      <button onClick={openEditModal} className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>'''
content = content.replace(header_target, header_replacement)

# 5. Add Edit modal
modal_target = '{/* Modal Agregar Cliente */}'
modal_replacement = '''{/* Modal Editar Cliente */}
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
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Teléfono</label>
                <input type="text" value={editClient.telefono} onChange={e => setEditClient({...editClient, telefono: e.target.value})} className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Dirección</label>
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

      {/* Modal Agregar Cliente */}'''
content = content.replace(modal_target, modal_replacement)

with open('omnistock-pos/client/src/pages/Clients.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
