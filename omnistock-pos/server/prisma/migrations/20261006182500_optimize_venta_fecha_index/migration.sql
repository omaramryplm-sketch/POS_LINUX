-- DropIndex
DROP INDEX IF EXISTS "idx_venta_usuario_fecha";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_venta_fecha" ON "Venta"("fecha");
