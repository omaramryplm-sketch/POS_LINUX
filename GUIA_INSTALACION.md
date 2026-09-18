# 🚀 Guía Definitiva de Despliegue (VPS y Local)

Este documento te guiará para levantar tu Punto de Venta desde cero absoluto en un **nuevo VPS** (DigitalOcean, Hostinger) o en una máquina **Local (WSL de Windows)** sin dolores de cabeza.

---

## 🛑 PASO 0: Preparativos (SOLO SI ESTÁS EN WINDOWS / WSL)

Si estás instalando en un servidor VPS de internet, **sáltate este paso**. Si estás en tu laptop local con Windows, haz esto primero:

1. **Conectar Docker con Ubuntu:** Abre Docker Desktop en Windows > Engrane de Configuración > `Resources` > `WSL Integration`. Marca la casilla principal y asegúrate de encender el interruptor (switch) de `Ubuntu`. Dale a "Apply & restart".
2. **Pausar Antivirus:** Los antivirus (Kaspersky, Avast) bloquean las descargas de Docker. Pausa la protección web (Web Shield) temporalmente.
3. **Liberar Puerto 80:** Abre tu **PowerShell Azul de Windows como Administrador** y ejecuta esto para apagar el servicio que estorba:
   ```powershell
   Stop-Service -Name W3SVC -Force
   ```

---

## 🛠️ PASO 1: Descargar el Sistema

Abre tu terminal de Linux (Ubuntu/Fish) y ejecuta:

```bash
# Evita bloqueos de seguridad del antivirus al descargar:
git config --global http.sslVerify false

# Clona el sistema
git clone https://github.com/omaramryplm-sketch/POS_LINUX.git

# Entra y da permisos
cd POS_LINUX
chmod +x *.sh
```

---

## 🤖 PASO 2: El Instalador Automático

Ejecuta el robot que configurará todo por ti (instalará Docker, Fish, herramientas y permisos):

```bash
./preparar_servidor.sh
```

**⚠️ REGLA DE ORO:** Cuando termine el script, **CIERRA TU VENTANA DE UBUNTU POR COMPLETO Y VUELVE A ENTRAR**. Si no lo haces, Linux no aplicará tus permisos de administrador y Docker te dará un error de "Permission Denied".

---

## 🌐 PASO 3: Levantar el Cadenero y Clientes

Vuelve a entrar a la carpeta de tu proyecto (`cd POS_LINUX`) y levanta todo:

```bash
# 1. Enciende el enrutador automático (Solo se hace una vez)
./setup_orquestador.sh

# 2. Crea a tu primer cliente
./crear_cliente.sh
```

¡Listo! Eso es todo. 
- **En VPS:** El cliente responderá en `http://nombre.TU_IP_PUBLICA.nip.io`
- **En Windows:** El cliente responderá en `http://nombre.127.0.0.1.nip.io`

---

## 🛠️ Herramientas de Mantenimiento

* **Para actualizar a todos tus clientes con código nuevo:** `./actualizar_todos.sh` (Asegúrate de pausar tu antivirus en Windows antes de correrlo).
* **Para sacar copia de seguridad de las bases de datos:** `./respaldo_diario.sh`
* **Para borrar todo un cliente de fábrica:** `cd ../POS_cliente && ./factory_reset.sh`

---

## 📁 Explorador de Archivos (Para descargar respaldos)

Tu sistema incluye un explorador web visual (Filebrowser) para que descargues tus copias de seguridad fácilmente desde cualquier navegador.

**Para instalarlo y encenderlo:**
```bash
./levantar_explorador.sh
```
Te pedirá la IP (usa tu IP Pública, o `127.0.0.1` si estás en local).

**¿Cómo obtener la contraseña de acceso?**
Por seguridad militar, Filebrowser genera una contraseña aleatoria y única al instalarse. Para verla, ejecuta este comando en tu terminal:
```bash
docker logs filebrowser
```
Busca en los resultados la línea que dice:
`User 'admin' initialized with randomly generated password: [TU_CONTRASEÑA_AQUÍ]`

Entra a `http://archivos.TU_IP.nip.io` con usuario **admin** y esa contraseña. ¡Luego puedes cambiarla en la sección de Ajustes!
* **Para restaurar un respaldo:** `./restaurar_respaldo.sh` (Te pedirá el nombre del cliente y la ruta del archivo `.tar.gz`).
* **El script ahora te permite cambiar el puerto:** Si en Windows el puerto 80 choca con IIS, el script te preguntará si quieres usar el 8080 (o el que quieras).
* **Control de Errores Anti-Virus:** Si tu antivirus bloquea el sistema, el script se detendrá con un mensaje rojo claro en lugar de decirte que tuvo éxito.
