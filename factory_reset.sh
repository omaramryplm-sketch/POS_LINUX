#!/bin/bash
echo "ADVERTENCIA: Esto borrar� todas las ventas, productos y datos."
echo "Restaurando el sistema de f�brica..."
# Apagamos el sistema y destruimos el volumen de datos (-v)
docker compose down -v
# Al levantar de nuevo, Docker extraer� la base de datos limpia de f�brica
docker compose up -d
echo "El sistema ha sido restaurado y reiniciado con �xito."
