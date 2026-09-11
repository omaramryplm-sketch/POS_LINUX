#!/bin/bash

echo "======================================"
echo "  🛒 CREADOR DE PUNTO DE VENTA (NIP.IO)"
echo "======================================"
read -p "¿Cuál es el nombre corto del cliente? (ej. farmacia): " CLIENT_NAME
read -p "¿Cuál es la IP del servidor? (ej. 192.168.10.241): " SERVER_IP

if [ -z "$CLIENT_NAME" ] || [ -z "$SERVER_IP" ]; then
    echo "❌ Debes ingresar nombre e IP."
    exit 1
fi

NEW_DIR="../POS_$CLIENT_NAME"

echo ""
echo "⚙️  Clonando sistema maestro a $NEW_DIR..."
cp -r . $NEW_DIR

# Limpiar .git y scripts innecesarios en la copia
rm -rf $NEW_DIR/.git
rm $NEW_DIR/setup_orquestador.sh 2>/dev/null
rm $NEW_DIR/crear_cliente.sh 2>/dev/null

echo "⚙️  Configurando variables para $CLIENT_NAME..."
# Crear archivo .env para docker-compose
echo "VIRTUAL_HOST=$CLIENT_NAME.$SERVER_IP.nip.io" > $NEW_DIR/.env
echo "COMPOSE_PROJECT_NAME=pos_$CLIENT_NAME" >> $NEW_DIR/.env

echo "🚀 Levantando contenedor aislado para $CLIENT_NAME..."
cd $NEW_DIR
docker compose up -d

echo ""
echo "✅ ¡Cliente creado exitosamente!"
echo "🌐 Puede acceder a su sistema en: http://$CLIENT_NAME.$SERVER_IP.nip.io"
