#!/bin/bash
FECHA=$(date +"%Y-%m-%d_%H-%M")
BACKUP_DIR="../BACKUPS_POS/$FECHA"

echo "=========================================="
echo " 💾 SISTEMA DE RESPALDO DE BASES DE DATOS"
echo "=========================================="
mkdir -p "$BACKUP_DIR"
echo "Creando carpeta de respaldo en: $BACKUP_DIR"

for client_dir in ../POS_*; do
    if [ "$client_dir" != "../POS_LINUX" ] && [ -f "$client_dir/.env" ]; then
        CLIENT_NAME=$(basename "$client_dir")
        
        # Extraer el nombre del proyecto de Docker desde el archivo .env del cliente
        PROJECT_NAME=$(grep COMPOSE_PROJECT_NAME "$client_dir/.env" | cut -d '=' -f2)
        VOLUME_NAME="${PROJECT_NAME}_db_data"
        
        echo "⏳ Respaldando base de datos de: $CLIENT_NAME ()..."
        
        # Usar un contenedor temporal de Alpine para comprimir el volumen y extraerlo al host
        docker run --rm \
            -v $VOLUME_NAME:/datos_origen \
            -v "$(realpath $BACKUP_DIR):/respaldo_destino" \
            alpine \
            tar czf /respaldo_destino/$CLIENT_NAME.tar.gz -C /datos_origen .
            
        echo "✅ Respaldo de $CLIENT_NAME guardado."
    fi
done

echo "=========================================="
echo "🎉 ¡Todos los respaldos finalizaron con éxito!"
echo "Tus archivos .tar.gz (comprimidos) están en $BACKUP_DIR"
echo "=========================================="
