#!/bin/bash
echo "🚀 Configurando el Orquestador Automático (Nginx Proxy)..."

# 1. Crear red compartida si no existe
docker network create proxy-tier 2>/dev/null || true

# 2. Levantar contenedor proxy
docker run -d -p 80:80 \
    --name nginx-proxy \
    --net proxy-tier \
    -v /var/run/docker.sock:/tmp/docker.sock:ro \
    --restart always \
    jwilder/nginx-proxy

echo "✅ Orquestador corriendo en el puerto 80."
