import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Importador Masivo de OmniStock ---');
  
  // Archivo CSV a leer (separado por comas)
  const csvFilePath = path.join(process.cwd(), 'productos.csv');
  
  if (!fs.existsSync(csvFilePath)) {
    console.error('ERROR: No se encontró el archivo productos.csv en la carpeta.');
    console.log('Asegúrate de guardar tu Excel como "CSV (delimitado por comas)" con el nombre productos.csv');
    process.exit(1);
  }

  const csvData = fs.readFileSync(csvFilePath, 'utf-8');
  const lines = csvData.split('\n').filter(l => l.trim().length > 0);
  
  if (lines.length <= 1) {
    console.log('El archivo está vacío o solo tiene los encabezados.');
    process.exit(0);
  }

  console.log(`Encontrados ${lines.length - 1} productos para importar...`);
  let importados = 0;
  let errores = 0;

  for (let i = 1; i < lines.length; i++) {
    try {
      const row = lines[i].split(',');
      // Formato esperado: SKU, DESCRIPCION, PRECIO_VENTA, PRECIO_COMPRA, STOCK, CATEGORIA, UNIDAD
      const sku = row[0]?.trim();
      const descripcion = row[1]?.trim();
      const precio_venta = parseFloat(row[2]) || 0;
      const precio_compra = parseFloat(row[3]) || 0;
      const stock_actual = parseFloat(row[4]) || 0;
      const categoria = row[5]?.trim() || 'General';
      const unidad = row[6]?.trim() || 'PZA';

      if (!sku || !descripcion) continue;

      await prisma.producto.upsert({
        where: { sku: sku },
        update: {
          descripcion,
          precio_venta,
          precio_compra,
          stock_actual,
          categoria,
          unidad
        },
        create: {
          sku,
          descripcion,
          precio_venta,
          precio_compra,
          stock_actual,
          stock_minimo: 5,
          categoria,
          unidad
        }
      });
      importados++;
    } catch (err) {
      errores++;
    }
  }

  console.log('\n--- RESUMEN ---');
  console.log(`✅ Importados/Actualizados con éxito: ${importados}`);
  if (errores > 0) {
    console.log(`❌ Errores en filas: ${errores}`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
