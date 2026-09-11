-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre_completo" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'CAJERO',
    "activo" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "UserSecurity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_usuario" TEXT NOT NULL,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    "lastIp" TEXT,
    "lastLogin" DATETIME,
    CONSTRAINT "UserSecurity_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AjusteInventario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_producto" INTEGER NOT NULL,
    "id_usuario" TEXT,
    "cantidad" REAL NOT NULL,
    "motivo" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AjusteInventario_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "Producto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AjusteInventario_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Producto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sku" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "precio_costo" REAL NOT NULL DEFAULT 0,
    "precio_venta" REAL NOT NULL,
    "stock_actual" REAL NOT NULL DEFAULT 0,
    "stock_minimo" REAL NOT NULL DEFAULT 0,
    "stock_maximo" REAL NOT NULL DEFAULT 100,
    "unidad" TEXT NOT NULL DEFAULT 'pza'
);

-- CreateTable
CREATE TABLE "Venta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_usuario" TEXT NOT NULL,
    "id_cliente" INTEGER,
    "id_caja" INTEGER,
    "total" REAL NOT NULL,
    "descuento" REAL NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'COMPLETA',
    "metodo_pago" TEXT NOT NULL DEFAULT 'EFECTIVO',
    "referencia_pago" TEXT,
    CONSTRAINT "Venta_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Venta_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "Cliente" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Venta_id_caja_fkey" FOREIGN KEY ("id_caja") REFERENCES "Caja" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Caja" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVA'
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "direccion" TEXT,
    "limite_credito" REAL NOT NULL DEFAULT 0,
    "saldo_deudor" REAL NOT NULL DEFAULT 0,
    "betado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_registro" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AbonoCredito" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_cliente" INTEGER NOT NULL,
    "monto" REAL NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metodo_pago" TEXT NOT NULL DEFAULT 'EFECTIVO',
    "notas" TEXT,
    CONSTRAINT "AbonoCredito_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Gasto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "descripcion" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "categoria" TEXT NOT NULL DEFAULT 'GENERAL',
    "id_usuario" TEXT,
    CONSTRAINT "Gasto_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DetalleVenta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_venta" INTEGER NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "cantidad" REAL NOT NULL,
    "precio_unitario" REAL NOT NULL,
    "subtotal" REAL NOT NULL,
    CONSTRAINT "DetalleVenta_id_venta_fkey" FOREIGN KEY ("id_venta") REFERENCES "Venta" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DetalleVenta_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "Producto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Proveedor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "contacto" TEXT,
    "telefono" TEXT,
    "email" TEXT
);

-- CreateTable
CREATE TABLE "VisitaProveedor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_proveedor" INTEGER NOT NULL,
    "fecha_visita" DATETIME NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PROGRAMADA',
    "notas" TEXT,
    CONSTRAINT "VisitaProveedor_id_proveedor_fkey" FOREIGN KEY ("id_proveedor") REFERENCES "Proveedor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Compra" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_proveedor" INTEGER,
    "total_compra" REAL NOT NULL,
    CONSTRAINT "Compra_id_proveedor_fkey" FOREIGN KEY ("id_proveedor") REFERENCES "Proveedor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DetalleCompra" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_compra" INTEGER NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "cantidad" REAL NOT NULL,
    "precio_costo" REAL NOT NULL,
    "subtotal" REAL NOT NULL,
    CONSTRAINT "DetalleCompra_id_compra_fkey" FOREIGN KEY ("id_compra") REFERENCES "Compra" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DetalleCompra_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "Producto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SugerenciaPrecio" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_producto" INTEGER NOT NULL,
    "precio_actual" REAL NOT NULL,
    "precio_sugerido" REAL NOT NULL,
    "competencia_referencia" TEXT NOT NULL,
    "url_referencia" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SugerenciaPrecio_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "Producto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Config" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "descripcion" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_username_key" ON "Usuario"("username");

-- CreateIndex
CREATE UNIQUE INDEX "UserSecurity_id_usuario_key" ON "UserSecurity"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "Producto_sku_key" ON "Producto"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Caja_nombre_key" ON "Caja"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Config_key_key" ON "Config"("key");
