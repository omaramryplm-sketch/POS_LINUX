# Documentación del Frontend - OmniStock POS

## 1. Visión General
El frontend de **OmniStock POS** está construido como una Single Page Application (SPA) utilizando tecnologías modernas para garantizar un rendimiento óptimo y una experiencia de usuario fluida. Su objetivo principal es proveer la interfaz gráfica para la gestión de punto de venta (POS), inventario, administración y clientes.

## 2. Pila Tecnológica (Tech Stack)
- **Framework/Librería Principal**: React 19
- **Lenguaje**: TypeScript (proporciona tipado estático, mejorando la robustez del código).
- **Herramienta de Construcción (Bundler)**: Vite (ofrece un servidor de desarrollo extremadamente rápido y un proceso de construcción optimizado).
- **Estilos**: Tailwind CSS (framework de utilidades CSS para un diseño ágil y responsivo).
- **Manejo del Estado Global**: Zustand (librería minimalista para gestionar el estado, como la sesión de usuario y las preferencias de tema).
- **Enrutamiento**: React Router v7 (gestión de rutas en la SPA).
- **Iconografía**: Lucide React.
- **Gráficas**: Recharts (para los reportes del Dashboard).
- **Cliente HTTP**: Axios (para la comunicación con la API backend).

## 3. Estructura de Directorios (`client/src/`)
La organización del código fuente sigue un patrón basado en dominios o funcionalidades:

- `api/`: Configuración de Axios (`axios.ts`), interceptores de peticiones (inyección del token JWT) y respuestas (manejo de errores de autenticación 401).
- `assets/`: Recursos estáticos como imágenes y fuentes.
- `components/`: Componentes reutilizables de la interfaz de usuario.
  - `Layout.tsx`: Estructura base de la aplicación (barra lateral, menú de navegación, contenedor principal responsivo) protegida según el rol del usuario.
- `pages/`: Vistas completas asociadas a las rutas.
  - `POS.tsx`: Pantalla principal del Punto de Venta (carrito, búsqueda de productos, cobro).
  - `AdminDashboard.tsx`: Panel de control con métricas, gráficos de ventas (Recharts), reportes y cortes de caja.
  - `Inventory.tsx`: Gestión integral del inventario (productos, stock, categorías).
  - `Clients.tsx`: Gestión del directorio de clientes.
  - `BulkPriceManager.tsx`: Herramienta para ajustar precios por volumen o categoría.
  - `Settings.tsx`: Configuración del sistema y preferencias locales.
  - `Tutorial.tsx`: Sección de capacitación y guías.
  - `Login.tsx`: Interfaz de inicio de sesión.
  - `PriceInbox.tsx`: Bandeja de entrada para sugerencias/cambios de precio.
- `store/`: Manejadores de estado global (Zustand).
  - `authStore.ts`: Almacena la sesión del usuario (token, detalles del usuario, terminal asignada). Utiliza persistencia para mantener la sesión tras recargar la página.
  - `themeStore.ts`: Controla el tema visual (modo claro/oscuro, color de acento).
- `App.tsx`: Archivo raíz que define el proveedor de rutas (`Router`) y protege los accesos (`ProtectedRoute`) según el rol (`ADMIN` o `CAJERO`).
- `main.tsx`: Punto de entrada de React que renderiza `App.tsx` en el DOM.

## 4. Gestión de Estado y Autenticación
La aplicación protege las rutas críticas basándose en el rol del usuario autenticado.
El componente `ProtectedRoute` en `App.tsx` valida la existencia de un usuario en el `authStore` y verifica si el rol del usuario actual está incluido en el arreglo `allowedRoles`.
Las peticiones al backend adjuntan automáticamente el Bearer Token a través de un interceptor de Axios.

## 5. Diseño y UX
Se ha priorizado un diseño intuitivo, moderno y "Mobile First". La barra de navegación lateral es colapsable y se convierte en un menú tipo hamburguesa en dispositivos móviles. Los componentes visuales aprovechan la sintaxis de utilidades de Tailwind CSS (junto a `clsx` y `tailwind-merge` para combinar clases condicionales dinámicas).

## 6. Funciones Clave Implementadas
- **Búsqueda Dinámica**: Filtros y barras de búsqueda en tiempo real para productos y clientes.
- **Carro de Compras**: Gestión ágil de artículos con cálculo de subtotales, impuestos (si aplican) y total.
- **Dashboard Administrativo**: Visibilidad de KPI clave (ventas diarias, stock crítico, gráficos de ingresos mensuales).
- **Impresión de Tickets**: Utiliza `react-to-print` para generar recibos de caja imprimibles directamente desde el navegador.

---
*Documentación generada como parte del proceso de revisión y mejora continua de la plataforma.*
