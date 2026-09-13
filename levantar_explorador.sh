#!/bin/bash
echo "=========================================="
echo " 📁 INSTALADOR DEL EXPLORADOR DE ARCHIVOS"
echo "=========================================="
read -p "¿Cuál es la IP del servidor? (ej. 127.0.0.1 o IP Pública): " IP_SERVER

# Detener si ya existe
docker rm -f filebrowser 2>/dev/null

echo "⚙️ Configurando el explorador web..."
# Crear archivo de base de datos vacío para que Docker no cree una carpeta por error
touch ~/.filebrowser.db

# Levantar el contenedor montando la carpeta padre (Proyectos)
docker run -d \
    --name filebrowser \
    --net proxy-tier \
    -v $(dirname "$PWD"):/srv \
    -v ~/.filebrowser.db:/database/filebrowser.db \
    -e VIRTUAL_HOST=archivos.${IP_SERVER}.nip.io \
    -e VIRTUAL_PORT=80 \
    --restart always \
    filebrowser/filebrowser

echo "=========================================="
echo "✅ ¡Explorador levantado con éxito!"
echo "🌐 Entra a: http://archivos.${IP_SERVER}.nip.io"
echo "👤 Usuario: admin"
echo "🔑 Contraseña: admin"
echo "=========================================="
