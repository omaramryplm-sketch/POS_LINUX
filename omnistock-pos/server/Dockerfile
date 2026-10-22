# =======================================================
# Process .......: API OmniStock POS (Express + Prisma + PG)
# Function ......: Punto de Venta / Backend
# Type ..........: Operaciones (Equiv. LANSA Integrator)
# Author ........: OMONROY
# Date ..........: 20261022
# CONTROL DE CAMBIOS:
# 20261022 OMONROY: Node 20 (EOL abr-2026) -> Node 22 LTS.
#   Motivo: aviso de RCE en Node.js y fin de parches de la linea 20.
#   Se usa 22 (no 24) por compatibilidad oficial con Prisma 5.22.
#   Logica de build intacta; solo cambia la imagen base.
# =======================================================
FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache openssl
RUN npm install -g pnpm@9
COPY package.json pnpm-lock.yaml ./
RUN pnpm install
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
