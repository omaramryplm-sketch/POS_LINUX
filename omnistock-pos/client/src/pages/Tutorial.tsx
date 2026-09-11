import React, { useState } from 'react';
import { 
  BookOpen, ShoppingCart, TerminalSquare, AlertTriangle, 
  CreditCard, DollarSign, PackageCheck, PlayCircle
} from 'lucide-react';

const TUTORIAL_MODULES = [
  {
    id: 'ventas',
    title: '¿Cómo realizar una venta?',
    icon: <ShoppingCart className="w-8 h-8 text-emerald-500" />,
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    steps: [
      'Usa el lector de código de barras. El sistema detectará automáticamente el producto sin necesidad de usar el mouse.',
      'Para buscar por nombre, presiona la tecla [F1] o haz clic en la barra de búsqueda y escribe el producto.',
      'Si necesitas vender varios productos iguales, escribe la cantidad seguida de un asterisco y luego el código (Ej: 5*123456).',
      'Presiona [F9] o el botón "Cobrar" para abrir la ventana de pago.',
      'Ingresa con cuánto te pagan y presiona [ENTER] para finalizar la venta y abrir el cajón de dinero.'
    ]
  },
  {
    id: 'teclado',
    title: 'Atajos de Teclado (Rapidez)',
    icon: <TerminalSquare className="w-8 h-8 text-indigo-500" />,
    color: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    steps: [
      '[ F1 ] : Abrir buscador de productos manualmente.',
      '[ F9 ] : Ir directamente a cobrar la venta actual.',
      '[ + ] : Aumentar 1 pieza al último producto escaneado.',
      '[ - ] : Quitar 1 pieza al último producto escaneado.',
      '[ ESC ] : Cancelar la venta actual o cerrar ventanas abiertas.',
      '[ ENTER ] : Confirmar cobro.'
    ]
  },
  {
    id: 'credito',
    title: 'Ventas a Crédito (Fiado)',
    icon: <CreditCard className="w-8 h-8 text-amber-500" />,
    color: 'bg-amber-50 border-amber-200 text-amber-700',
    steps: [
      'Antes de cobrar, haz clic en "Asignar Cliente" en la parte superior del carrito.',
      'Busca al cliente por su nombre o registra uno nuevo rápidamente.',
      'Al momento de pagar (F9), selecciona la opción "Crédito".',
      'El sistema verificará si el cliente tiene límite de crédito suficiente y sumará la deuda a su cuenta automáticamente.'
    ]
  },
  {
    id: 'caja',
    title: 'Corte de Caja (Fin de turno)',
    icon: <DollarSign className="w-8 h-8 text-blue-500" />,
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    steps: [
      'Ve al "Panel de Control" (Admin) o tu sección de usuario.',
      'Haz clic en el botón "Corte de Caja".',
      'El sistema te mostrará cuánto efectivo deberías tener (Ventas en efectivo menos los Gastos registrados).',
      'Cuenta tu dinero en el cajón y escribe el monto en "Efectivo Físico Declarado".',
      'Imprime el ticket del corte, fírmalo y entrégalo al supervisor.'
    ]
  },
  {
    id: 'inventario',
    title: 'Control de Inventario',
    icon: <PackageCheck className="w-8 h-8 text-purple-500" />,
    color: 'bg-purple-50 border-purple-200 text-purple-700',
    steps: [
      'Las devoluciones o cancelaciones de tickets completos regresan el stock automáticamente a los estantes.',
      'Si se rompe o caduca un producto, ve a la pestaña "Inventario".',
      'Usa el botón de "Ajuste" (Resta) y pon el motivo (ej. "Merma por caducidad").',
      'El Dashboard del administrador te alertará en rojo cuando un producto tenga poco stock (Stock Crítico) para que lo pidas al proveedor.'
    ]
  }
];

