# 🚀 Guía de Despliegue Rápido (Nuevos Servidores)

Este documento te guiará para levantar tu Punto de Venta desde cero absoluto en un **nuevo VPS** (DigitalOcean, Hostinger) o en una máquina **Local (WSL de Windows)** en menos de 5 minutos, sin dolores de cabeza.

---

## 🛠️ Paso 1: Preparar la máquina al instante

No pierdas tiempo instalando cosas manualmente. Si estás en un servidor nuevo o en WSL, simplemente descarga y ejecuta el preparador automático:

```bash
# 1. Clona el repositorio (Si tienes errores de SSL, copia y pega el comando de abajo primero)
# git config --global http.sslVerify false
git clone https://github.com/omaramryplm-sketch/POS_LINUX.git

# 2. Entra a la carpeta y dale permisos
cd POS_LINUX
chmod +x *.sh

# 3. Ejecuta la preparación mágica
./preparar_servidor.sh
```

**⚠️ REGLA DE ORO:** Cuando termine el script `preparar_servidor.sh`, **CIERRA TU TERMINAL POR COMPLETO Y VUELVE A ENTRAR**. Si no lo haces, Linux no aplicará tus permisos de Docker ni encenderá tu consola inteligente `Fish`.

---

## 🛑 Paso 2: Liberar el Puerto 80 (Solo si estás en Windows/WSL)

Si estás trabajando localmente en Windows, Windows casi siempre secuestra el puerto 80 (IIS o Skype). Esto impide que el Cadenero (Proxy) encienda.

Para liberar el puerto:
1. Abre **PowerShell como Administrador** en Windows.
2. Ejecuta:
   ```powershell
   Stop-Service -Name W3SVC -Force
   ```
*(Si estás en un VPS Linux de internet, salta este paso, el puerto siempre está libre).*

---

## 🌐 Paso 3: Levantar el Cadenero y Clientes

Ahora que tu máquina tiene Docker, Fish y permisos:

```bash
# 1. Enciende el enrutador automático
./setup_orquestador.sh

# 2. Crea a tu primer cliente
./crear_cliente.sh
```

¡Listo! Eso es todo. 
- **En VPS:** El cliente responderá en `http://nombre.TU_IP_PUBLICA.nip.io`
- **En Windows:** El cliente responderá en `http://nombre.127.0.0.1.nip.io`

---

## 🛠️ Herramientas de Mantenimiento

* **Para actualizar a todos tus clientes con código nuevo:** `./actualizar_todos.sh`
* **Para sacar copia de seguridad de las bases de datos:** `./respaldo_diario.sh`
* **Para borrar todo un cliente de fábrica:** `cd ../POS_cliente && ./factory_reset.sh`
