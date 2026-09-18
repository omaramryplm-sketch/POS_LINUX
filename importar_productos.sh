#!/bin/bash
echo "=== Importador de Productos OmniStock ==="
echo "Verificando si existe el archivo productos.csv en la carpeta Importador_CSV..."

if [ ! -f "Importador_CSV/productos.csv" ]; then
    echo "ERROR: No se encontr� Importador_CSV/productos.csv"
    echo "Por favor, guarda tu Excel como CSV delimitado por comas en esa ruta."
    exit 1
fi

echo "Copiando archivo al contenedor de base de datos..."
docker cp Importador_CSV/productos.csv pos_linux-backend-1:/app/productos.csv

echo "Ejecutando proceso de importaci�n masiva..."
docker compose exec backend npx tsx prisma/importar.ts

echo "Borrando archivo temporal..."
docker compose exec backend rm /app/productos.csv

echo "�Proceso terminado exitosamente!"
