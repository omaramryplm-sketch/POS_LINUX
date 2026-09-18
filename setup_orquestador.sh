#!/bin/bash
echo "=========================================="
echo " 🌐 CONFIGURACIÓN DEL ORQUESTADOR (PROXY) "
echo "=========================================="

if ! command -v docker &> /dev/null; then
    echo "❌ ERROR FATAL: Docker no está instalado o no tienes permisos."
    echo "💡 Solución: Ejecuta ./preparar_servidor.sh o revisa la Integración WSL."
    exit 1
fi

echo "Para evitar conflictos con Windows (IIS/Skype), puedes usar un puerto alternativo."
read -p "¿Qué puerto usarás? (Ej. 80 para VPS Internet, 8080 para Windows Local): " PROXY_PORT

if [ -z "$PROXY_PORT" ]; then
    PROXY_PORT=80
fi

docker network create proxy-tier 2>/dev/null || true

echo "Deteniendo proxy anterior (si existe)..."
docker rm -f nginx-proxy 2>/dev/null

echo "🚀 Levantando contenedor proxy en el puerto $PROXY_PORT..."
if docker run -d -p $PROXY_PORT:80 \
    --name nginx-proxy \
    --net proxy-tier \
    -v /var/run/docker.sock:/tmp/docker.sock:ro \
    --restart always \
    jwilder/nginx-proxy; then

    echo "✅ Orquestador corriendo exitosamente en el puerto $PROXY_PORT."
    echo "PUERTO_ORQUESTADOR=$PROXY_PORT" > orquestador_config.txt
    echo "📄 Configuración guardada en 'orquestador_config.txt'"
else
    echo "❌ ERROR: No se pudo levantar el Orquestador en el puerto $PROXY_PORT."
    echo "💡 Es posible que el puerto siga ocupado. Vuelve a ejecutar el script y elige el puerto 8080 o 8081."
    exit 1
fi
