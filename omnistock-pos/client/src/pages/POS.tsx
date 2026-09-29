import { useState, useEffect, useRef, useCallback } from 'react';
import clsx from 'clsx';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import { useReactToPrint } from 'react-to-print';
import { 
  Search, ShoppingCart, Trash2, CreditCard, 
  AlertCircle, ScanLine, ArrowRight,
  User, Calendar, Receipt, X, Package, CheckCircle2, Printer, DollarSign, Star, AlertTriangle,
  Plus, User as UserIcon, Tags
} from 'lucide-react';

interface Product {
  id: number;
  sku: string;
  descripcion: string;
  precio_venta: number;
  stock_actual: number;
  stock_minimo?: number;
  categoria: string;
  unidad: string;
}

interface CartItem extends Product {
  cantidad: number;
  subtotal: number;
}

interface User {
  id: string;
  username: string;
  nombre_completo: string;
  rol: string;
}

interface BusinessConfig {
  business_name?: string;
  business_rfc?: string;
  business_address?: string;
  business_phone?: string;
  business_slogan?: string;
  business_website?: string;
  business_social?: string;
}

interface Venta {
  id: number | string;
  fecha: string | Date;
  total: number;
  descuento?: number;
  metodo_pago?: string;
  referencia_pago?: string;
  usuario?: { nombre_completo: string };
  pago?: number;
  cambio?: number;
  cliente?: Client | null;
  detalles: {
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    producto: { descripcion: string };
  }[];
}

interface Client {
  id: number;
  nombre: string;
  telefono?: string;
  betado?: boolean;
  saldo_deudor?: number;
}

interface Caja {
  id: number;
  nombre: string;
  estado: string;
}

