FROM node:20-alpine
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
