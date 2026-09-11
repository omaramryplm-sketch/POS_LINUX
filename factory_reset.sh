#!/bin/bash
echo "ADVERTENCIA: Esto borrará todas las ventas, productos y datos."
echo "Restaurando el sistema de fábrica..."
# Apagamos el sistema y destruimos el volumen de datos (-v)
docker compose down -v
# Al levantar de nuevo, Docker extraerá la base de datos limpia de fábrica
docker compose up -d
echo "El sistema ha sido restaurado y reiniciado con éxito."