// --- Componente de Ticket para Impresión (Optimizado para 80mm) ---
const TicketComponent = ({ venta, config, user }: { venta: Venta, config: BusinessConfig | null, user: User | null }) => (
  <div className="p-4 bg-white text-black font-mono text-[11px] w-[80mm] mx-auto leading-tight">
    {/* Branding Dinámico */}
    <div className="text-center mb-4">
      <div className="bg-black text-white py-1 mb-2">
        <h2 className="text-2xl font-black uppercase tracking-tighter">
          {config?.business_name || 'OmniStock'}
        </h2>
      </div>
      <p className="text-[12px] font-bold">{config?.business_slogan || 'Retail Solutions'}</p>
      <p className="text-[9px] mt-1">{config?.business_address || 'Av. Principal #100'}</p>
      <p className="text-[9px]">Tel: {config?.business_phone || '(00) 0000-0000'}</p>
      <p className="text-[9px]">RFC: {config?.business_rfc || 'OMNI-000000-XXX'}</p>
      <div className="border-b-2 border-black my-3"></div>
    </div>
    
    {/* Info Venta */}
    <div className="mb-4 space-y-0.5">
      <div className="flex justify-between">
        <span className="font-bold">TICKET:</span> 
        <span className="font-bold">#{venta.id.toString().padStart(6, '0')}</span>
      </div>
      <div className="flex justify-between">
        <span>FECHA:</span> 
        <span>{new Date(venta.fecha).toLocaleDateString('es-MX')}</span>
      </div>
      <div className="flex justify-between">
        <span>HORA:</span> 
        <span>{new Date(venta.fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <div className="flex justify-between">
        <span>CAJERO:</span> 
        <span className="uppercase">{venta.usuario?.nombre_completo.split(' ')[0] || user?.nombre_completo.split(' ')[0] || 'ADMIN'}</span>
      </div>
      <div className="border-b border-dashed border-black my-3"></div>
    </div>

    {/* Listado de Productos */}
    <table className="w-full mb-4">
      <thead>
        <tr className="border-b-2 border-black">
          <th className="pb-1 text-left w-8">CANT</th>
          <th className="pb-1 text-left">DESCRIPCION</th>
          <th className="pb-1 text-right">IMP.</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-dashed divide-gray-400">
        {venta.detalles.map((d, i) => (
          <tr key={i} className="align-top">
            <td className="py-2 pr-1">{d.cantidad}</td>
            <td className="py-2 font-bold uppercase leading-none">
              {d.producto.descripcion}
              <div className="text-[9px] font-normal lowercase opacity-70">
                P.U: ${d.precio_unitario.toFixed(2)}
              </div>
            </td>
            <td className="py-2 text-right">${d.subtotal.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>

    {/* Totales */}
    <div className="mt-4 pt-4 border-t border-black space-y-1">
        {(venta.descuento || 0) > 0 && (
          <>
            <div className="flex justify-between text-xs">
              <span>SUBTOTAL:</span>
              <span>${(venta.total + (venta.descuento || 0)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold">
              <span>DESCUENTO:</span>
              <span>-${(venta.descuento || 0).toFixed(2)}</span>
            </div>
          </>
        )}
        <div className="flex justify-between font-black text-sm">
          <span>TOTAL:</span>
          <span>${venta.total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>MÉTODO:</span>
          <span className="uppercase">{venta.metodo_pago || 'EFECTIVO'}</span>
        </div>
        {venta.metodo_pago === 'TARJETA' && venta.referencia_pago && (
          <div className="flex justify-between text-[8px]">
            <span>REF:</span>
            <span>{venta.referencia_pago}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>RECIBIDO:</span>
          <span>${venta.pago?.toFixed(2) || venta.total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>CAMBIO:</span>
          <span>${venta.cambio?.toFixed(2) || '0.00'}</span>
        </div>
      </div>

    {/* Footer */}
    <div className="text-center mt-8 space-y-3">
      <div className="bg-black text-white py-1">
        <p className="text-[10px] font-bold">¡VUELVA PRONTO!</p>
      </div>
      <p className="text-[8px] leading-tight px-2 italic">
        "Este comprobante no tiene validez fiscal. Para facturación, favor de solicitarla en mostrador el mismo día de su compra."
      </p>
      <div className="border-t border-black pt-2">
        <p className="text-[9px] font-bold">{config?.business_website || 'WWW.OMNISTOCK.COM'}</p>
        <p className="text-[8px] opacity-60">{config?.business_social || '@OmniStockRetail'}</p>
      </div>
    </div>
  </div>
);

export default function POS() {
  const { user, terminal, setTerminal } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [error, setError] = useState('');
  const [isScanning] = useState(true);
  const [lastVenta, setLastVenta] = useState<Venta | null>(null); // Para el modal de éxito
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [liveResults, setLiveResults] = useState<Product[]>([]);
  const [showLiveDropdown, setShowLiveDropdown] = useState(false);
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [showTopProductsModal, setShowTopProductsModal] = useState(false);
  
  // Estados para productos por peso (KG)
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
  const [weightValue, setWeightValue] = useState<string>('');
  
  // Estados para Gastos
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [cajasDb, setCajasDb] = useState<Caja[]>([]);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [businessConfig, setBusinessConfig] = useState<BusinessConfig | null>(null);

  // Estados para Pago y Cambio
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentChange, setPaymentChange] = useState(0);
  const [isTerminalWaiting, setIsTerminalWaiting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'CREDITO'>('CASH');
  
  // Estados para Clientes y Descuentos
  const [discount, setDiscount] = useState<number>(0);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  
  // Estados para Registro Rápido de Cliente
  const [showQuickClientModal, setShowQuickClientModal] = useState(false);
  const [quickClientName, setQuickClientName] = useState('');
  const [quickClientPhone, setQuickClientPhone] = useState('');

  // Estado para alternar vista en móviles (< lg)
  const [mobileView, setMobileView] = useState<'cart' | 'pay'>('cart');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const ticketRef = useRef<HTMLDivElement>(null);

  const total = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const totalAfterDiscount = Math.max(0, total - discount);

  // --- Funciones Operativas (Definidas antes de su uso) ---

  const addToCart = useCallback((product: Product, quantity: number | null = null) => {
    // Si el producto es por KG y no se especificó cantidad previa, abrir modal
    if (product.unidad?.toLowerCase() === 'kg' && quantity === null) {
      setPendingProduct(product);
      setWeightValue('');
      setShowWeightModal(true);
      return;
    }

    let finalQty = quantity || 1;
    const isPiece = product.unidad?.toLowerCase().includes('pz') || product.unidad?.toLowerCase().includes('pieza');
    if (isPiece) {
      finalQty = Math.floor(finalQty);
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      const newQuantity = existing ? existing.cantidad + finalQty : finalQty;

      if (newQuantity > product.stock_actual) {
        setError(`Stock insuficiente: Solo quedan ${product.stock_actual} ${product.unidad}.`);
        return prev;
      }

      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, cantidad: newQuantity, subtotal: newQuantity * item.precio_venta }
            : item
        );
      }
      return [...prev, { ...product, cantidad: finalQty, subtotal: finalQty * product.precio_venta }];
    });
    setSearchResults([]);
    setSearchTerm('');
    setShowLiveDropdown(false);
  }, []);

  const updateQuantity = useCallback((id: number, delta: number) => {
    setCart((prev) => {
      return prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(1, item.cantidad + delta);
          if (newQty > item.stock_actual) {
            setError(`Stock insuficiente para ${item.descripcion}`);
            return item;
          }
          return { ...item, cantidad: newQty, subtotal: newQty * item.precio_venta };
        }
        return item;
      });
    });
  }, []);

  const setQuantity = (id: number, value: number) => {
    const val = isNaN(value) ? 0 : value;
    setCart((prev) => {
      return prev.map((item) => {
        if (item.id === id) {
          let finalVal = val;
          const isPiece = item.unidad?.toLowerCase().includes('pz') || item.unidad?.toLowerCase().includes('pieza');
          if (isPiece) {
            finalVal = Math.floor(val);
          }

          if (finalVal > item.stock_actual) {
            setError(`Stock insuficiente para ${item.descripcion}`);
            return { ...item, cantidad: item.stock_actual, subtotal: item.stock_actual * item.precio_venta };
          }
          return { ...item, cantidad: finalVal, subtotal: finalVal * item.precio_venta };
        }
        return item;
      });
    });
  };

  const removeFromCart = useCallback((id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      const res = await api.get('/clientes');
      setClients(res.data.data);
    } catch {
      console.error('Error fetching clients');
    }
  }, []);

  const handleCharge = useCallback(() => {
    if (cart.length === 0) return;
    if (cart.some(item => item.cantidad <= 0)) {
      setError('Asegúrate de que todos los productos tengan una cantidad válida.');
      return;
    }
    setPaymentAmount('');
    setPaymentChange(0);
    setShowPaymentModal(true);
  }, [cart]);

  const processSale = useCallback(async (isCard = false, cardTxId = '') => {
    const finalTotal = totalAfterDiscount;
    const items = cart.map(item => ({
      id_producto: item.id,
      cantidad: item.cantidad,
      precio_unitario: item.precio_venta,
      subtotal: item.subtotal
    }));

    try {
      const res = await api.post('/ventas', { 
        items, 
        total: finalTotal,
        metodo_pago: isCard ? 'TARJETA' : paymentMethod,
        referencia_pago: cardTxId,
        id_cliente: selectedClient?.id,
        id_caja: terminal?.id,
        descuento: discount
      });
      
      const ventaData: Venta = {
        ...res.data.data.venta,
        pago: isCard || paymentMethod === 'CREDITO' ? finalTotal : parseFloat(paymentAmount),
        cambio: isCard || paymentMethod === 'CREDITO' ? 0 : paymentChange,
        metodo_pago: isCard ? 'TARJETA' : paymentMethod,
        cliente: selectedClient
      };
      setLastVenta(ventaData);
      setShowSuccessModal(true);
      setShowPaymentModal(false);
      setCart([]);
      setDiscount(0);
      setSelectedClient(null);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response: { data: { message: string } } };
        setError(axiosErr.response?.data?.message || 'Error al procesar la venta.');
      } else {
        setError('Error al procesar la venta.');
      }
    }
  }, [totalAfterDiscount, cart, paymentMethod, selectedClient, terminal, discount, paymentAmount, paymentChange]);

  const handleTerminalPayment = useCallback(async () => {
    setIsTerminalWaiting(true);
    try {
      const res = await api.post('/payments/create-order', { 
        amount: totalAfterDiscount, 
        description: `Venta POS - ${cart.length} productos` 
      });

      if (res.data.data.status === 'SUCCESS') {
        await processSale(true, res.data.data.id);
      }
    } catch (err) {
      alert('Error en la terminal: ' + err);
    } finally {
      setIsTerminalWaiting(false);
    }
  }, [totalAfterDiscount, cart.length, processSale]);

  const handleSearch = useCallback(async (query: string) => {
    let quantityToAdd: number | null = null;
    let finalQuery = query;

    if (query.includes('*')) {
      const parts = query.split('*');
      quantityToAdd = parseFloat(parts[0]) || 1;
      finalQuery = parts[1] || '';
    }

    try {
      setError('');
      const res = await api.get(`/ventas/productos?q=${finalQuery || ''}`);
      const products: Product[] = res.data.data;

      if (products.length === 1) {
        addToCart(products[0], quantityToAdd);
        setSearchTerm('');
        setSearchResults([]);
      } else if (products.length > 1) {
        setSearchResults(products);
      } else {
        setError('No se encontraron productos.');
        setSearchResults([]);
      }
    } catch {
      setError('Error de conexión con el servidor.');
    }
  }, [addToCart]);


  // --- Escáner de Códigos y Atajos de Teclado (Movido aquí para evitar errores de referencia) ---
  useEffect(() => {
    let barcodeBuffer = '';
    let timeoutId: ReturnType<typeof setTimeout>;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') { e.preventDefault(); searchInputRef.current?.focus(); return; }
      if (e.key === 'F9') { e.preventDefault(); handleCharge(); return; }
      
      // Atajos para el último producto (+ y -)
      if (e.key === '+' && !searchTerm && cart.length > 0) {
        e.preventDefault();
        const lastItem = cart[cart.length - 1];
        updateQuantity(lastItem.id, 1);
        return;
      }
      if (e.key === '-' && !searchTerm && cart.length > 0) {
        e.preventDefault();
        const lastItem = cart[cart.length - 1];
        updateQuantity(lastItem.id, -1);
        return;
      }

      if (e.key === 'Escape') { 
        if (showSuccessModal) { setShowSuccessModal(false); return; }
        if (showWeightModal) { setShowWeightModal(false); return; }
        if (showTopProductsModal) { setShowTopProductsModal(false); return; }
        if (showPaymentModal) { setShowPaymentModal(false); return; }
        e.preventDefault(); 
        setCart([]); 
        setError(''); 
        setSearchResults([]);
        return; 
      }

      if (e.key !== 'Enter' && e.key.length === 1 && !showTopProductsModal && !showWeightModal && !showSuccessModal && !showExpenseModal && !showPaymentModal) {
        barcodeBuffer += e.key;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => { barcodeBuffer = ''; }, 50);
      } else if (e.key === 'Enter' && barcodeBuffer.length > 5) {
        e.preventDefault();
        handleSearch(barcodeBuffer);
        barcodeBuffer = '';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, showSuccessModal, showWeightModal, showTopProductsModal, showExpenseModal, showPaymentModal, searchTerm, handleCharge, handleSearch, updateQuantity]);

  const handlePrint = useReactToPrint({
    contentRef: ticketRef,
  });

  // --- Cargar Productos Más Vendidos y Configuración ---
  useEffect(() => {
    api.get('/ventas/top-productos')
      .then(res => setTopProducts(res.data.data))
      .catch(err => console.error('Error fetching top products:', err));
    
    api.get('/admin/config')
      .then(res => setBusinessConfig(res.data.data))
      .catch(err => console.error('Error fetching config:', err));

    // Cargar Cajas
    api.get('/admin/cajas')
      .then(res => setCajasDb(res.data.data))
      .catch(err => console.error('Error fetching cajas:', err));
  }, []);

  // --- Búsqueda en Vivo (Autocomplete) ---
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchTerm.length >= 2 && !searchTerm.includes('*')) {
        try {
          const res = await api.get(`/ventas/productos?q=${searchTerm}`);
          setLiveResults(res.data.data);
          setShowLiveDropdown(true);
        } catch {
          // Error silenciado para búsqueda en vivo
        }
      } else {
        setLiveResults([]);
        setShowLiveDropdown(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchTerm]);


  // --- Limpiar errores automáticamente ---
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);


  const handleQuickClientCreate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/clientes', {
        nombre: quickClientName,
        telefono: quickClientPhone
      });
      setSelectedClient(res.data.data);
      setShowQuickClientModal(false);
      setShowClientModal(false);
      setQuickClientName('');
      setQuickClientPhone('');
      fetchClients();
    } catch {
      alert('Error al crear cliente rápido');
    }
  }, [quickClientName, quickClientPhone, fetchClients]);

  return (
    <div className="h-full w-full bg-transparent flex flex-col lg:flex-row overflow-hidden relative">
      
      {/* --- Ticket Oculto para Impresión --- */}
      <div style={{ display: 'none' }}>
        <div ref={ticketRef}>
          {lastVenta && <TicketComponent venta={lastVenta} config={businessConfig} user={user} />}
        </div>
      </div>

      {/* --- Modal de Peso (KG) --- */}
      {showWeightModal && pendingProduct && (
        <div className="absolute inset-0 z-[110] bg-slate-900/60  flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden flex flex-col p-10">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 mx-auto">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 text-center mb-1 uppercase">{pendingProduct.descripcion}</h3>
            <p className="text-slate-400 font-bold text-center mb-8 uppercase text-xs tracking-widest">Ingresa el peso en Kilogramos</p>
            
            <div className="relative mb-8">
              <input 
                autoFocus
                type="text"
                value={weightValue || '0.000'}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && parseFloat(weightValue) > 0) {
                    addToCart(pendingProduct, parseFloat(weightValue));
                    setShowWeightModal(false);
                  }
                  if (e.key === 'Escape') setShowWeightModal(false);
                  
                  // Lógica de Báscula Profesional
                  if (/^\d$/.test(e.key)) {
                    e.preventDefault();
                    const currentDigits = (weightValue || '0.000').replace(/[^0-9]/g, '');
                    const newDigits = (currentDigits + e.key).replace(/^0+/, '');
                    const val = (parseInt(newDigits) / 1000).toFixed(3);
                    setWeightValue(val);
                  }

                  if (e.key === 'Backspace') {
                    e.preventDefault();
                    const currentDigits = (weightValue || '0.000').replace(/[^0-9]/g, '');
                    const newDigits = currentDigits.slice(0, -1).replace(/^0+/, '');
                    const val = (parseInt(newDigits || '0') / 1000).toFixed(3);
                    setWeightValue(val);
                  }
                }}
                onChange={() => {}} // Manejado por onKeyDown
                className="w-full bg-slate-50 border-0 rounded-3xl p-6 text-6xl font-black text-center text-slate-900 focus:ring-4 focus:ring-emerald-500/20 outline-none font-mono"
                placeholder="0.000"
              />
              <span className="absolute right-8 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">KG</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setShowWeightModal(false)}
                className="py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-all"
              >
                CANCELAR
              </button>
              <button 
                onClick={() => {
                  if (weightValue) {
                    addToCart(pendingProduct, parseFloat(weightValue));
                    setShowWeightModal(false);
                  }
                }}
                className="py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black transition-all shadow-xl shadow-emerald-500/20"
              >
                ACEPTAR (ENTER)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal de Pago (Cambio) --- */}
      {showPaymentModal && (
        <div className="absolute inset-0 z-[115] bg-slate-900/60  flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden flex flex-col p-10">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 mx-auto">
              <DollarSign className="w-8 h-8" />
            </div>
            <div className="text-center mb-6">
              {discount > 0 && (
                <div className="flex justify-center items-center gap-4 mb-2 text-sm">
                  <div className="text-slate-400">
                    <span className="font-bold uppercase text-[10px] tracking-widest block">Subtotal</span>
                    <span className="font-bold line-through">${total.toFixed(2)}</span>
                  </div>
                  <div className="text-red-500 bg-red-50 px-3 py-1 rounded-lg">
                    <span className="font-bold uppercase text-[10px] tracking-widest block">Descuento</span>
                    <span className="font-black">-${discount.toFixed(2)}</span>
                  </div>
                </div>
              )}
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-1">Total a Pagar</p>
              <p className="text-5xl font-black text-emerald-600">${totalAfterDiscount.toFixed(2)}</p>
            </div>

            {/* Selector de Método de Pago */}
            <div className="flex gap-2 mb-6 bg-slate-50 p-1.5 rounded-2xl">
              <button 
                onClick={() => setPaymentMethod('CASH')}
                className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${paymentMethod === 'CASH' ? 'bg-white shadow-md text-emerald-600' : 'text-slate-400'}`}
              >
                Efectivo
              </button>
              <button 
                onClick={() => setPaymentMethod('CARD')}
                className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${paymentMethod === 'CARD' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`}
              >
                Tarjeta
              </button>
              <button 
                disabled={!selectedClient}
                onClick={() => setPaymentMethod('CREDITO')}
                className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-30 ${paymentMethod === 'CREDITO' ? 'bg-white shadow-md text-amber-600' : 'text-slate-400'}`}
              >
                Crédito {!selectedClient && '🔒'}
              </button>
            </div>
            
            <div className="space-y-6 mb-10">
              {paymentMethod === 'CASH' ? (
                <>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-2 block tracking-widest">¿Con cuánto pagan?</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">$</span>
                      <input 
                        autoFocus
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPaymentAmount(val);
                          const change = parseFloat(val) - totalAfterDiscount;
                          setPaymentChange(change > 0 ? change : 0);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && parseFloat(paymentAmount) >= totalAfterDiscount) {
                            processSale();
                          }
                          if (e.key === 'Escape') setShowPaymentModal(false);
                        }}
                        className="w-full bg-slate-50 border-0 rounded-3xl pl-12 pr-6 py-6 text-4xl font-black text-slate-900 focus:ring-4 focus:ring-emerald-500/20 outline-none"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-amber-600 uppercase tracking-widest">Cambio a devolver</span>
                      <span className={`text-3xl font-black ${paymentChange > 0 ? 'text-amber-700' : 'text-slate-300'}`}>
                        ${paymentChange.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </>
              ) : paymentMethod === 'CARD' ? (
                <div className="bg-slate-50 rounded-[2.5rem] p-10 border-2 border-dashed border-slate-200 text-center relative overflow-hidden">
                   {isTerminalWaiting ? (
                     <div className="animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 border-4 border-indigo-500 border-b-transparent rounded-full animate-spin mx-auto mb-6"></div>
                        <p className="text-lg font-black text-slate-800 italic uppercase tracking-tight">Esperando terminal...</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Pase la tarjeta por la terminal física</p>
                     </div>
                   ) : (
                     <div className="animate-in fade-in duration-300">
                        <CreditCard className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Pago con Tarjeta</p>
                        <button 
                          onClick={handleTerminalPayment}
                          className="mt-6 px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
                        >
                          CONECTAR CON TERMINAL
                        </button>
                     </div>
                   )}
                </div>
              ) : (
                <div className="bg-amber-50 rounded-[2.5rem] p-10 border-2 border-dashed border-amber-200 text-center">
                   <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-amber-500 mx-auto mb-4 shadow-sm">
                      <UserIcon className="w-8 h-8" />
                   </div>
                   <p className="text-amber-700 font-black uppercase text-xs tracking-widest mb-1">Venta a Crédito</p>
                   <p className="text-sm font-bold text-amber-600 mb-6 italic">Se sumará al saldo deudor de {selectedClient?.nombre}</p>
                   <div className="bg-white p-4 rounded-2xl border border-amber-100 flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Monto a Fiar</span>
                      <span className="text-xl font-black text-slate-800">${totalAfterDiscount.toFixed(2)}</span>
                   </div>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-100 p-5 rounded-[2rem] mb-6 flex items-center gap-4 animate-in shake duration-500">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <p className="text-red-600 font-black text-xs uppercase tracking-tight leading-tight">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <button 
                disabled={isTerminalWaiting}
                onClick={() => setShowPaymentModal(false)}
                className="py-5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-all disabled:opacity-50"
              >
                CANCELAR (ESC)
              </button>
              {(paymentMethod === 'CASH' || paymentMethod === 'CREDITO') && (
                <button 
                  disabled={paymentMethod === 'CASH' && (!paymentAmount || parseFloat(paymentAmount) < totalAfterDiscount)}
                  onClick={() => processSale()}
                  className={`py-5 text-white rounded-2xl font-black transition-all shadow-xl ${paymentMethod === 'CREDITO' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'}`}
                >
                  {paymentMethod === 'CREDITO' ? 'FIAR VENTA' : 'FINALIZAR (ENTER)'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- Modal de Éxito y Ticket --- */}
      {showSuccessModal && lastVenta && (
        <div className="absolute inset-0 z-[100] bg-slate-900/60  flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-[var(--bg-card)] w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden flex flex-col items-center p-8">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-6 scale-110">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h3 className="text-3xl font-black text-slate-800 mb-2">¡Venta Exitosa!</h3>
            <p className="text-slate-500 font-medium mb-8 text-center">La transacción se completó correctamente. ¿Deseas imprimir el ticket?</p>
            
            <div className="w-full bg-slate-50 rounded-3xl p-6 border border-slate-100 mb-8 max-h-64 overflow-y-auto">
              <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Resumen de Ticket</span>
                <span className="font-mono text-xs">#{lastVenta.id}</span>
              </div>
              <div className="space-y-2">
                {lastVenta.detalles.map((d, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-slate-600 truncate mr-4">{d.cantidad}x {d.producto.descripcion}</span>
                    <span className="font-black text-slate-800">${d.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
                {(lastVenta.descuento || 0) > 0 && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Subtotal</span>
                      <span className="text-sm font-black text-slate-600">${(lastVenta.total + (lastVenta.descuento || 0)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Descuento</span>
                      <span className="text-sm font-black text-red-500">-${(lastVenta.descuento || 0).toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Método de Pago</span>
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${lastVenta.metodo_pago === 'TARJETA' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {lastVenta.metodo_pago || 'EFECTIVO'}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2 border-t border-slate-100 pt-2">
                  <span className="text-lg font-black text-slate-800">TOTAL</span>
                  <span className="text-2xl font-black text-emerald-600">${lastVenta.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              <button 
                onClick={() => setShowSuccessModal(false)}
                className="py-5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-all"
              >
                CERRAR (ESC)
              </button>
              <button 
                onClick={handlePrint}
                className="py-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20"
              >
                <Printer className="w-5 h-5" /> IMPRIMIR TICKET
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Resultados de Búsqueda --- */}
      {searchResults.length > 0 && (
        <div className="absolute inset-0 z-50 bg-slate-900/40  flex items-center justify-center p-8 animate-in fade-in duration-200">
          <div className="bg-[var(--bg-card)] w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-2xl font-black text-slate-800">Resultados Encontrados</h3>
                <p className="text-slate-500 font-medium">Selecciona el producto para agregar al carrito</p>
              </div>
              <button onClick={() => setSearchResults([])} className="p-3 bg-white hover:bg-red-50 hover:text-red-500 rounded-2xl shadow-sm transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchResults.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="flex items-center gap-4 p-6 bg-white border border-slate-100 rounded-[2rem] hover:border-emerald-500 hover:bg-emerald-50/30 transition-all text-left group"
                >
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-inner">
                    <ShoppingCart className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-slate-800 text-lg group-hover:text-emerald-600 transition-colors">{p.descripcion}</p>
                    <div className="flex justify-between items-end mt-1">
                      <p className="text-sm text-slate-400 font-bold tracking-tight">SKU: {p.sku}</p>
                      <p className="text-2xl font-black text-slate-900">${p.precio_venta.toFixed(2)}</p>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="inline-flex px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase">
                        Stock: {p.stock_actual} pza
                      </div>
                      {p.stock_actual <= (p.stock_minimo || 0) && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 rounded-lg text-[9px] font-black animate-pulse">
                          <AlertTriangle className="w-3 h-3" /> STOCK BAJO
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- Modal de Productos Más Vendidos --- */}
      {showTopProductsModal && (
        <div className="absolute inset-0 z-[120] bg-slate-900/60  flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col p-8">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-500">
                  <Star className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-800 tracking-tight">Lo Más Vendido</h3>
                  <p className="text-slate-400 font-bold text-sm mt-1">Tus 5 productos estrella, a un solo clic de distancia.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowTopProductsModal(false)}
                className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {topProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    addToCart(p);
                    setShowTopProductsModal(false);
                  }}
                  className="p-6 bg-white border border-slate-200 rounded-3xl hover:border-amber-500 hover:bg-amber-50 hover:shadow-xl hover:shadow-amber-500/10 transition-all text-left flex items-center gap-6 group"
                >
                  <div className="min-w-[4rem] w-16 h-16 bg-slate-100 rounded-2xl group-hover:bg-amber-500 group-hover:text-white flex items-center justify-center transition-all text-slate-400 shadow-inner">
                    <ShoppingCart className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-slate-800 text-lg group-hover:text-amber-700 transition-colors line-clamp-2">{p.descripcion}</h4>
                    <p className="font-bold text-amber-600 text-xl mt-1">${p.precio_venta.toFixed(2)}</p>
                  </div>
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => setShowTopProductsModal(false)}
              className="w-full py-5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black transition-all text-sm tracking-widest uppercase"
            >
              Cerrar Diálogo
            </button>
          </div>
        </div>
      )}

      {/* 1. Left Sidebar (Visible solo en pantallas muy amplias 2xl, sus funciones están en la barra rápida para laptops) */}
      <div className="w-64 2xl:w-72 bg-[var(--bg-card)] border-r border-[var(--border-color)] flex-col p-4 2xl:p-6 hidden 2xl:flex h-full overflow-y-auto shrink-0">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4 p-3.5 bg-slate-900 dark:bg-slate-800 rounded-2xl text-white shadow-xl">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
              <ScanLine className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] uppercase font-bold text-slate-400">Estado Caja</p>
              <p className="text-xs font-bold truncate">Activa / Listos</p>
            </div>
          </div>

          <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">Información Sesión</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 p-2.5 bg-[var(--bg-main)] rounded-xl text-[var(--text-main)]">
              <User className="w-4 h-4 shrink-0 text-slate-400" />
              <span className="text-xs font-black capitalize truncate">{user?.nombre_completo || 'Usuario'}</span>
            </div>
            <div className="flex items-center gap-2.5 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 rounded-xl text-emerald-700 dark:text-emerald-400">
              <ScanLine className="w-4 h-4 shrink-0" />
              <span className="text-xs font-black uppercase truncate flex-1">{terminal?.nombre || 'Sin Caja'}</span>
              <button 
                onClick={() => setTerminal(null)}
                className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900 rounded text-emerald-500"
                title="Cambiar Caja"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center gap-2.5 p-2.5 bg-[var(--bg-main)] rounded-xl text-[var(--text-main)]">
              <Calendar className="w-4 h-4 shrink-0 text-slate-400" />
              <span className="text-xs font-medium">{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-4">
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Acceso Rápido</h3>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setShowTopProductsModal(true)}
                className="col-span-2 p-3 bg-amber-500 text-white rounded-xl text-xs font-black hover:bg-amber-600 transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-95"
              >
                <Star className="w-3.5 h-3.5" /> TOP 5 MÁS VENDIDO
              </button>
              <button 
                onClick={() => handleSearch('')}
                className="col-span-2 p-3 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95"
              >
                <Package className="w-3.5 h-3.5" /> VER TODO EL CATÁLOGO
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Categorías</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {['Bebidas', 'Lácteos', 'Botanas', 'Enlatados', 'Higiene', 'Limpieza'].map((cat) => (
                <button 
                  key={cat} 
                  onClick={() => handleSearch(cat)}
                  className="p-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold text-[var(--text-main)] hover:bg-emerald-500 hover:border-emerald-500 hover:text-white transition-all text-center shadow-sm active:scale-95 truncate"
                >
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Control de Caja</h3>
            <button 
              onClick={() => setShowExpenseModal(true)}
              className="w-full p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 active:scale-95"
            >
              <DollarSign className="w-3.5 h-3.5" /> REGISTRAR GASTO
            </button>
          </div>
        </div>

        <div className="mt-auto p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 rounded-xl text-emerald-700 dark:text-emerald-400">
          <p className="text-[9px] font-black uppercase mb-0.5">Tip Operativo</p>
          <p className="text-[11px] leading-tight">Usa <b>F9</b> para cobrar y <b>F1</b> para buscar.</p>
        </div>
      </div>

      {/* --- Modal de Gasto --- */}
      {showExpenseModal && (
        <div className="absolute inset-0 z-[120] bg-slate-900/60  flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-[var(--bg-card)] w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col p-6 sm:p-8">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-950/50 rounded-2xl flex items-center justify-center text-red-600 mb-4 mx-auto">
              <DollarSign className="w-7 h-7" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-[var(--text-main)] text-center mb-1 uppercase">Registrar Gasto</h3>
            <p className="text-[var(--text-muted)] font-bold text-center mb-6 uppercase text-[10px] tracking-widest">Salida de efectivo de la caja</p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1.5 block">Descripción</label>
                <input 
                  type="text"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  placeholder="Ej: Pago de garrafón de agua"
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-3.5 font-bold text-sm text-[var(--text-main)] focus:ring-4 focus:ring-red-500/10 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1.5 block">Monto ($)</label>
                <input 
                  type="number"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-3.5 font-black text-[var(--text-main)] focus:ring-4 focus:ring-red-500/10 outline-none text-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setShowExpenseModal(false)}
                className="py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs transition-all"
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
                    alert('Gasto registrado con éxito');
                  } catch {
                    alert('Error al registrar gasto');
                  }
                }}
                className="py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-black text-xs transition-all shadow-lg shadow-red-500/20 active:scale-95"
              >
                REGISTRAR SALIDA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Center (Buscador y Carrito de Compras) */}
      <div className={clsx(
        "flex-1 flex flex-col min-w-0 bg-[var(--bg-main)] relative h-full overflow-hidden",
        mobileView === 'pay' ? 'hidden lg:flex' : 'flex'
      )}>
        <div className="p-3 sm:p-4 lg:p-5 pb-2 lg:pb-3 shrink-0">
          <div className="flex justify-between items-center mb-2.5 sm:mb-3">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-[var(--text-main)] tracking-tight italic uppercase">Venta</h2>
              {terminal && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {terminal.nombre}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block px-2.5 py-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-[10px] font-bold text-[var(--text-muted)] shadow-sm uppercase tracking-widest">F1 BUSCAR</span>
              <span className="hidden sm:inline-block px-2.5 py-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-[10px] font-bold text-[var(--text-muted)] shadow-sm uppercase tracking-widest">F9 COBRAR</span>
            </div>
          </div>

          {/* Barra de Búsqueda Inteligente */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 sm:pl-5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchTerm)}
              onFocus={() => searchTerm.length >= 2 && setShowLiveDropdown(true)}
              className="block w-full pl-11 sm:pl-12 pr-28 sm:pr-36 py-2.5 sm:py-3.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl text-sm sm:text-base text-[var(--text-main)] placeholder-slate-400 focus:ring-4 focus:ring-emerald-500/10 shadow-sm focus:border-emerald-500 transition-all outline-none"
              placeholder="Escribe el nombre o SKU..."
            />

            {/* --- Dropdown de Búsqueda en Vivo --- */}
            {showLiveDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-[var(--bg-card)] rounded-2xl shadow-2xl border border-[var(--border-color)] z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-80 overflow-y-auto">
                {liveResults.length > 0 ? (
                  liveResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        addToCart(p);
                        setSearchTerm('');
                        setShowLiveDropdown(false);
                      }}
                      className="w-full flex items-center justify-between p-3 sm:p-3.5 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 border-b border-[var(--border-color)] last:border-0 transition-colors text-left group/item"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 group-hover/item:bg-emerald-500 group-hover/item:text-white transition-colors shrink-0">
                          <Package className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-[var(--text-main)] uppercase text-xs sm:text-sm truncate">{p.descripcion}</p>
                          <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-tight truncate">SKU: {p.sku} | {p.categoria}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 pl-3">
                        <p className="text-sm sm:text-base font-black text-emerald-600">${p.precio_venta.toFixed(2)}</p>
                        <p className={`text-[9px] font-bold ${p.stock_actual < 10 ? 'text-red-500' : 'text-[var(--text-muted)]'}`}>
                          STOCK: {p.stock_actual}
                        </p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-6 text-center bg-[var(--bg-card)]">
                    <div className="w-12 h-12 bg-[var(--bg-main)] rounded-full flex items-center justify-center mx-auto mb-2">
                      <Search className="w-6 h-6 text-[var(--text-muted)]" />
                    </div>
                    <p className="text-[var(--text-main)] font-black text-sm uppercase tracking-tight">Sin resultados</p>
                    <p className="text-[10px] text-[var(--text-muted)] font-bold mt-0.5 uppercase tracking-widest">Intenta con otro nombre o SKU</p>
                  </div>
                )}
              </div>
            )}

            {isScanning && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-100 dark:border-emerald-900 pointer-events-none">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="hidden sm:inline text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Escaneo</span>
              </div>
            )}
          </div>

          {/* Barra Rápida de Categorías y Accesos (Ideal para Laptops 1366x768 y Móviles) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mt-2.5 custom-scrollbar text-xs">
            <button 
              onClick={() => setShowTopProductsModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-lg font-bold shadow-sm shrink-0 transition-all text-[11px]"
            >
              <Star className="w-3 h-3" /> Top 5
            </button>
            <button 
              onClick={() => handleSearch('')}
              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg font-bold shadow-sm shrink-0 transition-all text-[11px]"
            >
              <Package className="w-3 h-3" /> Catálogo
            </button>
            <button 
              onClick={() => setShowExpenseModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 bg-[var(--bg-card)] hover:bg-red-500 hover:text-white active:scale-95 text-[var(--text-muted)] rounded-lg font-bold border border-[var(--border-color)] shrink-0 transition-all text-[11px]"
            >
              <DollarSign className="w-3 h-3" /> Gasto
            </button>
            <div className="h-3.5 w-px bg-slate-300 dark:bg-slate-700 shrink-0 mx-0.5"></div>
            {['Bebidas', 'Lácteos', 'Botanas', 'Enlatados', 'Higiene', 'Limpieza'].map((cat) => (
              <button
                key={cat}
                onClick={() => handleSearch(cat)}
                className="px-2 py-1 bg-[var(--bg-card)] hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/40 hover:border-emerald-300 active:scale-95 border border-[var(--border-color)] rounded-lg font-bold text-[var(--text-muted)] shrink-0 transition-all text-[10px]"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mx-3 sm:mx-4 lg:mx-5 mb-2 p-3 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900 rounded-xl flex items-center justify-between text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-top-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p className="text-xs font-bold truncate">{error}</p>
            </div>
            <button onClick={() => setError('')} className="p-1 hover:bg-red-100 rounded-lg transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Contenedor del Carrito */}
        <div className="flex-1 px-3 sm:px-4 lg:px-5 pb-3 overflow-hidden flex flex-col min-h-0">
          <div className="flex-1 bg-[var(--bg-card)] rounded-2xl sm:rounded-3xl border border-[var(--border-color)] shadow-sm overflow-hidden flex flex-col">
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 p-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[var(--bg-main)] rounded-full flex items-center justify-center mb-4 shadow-inner">
                  <ShoppingCart className="w-8 h-8 sm:w-10 sm:h-10 opacity-30 text-slate-400" />
                </div>
                <p className="text-base sm:text-lg font-bold text-[var(--text-main)]">Carrito Vacío</p>
                <p className="text-xs text-[var(--text-muted)] text-center mt-0.5">Escanea un código o busca productos para empezar</p>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="hidden sm:grid grid-cols-12 py-2.5 px-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                  <div className="col-span-3 lg:col-span-2">Cant</div>
                  <div className="col-span-5 lg:col-span-6">Producto</div>
                  <div className="col-span-2 text-right">P. Unit</div>
                  <div className="col-span-2 text-right">Subtotal</div>
                </div>
                <div className="flex-1 overflow-y-auto px-2 sm:px-3 py-1 custom-scrollbar divide-y divide-[var(--border-color)]">
                  {cart.map((item) => (
                    <div key={item.id} className="py-2.5 px-2 sm:px-3 flex flex-col sm:grid sm:grid-cols-12 items-center rounded-xl hover:bg-[var(--bg-main)] transition-all group gap-2 sm:gap-0">
                      {/* Cantidad y Controles */}
                      <div className="w-full sm:col-span-3 lg:col-span-2 flex items-center justify-between sm:justify-start gap-1.5">
                        <span className="sm:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">Cant:</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step={item.unidad?.toLowerCase() === 'kg' ? "0.001" : "1"}
                            min="0"
                            value={item.cantidad === 0 ? '' : item.cantidad}
                            onChange={(e) => setQuantity(item.id, parseFloat(e.target.value))}
                            onKeyDown={(e) => {
                              const isPiece = item.unidad?.toLowerCase().includes('pz') || item.unidad?.toLowerCase().includes('pieza');
                              if (isPiece && (e.key === '.' || e.key === ',')) {
                                e.preventDefault();
                              }
                            }}
                            className="w-16 h-9 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg font-black text-center text-xs focus:ring-2 focus:ring-emerald-500/20 outline-none border border-emerald-100 dark:border-emerald-900 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <div className="flex flex-col gap-0.5">
                            <button onClick={() => updateQuantity(item.id, item.unidad?.toLowerCase().includes('kg') ? 0.1 : 1)} className="p-1 bg-[var(--bg-main)] hover:bg-emerald-500 hover:text-white rounded-md transition-all border border-[var(--border-color)]">
                              <ArrowRight className="w-2.5 h-2.5 -rotate-90" />
                            </button>
                            <button onClick={() => updateQuantity(item.id, item.unidad?.toLowerCase().includes('kg') ? -0.1 : -1)} className="p-1 bg-[var(--bg-main)] hover:bg-red-500 hover:text-white rounded-md transition-all border border-[var(--border-color)]">
                              <ArrowRight className="w-2.5 h-2.5 rotate-90" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Descripción */}
                      <div className="w-full sm:col-span-5 lg:col-span-6 sm:pl-3 text-left min-w-0">
                        <p className="font-bold text-[var(--text-main)] group-hover:text-emerald-600 transition-colors uppercase truncate text-xs sm:text-sm">{item.descripcion}</p>
                        <p className="text-[10px] text-[var(--text-muted)] font-bold tracking-tight truncate">
                          SKU: {item.sku} | {item.cantidad.toFixed(item.unidad?.toLowerCase().includes('kg') ? 3 : 0)} {item.unidad?.toUpperCase()}
                        </p>
                      </div>

                      {/* Precio Unitario */}
                      <div className="hidden sm:block sm:col-span-2 text-right font-bold text-[var(--text-muted)] text-xs sm:text-sm">
                        ${item.precio_venta.toFixed(2)}
                      </div>

                      {/* Subtotal y Eliminar */}
                      <div className="w-full sm:col-span-2 flex items-center justify-between sm:justify-end gap-3">
                        <div className="text-right">
                          <span className="sm:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Total:</span>
                          <span className="font-black text-[var(--text-main)] text-sm sm:text-base">${item.subtotal.toFixed(2)}</span>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.id)} 
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-all group/trash"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-4 h-4 group-hover/trash:scale-110 transition-transform" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Barra Móvil Inferior Fija (Visible solo en pantallas < lg en modo Carrito) */}
        <div className="lg:hidden p-3 bg-[var(--bg-card)] border-t border-[var(--border-color)] flex items-center justify-between gap-3 shadow-2xl z-20 shrink-0">
          <div className="min-w-0">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">
              {cart.reduce((a, b) => a + b.cantidad, 0)} {cart.reduce((a, b) => a + b.cantidad, 0) === 1 ? 'artículo' : 'artículos'}
            </span>
            <span className="text-xl font-black text-emerald-600 truncate block leading-none">
              ${totalAfterDiscount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <button
            onClick={() => setMobileView('pay')}
            disabled={cart.length === 0}
            className="flex-1 max-w-[200px] py-3 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <span>Cobrar</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Right Sidebar (Resumen de Pago Optimizado para Laptops y Móviles) */}
      <div className={clsx(
        "w-full lg:w-80 xl:w-96 2xl:w-[400px] bg-[var(--bg-card)] border-t lg:border-t-0 lg:border-l border-[var(--border-color)] p-4 sm:p-5 xl:p-6 flex flex-col shadow-2xl z-20 overflow-y-auto shrink-0",
        mobileView === 'pay' ? 'flex flex-1 h-full' : 'hidden lg:flex lg:h-full'
      )}>
        {/* Botón Volver al Carrito (Visible en Móviles) */}
        <div className="lg:hidden flex items-center justify-between mb-3 pb-3 border-b border-[var(--border-color)] shrink-0">
          <button
            onClick={() => setMobileView('cart')}
            className="flex items-center gap-2 text-xs font-black text-slate-500 hover:text-emerald-600 active:scale-95 transition-all"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span>VOLVER AL CARRITO</span>
          </button>
          <span className="text-xs font-black text-emerald-600 uppercase bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-lg">
            {cart.reduce((a, b) => a + b.cantidad, 0)} items
          </span>
        </div>

        {/* Encabezado Desktop */}
        <div className="hidden lg:flex items-center gap-3 mb-3 xl:mb-5 pb-3 xl:pb-4 border-b border-[var(--border-color)] shrink-0">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
            <Receipt className="text-white w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base xl:text-lg font-black text-[var(--text-main)] leading-tight">Resumen Pago</h3>
            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Ticket de Venta</p>
          </div>
        </div>

        {/* Cliente Seleccionado */}
        <div className="mb-3 shrink-0">
          <button 
            onClick={() => { fetchClients(); setShowClientModal(true); }}
            className={`w-full p-2.5 sm:p-3 rounded-xl border-2 border-dashed flex items-center gap-3 transition-all ${selectedClient ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-emerald-300'}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${selectedClient ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cliente</p>
              <p className={`text-xs sm:text-sm font-black uppercase truncate ${selectedClient ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                {selectedClient ? selectedClient.nombre : 'Venta General'}
              </p>
            </div>
            {selectedClient && (
              <div 
                onClick={(e) => { e.stopPropagation(); setSelectedClient(null); }}
                className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-600"
              >
                <X className="w-3.5 h-3.5" />
              </div>
            )}
          </button>
        </div>

        {/* Sección de Descuentos */}
        <div className="mb-3 shrink-0">
          <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-2.5 sm:p-3 border border-emerald-100 dark:border-emerald-900 flex items-center justify-between group hover:border-emerald-500 transition-all">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0">
                <Tags className="w-3.5 h-3.5" />
              </div>
              <span className="text-emerald-700 dark:text-emerald-400 font-black text-[9px] uppercase tracking-widest">Descuento ($)</span>
            </div>
            <input 
              type="number"
              min="0"
              max={total}
              value={Math.min(discount, total) || ''}
              onChange={(e) => {
                const val = Math.abs(parseFloat(e.target.value) || 0);
                setDiscount(val > total ? total : val);
              }}
              className="w-20 text-right bg-transparent border-0 font-black text-emerald-600 dark:text-emerald-400 text-sm sm:text-base outline-none focus:ring-0 placeholder:text-emerald-200"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Desglose Artículos y Subtotal */}
        <div className="space-y-1.5 mb-3 text-xs shrink-0">
          <div className="flex justify-between items-center p-2 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)]">
            <span className="text-[var(--text-muted)] font-bold">Artículos</span>
            <span className="text-[var(--text-main)] font-black">{cart.reduce((a, b) => a + b.cantidad, 0)} items</span>
          </div>
          <div className="flex justify-between items-center px-2 py-0.5">
            <span className="text-slate-400 font-bold text-xs">Subtotal Bruto</span>
            <span className="text-slate-500 font-bold text-xs">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Burbuja Principal de Total a Pagar (Ajustada para nunca desbordar en 1366x768 ni móviles) */}
        <div className="mt-auto bg-slate-900 dark:bg-slate-950 rounded-2xl xl:rounded-3xl p-4 sm:p-5 text-white relative overflow-hidden shadow-xl shadow-slate-950/20 shrink-0">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full -mr-12 -mt-12 blur-xl"></div>
          
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total a Pagar</p>
          <div className="flex items-baseline gap-1 overflow-hidden">
            <span className="text-lg sm:text-xl font-bold text-emerald-400">$</span>
            <span className="text-3xl sm:text-4xl xl:text-5xl font-black tracking-tight leading-none truncate block">
              {totalAfterDiscount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <button
              onClick={() => { setCart([]); setError(''); }}
              className="py-2.5 sm:py-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white rounded-xl font-bold text-xs transition-all border border-slate-700"
            >
              LIMPIAR (ESC)
            </button>
            <button
              onClick={handleCharge}
              disabled={cart.length === 0}
              className="py-2.5 sm:py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-95 disabled:opacity-50 disabled:grayscale text-white rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              PAGAR (F9) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-2.5 sm:mt-3 flex items-center gap-2.5 p-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl shrink-0">
          <div className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
            <CreditCard className="text-slate-400 w-3.5 h-3.5" />
          </div>
          <p className="text-[10px] text-slate-400 font-medium leading-tight">Efectivo, tarjetas y transferencia.</p>
        </div>
      </div>
      {/* --- Modal de Búsqueda de Clientes --- */}
      {showClientModal && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60  flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col p-10">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Seleccionar Cliente</h3>
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Gestionar créditos y lealtad</p>
              </div>
              <button 
                onClick={() => setShowClientModal(false)}
                className="p-3 bg-slate-100 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="relative mb-6">
               <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
               <input 
                 autoFocus
                 type="text"
                 placeholder="Buscar por nombre o teléfono..."
                 value={clientSearchTerm}
                 onChange={(e) => setClientSearchTerm(e.target.value)}
                 className="w-full bg-slate-50 border-0 rounded-2xl pl-14 pr-6 py-4 font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 outline-none"
               />
            </div>

            <div className="flex-1 overflow-y-auto max-h-[400px] space-y-2 pr-2 custom-scrollbar">
               {clients
                 .filter(c => c.nombre.toLowerCase().includes(clientSearchTerm.toLowerCase()) || (c.telefono || '').includes(clientSearchTerm))
                 .map(c => (
                 <button 
                   key={c.id}
                   onClick={() => { setSelectedClient(c); setShowClientModal(false); }}
                   className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-emerald-50 rounded-2xl transition-all border border-transparent hover:border-emerald-100 text-left group"
                 >
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <div>
                         <div className="flex items-center gap-2">
                           <p className="font-black text-slate-800 uppercase text-sm">{c.nombre}</p>
                           {c.betado && <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[8px] font-black rounded animate-pulse">VETADO</span>}
                         </div>
                        <p className="text-[10px] text-slate-400 font-bold tracking-widest">{c.telefono || 'Sin teléfono'}</p>
                      </div>
                   </div>
                    <div className="text-right">
                       {user?.rol === 'ADMIN' ? (
                         <>
                           <p className={`text-sm font-black ${(c.saldo_deudor || 0) > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                             ${(c.saldo_deudor || 0).toFixed(2)}
                           </p>
                           <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Saldo Deudor</p>
                         </>
                       ) : (
                         <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase ${c.betado ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                           {c.betado ? 'VETADO' : 'ACTIVO'}
                         </div>
                       )}
                    </div>
                 </button>
               ))}
               {clients.length === 0 && (
                 <div className="text-center py-10 opacity-40">
                   <UserIcon className="w-12 h-12 mx-auto mb-2" />
                   <p className="font-bold text-sm uppercase">No hay clientes registrados</p>
                 </div>
               )}
            </div>

             {user?.rol === 'ADMIN' && (
               <button 
                 onClick={() => setShowQuickClientModal(true)}
                 className="mt-8 w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl"
               >
                 <Plus className="w-4 h-4" /> REGISTRAR NUEVO CLIENTE
               </button>
             )}
          </div>
        </div>
      )}

      {/* --- Modal de Registro Rápido de Cliente --- */}
      {showQuickClientModal && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60  flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
          <form onSubmit={handleQuickClientCreate} className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Registro Rápido</h3>
              <button 
                type="button"
                onClick={() => setShowQuickClientModal(false)}
                className="p-3 bg-slate-100 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6 mb-10">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-2 block tracking-widest">Nombre del Cliente</label>
                <input 
                  autoFocus
                  required
                  type="text"
                  value={quickClientName}
                  onChange={(e) => setQuickClientName(e.target.value)}
                  className="w-full bg-slate-50 border-0 rounded-2xl p-5 font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                  placeholder="Ej: Juan Pérez"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-2 block tracking-widest">Teléfono (Opcional)</label>
                <input 
                  type="text"
                  value={quickClientPhone}
                  onChange={(e) => setQuickClientPhone(e.target.value)}
                  className="w-full bg-slate-50 border-0 rounded-2xl p-5 font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                  placeholder="33 1234 5678"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <button 
                type="button"
                onClick={() => setShowQuickClientModal(false)}
                className="py-5 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
               >
                 CANCELAR
               </button>
               <button 
                type="submit"
                className="py-5 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20"
               >
                 GUARDAR Y SELECCIONAR
               </button>
            </div>
          </form>
        </div>
      )}
      {/* --- Modal de Selección de Caja --- */}
      {!terminal && (
        <div className="fixed inset-0 z-[200] bg-slate-900/95 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden p-10 flex flex-col text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-[2rem] flex items-center justify-center text-emerald-600 mb-8 mx-auto shadow-inner">
              <ScanLine className="w-10 h-10" />
            </div>
            
            <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2 uppercase">Bienvenido</h2>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mb-10">Selecciona la caja que vas a operar</p>
            
            <div className="space-y-4">
              {cajasDb.filter(c => c.estado === 'ACTIVA').length > 0 ? (
                cajasDb.filter(c => c.estado === 'ACTIVA').map((caja) => (
                  <button
                    key={caja.id}
                    onClick={() => setTerminal(caja)}
                    className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl text-left flex items-center gap-4 hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                  >
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-emerald-500 shadow-sm transition-colors font-black">
                      {caja.id}
                    </div>
                    <span className="font-black text-slate-700 text-lg group-hover:text-emerald-900">{caja.nombre}</span>
                    <ArrowRight className="ml-auto w-6 h-6 text-slate-200 group-hover:text-emerald-500 transition-all group-hover:translate-x-1" />
                  </button>
                ))
              ) : (
                <div className="p-8 bg-amber-50 rounded-3xl border border-amber-100 text-amber-600 font-bold text-sm">
                  ⚠️ No hay cajas activas dadas de alta. 
                  <br/> Contacta al administrador.
                </div>
              )}
            </div>
            
            <p className="mt-10 text-slate-400 text-xs font-bold uppercase tracking-widest italic">
              OmniStock POS v2.0 - Sesión Segura
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
