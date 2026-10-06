#!/bin/bash
echo "=========================================="
echo " 🔄 RESTAURADOR DE BASE DE DATOS (BACKUPS)"
echo "=========================================="
read -p "¿A qué cliente le vamos a restaurar el respaldo? (ej. abarrotesfenix): " CLIENT_NAME
read -p "Escribe la ruta (o arrastra el archivo) del respaldo .tar.gz: " BACKUP_FILE

# Limpiar comillas por si el usuario arrastra el archivo
BACKUP_FILE=$(echo "$BACKUP_FILE" | tr -d "'\"")

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: No se encontró el archivo en la ruta: $BACKUP_FILE"
    exit 1
fi

# Guardar la ruta absoluta del archivo antes de movernos de carpeta
BACKUP_ABS_PATH=$(realpath "$BACKUP_FILE")
VOLUME_NAME="pos_${CLIENT_NAME}_db_data"
CLIENT_DIR="../POS_${CLIENT_NAME}"

if [ ! -d "$CLIENT_DIR" ]; then
    echo "❌ Error: No existe el cliente $CLIENT_NAME (¿Ya lo creaste con crear_cliente.sh?)"
    exit 1
fi

echo "⏳ 1. Apagando el sistema de $CLIENT_NAME temporalmente..."
cd "$CLIENT_DIR"
docker compose stop

echo "💾 2. Inyectando el respaldo en el disco duro virtual..."
# Usamos un mini-linux (alpine) para borrar la bd actual y descomprimir la del respaldo
docker run --rm \
    -v $VOLUME_NAME:/datos_destino \
    -v "$BACKUP_ABS_PATH":/backup.tar.gz \
    alpine \
    sh -c "rm -rf /datos_destino/* && tar xzf /backup.tar.gz -C /datos_destino"

echo "🚀 3. Encendiendo el sistema con los datos recuperados..."
docker compose start

echo "=========================================="
echo "✅ ¡RESPALDO RESTAURADO CON ÉXITO!"
echo "Los datos de $CLIENT_NAME han regresado en el tiempo."
echo "=========================================="
