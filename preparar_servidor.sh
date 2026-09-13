#!/bin/bash
echo "=========================================="
echo " 🚀 INSTALADOR AUTOMÁTICO DE SERVIDORES"
echo "=========================================="
echo "1. Instalando Docker, Fish Shell y herramientas..."
sudo apt update
sudo apt install -y docker.io docker-compose-v2 fish git curl

echo "2. Configurando permisos de Docker (Evita errores de 'Permission Denied')..."
sudo usermod -aG docker $USER

echo "3. Configurando Git para ignorar bloqueos de Antivirus/Firewalls corporativos..."
git config --global http.sslVerify false

echo "4. Estableciendo Fish como tu consola predeterminada..."
sudo chsh -s $(which fish) $USER

echo "=========================================="
echo "✅ ¡SISTEMA BASE PREPARADO CON ÉXITO!"
echo "⚠️  MUY IMPORTANTE: Cierra esta consola por completo (dale a la X) y vuelve a"
echo "abrirla para que tu nueva consola Fish y los permisos de Docker se apliquen."
echo "Después, ya puedes correr ./setup_orquestador.sh"
echo "=========================================="
