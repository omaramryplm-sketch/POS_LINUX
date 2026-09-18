#!/bin/bash

echo "======================================"
echo "  🛒 CREADOR DE PUNTO DE VENTA (NIP.IO)"
echo "======================================"

if ! command -v docker &> /dev/null; then
    echo "❌ ERROR FATAL: Docker no está instalado o no tienes permisos."
    echo "💡 Solución: Ejecuta ./preparar_servidor.sh primero."
    exit 1
fi

read -p "¿Cuál es el nombre corto del cliente? (ej. farmacia): " CLIENT_NAME
read -p "¿Cuál es la IP del servidor? (ej. 192.168.10.241 o 127.0.0.1): " SERVER_IP

if [ -z "$CLIENT_NAME" ] || [ -z "$SERVER_IP" ]; then
    echo "❌ Debes ingresar nombre e IP."
    exit 1
fi

NEW_DIR="../POS_$CLIENT_NAME"

echo ""
echo "⚙️  Clonando sistema maestro a $NEW_DIR..."
cp -r . $NEW_DIR

# Limpiar .git y scripts innecesarios en la copia
rm -rf $NEW_DIR/.git 2>/dev/null
rm $NEW_DIR/*.sh 2>/dev/null

# Copiar solo el script de factory reset por si lo necesita el cliente
cp factory_reset.sh $NEW_DIR/ 2>/dev/null

echo "⚙️  Configurando variables para $CLIENT_NAME..."
echo "VIRTUAL_HOST=$CLIENT_NAME.$SERVER_IP.nip.io" > $NEW_DIR/.env
echo "COMPOSE_PROJECT_NAME=pos_$CLIENT_NAME" >> $NEW_DIR/.env

echo "🚀 Compilando y levantando contenedor aislado para $CLIENT_NAME..."
cd $NEW_DIR

if docker compose up -d --build; then
    # Leer puerto del orquestador si existe
    PUERTO=80
    if [ -f ../POS_LINUX/orquestador_config.txt ]; then
        source ../POS_LINUX/orquestador_config.txt
        PUERTO=$PUERTO_ORQUESTADOR
    fi

    echo "======================================"
    echo "✅ ¡Cliente creado exitosamente!"
    if [ "$PUERTO" == "80" ]; then
        echo "🌐 Puede acceder a su sistema en: http://$CLIENT_NAME.$SERVER_IP.nip.io"
    else
        echo "🌐 Puede acceder a su sistema en: http://$CLIENT_NAME.$SERVER_IP.nip.io:$PUERTO"
    fi
    echo "======================================"
else
    echo "======================================"
    echo "❌ ERROR FATAL AL CONSTRUIR EL CLIENTE"
    echo "======================================"
    echo "💡 POSIBLE CAUSA: Tu Antivirus (Kaspersky/Avast) bloqueó la descarga de Docker."
    echo "👉 SOLUCIÓN: Pausa tu antivirus web, o agrega Docker a las exclusiones, y vuelve a intentarlo."
    # Regresar a la carpeta principal
    cd ../POS_LINUX
    exit 1
fi
