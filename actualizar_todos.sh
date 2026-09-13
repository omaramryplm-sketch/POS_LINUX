#!/bin/bash
echo "=========================================="
echo " 🔄 ACTUALIZADOR MASIVO DE CLIENTES"
echo "=========================================="

# 1. Actualizar el código maestro
echo "1️⃣ Descargando última versión de GitHub..."
git pull

# 2. Iterar sobre todas las carpetas de clientes
for client_dir in ../POS_*; do
    # Evitar actualizar la carpeta de respaldos o el propio POS_LINUX en el bucle
    if [ "$client_dir" != "../POS_LINUX" ] && [ -f "$client_dir/docker-compose.yml" ]; then
        echo "------------------------------------------"
        echo "🚀 Actualizando cliente: $client_dir"
        
        # Copiar las carpetas de código nuevo (sobrescribe lo viejo, pero respeta el .env del cliente)
        cp -r omnistock-pos "$client_dir/"
        cp docker-compose.yml "$client_dir/"
        
        # Entrar al cliente, recompilar con el código nuevo y levantar
        cd "$client_dir"
        docker compose up -d --build
        
        # Regresar al maestro para el siguiente ciclo
        cd - > /dev/null
        
        echo "✅ Listo."
    fi
done

echo "=========================================="
echo "🎉 ¡Todos los clientes han sido actualizados!"
echo "=========================================="
