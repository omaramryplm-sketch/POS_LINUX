-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Producto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sku" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "precio_costo" REAL NOT NULL DEFAULT 0,
    "precio_venta" REAL NOT NULL,
    "stock_actual" REAL NOT NULL DEFAULT 0,
    "stock_minimo" REAL NOT NULL DEFAULT 0,
    "stock_maximo" REAL NOT NULL DEFAULT 100,
    "unidad" TEXT NOT NULL DEFAULT 'pza',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "descontinuado" BOOLEAN NOT NULL DEFAULT false,
    "motivo_baja" TEXT
);
INSERT INTO "new_Producto" ("categoria", "descripcion", "id", "precio_costo", "precio_venta", "sku", "stock_actual", "stock_maximo", "stock_minimo", "unidad") SELECT "categoria", "descripcion", "id", "precio_costo", "precio_venta", "sku", "stock_actual", "stock_maximo", "stock_minimo", "unidad" FROM "Producto";
DROP TABLE "Producto";
ALTER TABLE "new_Producto" RENAME TO "Producto";
CREATE UNIQUE INDEX "Producto_sku_key" ON "Producto"("sku");
CREATE INDEX "idx_producto_categoria" ON "Producto"("categoria");
CREATE INDEX "idx_producto_descontinuado" ON "Producto"("descontinuado");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "idx_abono_cliente_fecha" ON "AbonoCredito"("id_cliente", "fecha");

-- CreateIndex
CREATE INDEX "idx_ajuste_producto" ON "AjusteInventario"("id_producto");

-- CreateIndex
CREATE INDEX "idx_detalle_compra" ON "DetalleCompra"("id_compra");

-- CreateIndex
CREATE INDEX "idx_compra_producto" ON "DetalleCompra"("id_producto");

-- CreateIndex
CREATE INDEX "idx_detalle_venta" ON "DetalleVenta"("id_venta");

-- CreateIndex
CREATE INDEX "idx_detalle_producto" ON "DetalleVenta"("id_producto");

-- CreateIndex
CREATE INDEX "idx_gasto_fecha" ON "Gasto"("fecha");

-- CreateIndex
CREATE INDEX "idx_venta_usuario_fecha" ON "Venta"("id_usuario", "fecha");

-- CreateIndex
CREATE INDEX "idx_venta_cliente_fecha" ON "Venta"("id_cliente", "fecha");