export default function Tutorial() {
  const [activeModule, setActiveModule] = useState<string>('ventas');

  const currentModule = TUTORIAL_MODULES.find(m => m.id === activeModule);

  return (
    <div className="p-8 h-full bg-transparent overflow-y-auto custom-scrollbar">
      <div className="mb-8">
        <h2 className="text-4xl font-black text-slate-800 tracking-tight italic flex items-center gap-3">
          <BookOpen className="w-10 h-10 text-emerald-500" /> 
          Capacitación Express
        </h2>
        <p className="text-slate-500 font-medium mt-2">Aprende a usar OmniStock POS en menos de 5 minutos.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Menú Lateral */}
        <div className="w-full lg:w-1/3 space-y-4">
          {TUTORIAL_MODULES.map((mod) => (
            <button
              key={mod.id}
              onClick={() => setActiveModule(mod.id)}
              className={`w-full flex items-center gap-4 p-5 rounded-3xl border-2 transition-all duration-300 text-left ${
                activeModule === mod.id
                  ? `${mod.color} scale-105 shadow-xl`
                  : 'bg-white border-slate-100 hover:border-slate-300 text-slate-600 hover:scale-[1.02]'
              }`}
            >
              <div className={`p-3 rounded-2xl bg-white shadow-sm ${activeModule === mod.id ? 'opacity-100' : 'opacity-70 grayscale'}`}>
                {mod.icon}
              </div>
              <div>
                <h3 className="font-black text-lg">{mod.title}</h3>
                <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${activeModule === mod.id ? 'opacity-80' : 'text-slate-400'}`}>
                  Ver Guía →
                </p>
              </div>
            </button>
          ))}

          {/* Ayuda Técnica */}
          <div className="mt-8 bg-slate-900 text-white rounded-3xl p-6 border border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              <h3 className="font-black text-sm uppercase tracking-widest">¿Problemas Técnicos?</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4 font-medium leading-relaxed">
              Si la pantalla se congela o el puerto está ocupado, usa el acceso directo del escritorio llamado <b>"Reiniciar Sistema"</b>. Este cerrará todos los procesos duplicados y volverá a cargar el Punto de Venta limpiamente.
            </p>
          </div>
        </div>

        {/* Panel de Contenido */}
        <div className="w-full lg:w-2/3">
          {currentModule && (
            <div className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden animate-in slide-in-from-right-8 duration-500">
              <div className={`absolute top-0 right-0 w-64 h-64 opacity-10 rounded-full -mr-20 -mt-20 ${currentModule.color.split(' ')[0]}`}></div>
              
              <div className="flex items-center gap-4 mb-10 relative">
                <div className={`p-4 rounded-3xl ${currentModule.color} shadow-lg`}>
                  {currentModule.icon}
                </div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">{currentModule.title}</h2>
              </div>

              <div className="space-y-6 relative">
                {currentModule.steps.map((step, idx) => (
                  <div key={idx} className="flex gap-6 group">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-2 transition-all ${
                        activeModule === currentModule.id 
                          ? `${currentModule.color} shadow-md`
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}>
                        {idx + 1}
                      </div>
                      {idx !== currentModule.steps.length - 1 && (
                        <div className="w-0.5 h-full bg-slate-100 my-2 group-hover:bg-emerald-200 transition-colors"></div>
                      )}
                    </div>
                    <div className="pt-2 pb-6">
                      <p className="text-lg text-slate-700 font-medium leading-relaxed">
                        {step.split(/(\[.*?\]|"[^"]*")/g).map((part, i) => {
                          if (part.startsWith('[') && part.endsWith(']')) {
                            return <span key={i} className="px-2 py-1 mx-1 bg-slate-100 border-b-2 border-slate-300 text-slate-800 rounded text-sm font-black font-mono shadow-sm">{part}</span>;
                          }
                          if (part.startsWith('"') && part.endsWith('"')) {
                            return <span key={i} className="font-bold text-slate-900">{part}</span>;
                          }
                          return part;
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between relative">
                <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-xl">
                  <PlayCircle className="w-4 h-4" /> Estás listo para operar
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
