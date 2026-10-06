import { useState } from 'react';
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
    <div className="p-4 sm:p-6 lg:p-8 h-full bg-transparent overflow-y-auto custom-scrollbar">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-4xl font-black text-[var(--text-main)] tracking-tight italic flex items-center gap-3">
          <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-500" /> 
          Capacitación Express
        </h2>
        <p className="text-[var(--text-muted)] font-medium mt-1 sm:mt-2 text-xs sm:text-sm">Aprende a usar OmniStock POS en menos de 5 minutos.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Menú Lateral */}
        <div className="w-full lg:w-1/3 space-y-3 sm:space-y-4">
          {TUTORIAL_MODULES.map((mod) => (
            <button
              key={mod.id}
              onClick={() => setActiveModule(mod.id)}
              className={`w-full flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 transition-all duration-300 text-left ${
                activeModule === mod.id
                  ? `${mod.color} scale-[1.02] shadow-xl`
                  : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-emerald-500/30 text-[var(--text-muted)] hover:scale-[1.01]'
              }`}
            >
              <div className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-800 shadow-sm shrink-0 ${activeModule === mod.id ? 'opacity-100' : 'opacity-70 grayscale'}`}>
                {mod.icon}
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-sm sm:text-base lg:text-lg text-[var(--text-main)] truncate">{mod.title}</h3>
                <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 sm:mt-1 ${activeModule === mod.id ? 'opacity-80' : 'text-slate-400'}`}>
                  Ver Guía →
                </p>
              </div>
            </button>
          ))}

          {/* Ayuda Técnica */}
          <div className="mt-6 sm:mt-8 bg-slate-900 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-800">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 shrink-0" />
              <h3 className="font-black text-xs sm:text-sm uppercase tracking-widest">¿Problemas Técnicos?</h3>
            </div>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Si la pantalla se congela o el puerto está ocupado, usa el acceso directo del escritorio llamado <b>"Reiniciar Sistema"</b>. Este cerrará todos los procesos duplicados y volverá a cargar el Punto de Venta limpiamente.
            </p>
          </div>
        </div>

        {/* Panel de Contenido */}
        <div className="w-full lg:w-2/3">
          {currentModule && (
            <div className="bg-[var(--bg-card)] rounded-2xl sm:rounded-[3rem] p-6 sm:p-10 border border-[var(--border-color)] shadow-xl relative overflow-hidden animate-in slide-in-from-right-8 duration-500">
              <div className={`absolute top-0 right-0 w-64 h-64 opacity-10 rounded-full -mr-20 -mt-20 ${currentModule.color.split(' ')[0]}`}></div>
              
              <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-10 relative">
                <div className={`p-3 sm:p-4 rounded-2xl sm:rounded-3xl ${currentModule.color} shadow-lg shrink-0`}>
                  {currentModule.icon}
                </div>
                <h2 className="text-xl sm:text-3xl font-black text-[var(--text-main)] tracking-tight">{currentModule.title}</h2>
              </div>

              <div className="space-y-4 sm:space-y-6 relative">
                {currentModule.steps.map((step, idx) => (
                  <div key={idx} className="flex gap-4 sm:gap-6 group">
                    <div className="flex flex-col items-center shrink-0">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-black text-xs sm:text-sm border-2 transition-all ${
                        activeModule === currentModule.id 
                          ? `${currentModule.color} shadow-md`
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                      }`}>
                        {idx + 1}
                      </div>
                      {idx !== currentModule.steps.length - 1 && (
                        <div className="w-0.5 h-full bg-slate-100 dark:bg-slate-800 my-2 group-hover:bg-emerald-200 transition-colors"></div>
                      )}
                    </div>
                    <div className="pt-1 sm:pt-2 pb-4 sm:pb-6 min-w-0">
                      <p className="text-sm sm:text-base lg:text-lg text-[var(--text-main)] font-medium leading-relaxed">
                        {step.split(/(\[.*?\]|"[^"]*")/g).map((part, i) => {
                          if (part.startsWith('[') && part.endsWith(']')) {
                            return <span key={i} className="px-1.5 sm:px-2 py-0.5 sm:py-1 mx-0.5 sm:mx-1 bg-slate-100 dark:bg-slate-800 border-b-2 border-slate-300 dark:border-slate-700 text-[var(--text-main)] rounded text-xs sm:text-sm font-black font-mono shadow-sm">{part}</span>;
                          }
                          if (part.startsWith('"') && part.endsWith('"')) {
                            return <span key={i} className="font-bold text-emerald-600 dark:text-emerald-400">{part}</span>;
                          }
                          return part;
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-[var(--border-color)] flex items-center justify-between relative">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-[10px] sm:text-xs uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/40 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl">
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
