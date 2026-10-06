-- CreateTable
CREATE TABLE IF NOT EXISTS "RegistroDevolucion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_venta" INTEGER NOT NULL,
    "id_usuario" TEXT NOT NULL,
    "monto_reembolso" REAL NOT NULL,
    "motivo" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_devolucion_venta" ON "RegistroDevolucion"("id_venta");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_devolucion_fecha" ON "RegistroDevolucion"("fecha");
