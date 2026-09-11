FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm@9
COPY package.json pnpm-lock.yaml ./
RUN pnpm install
COPY . .
RUN pnpm exec prisma generate
RUN pnpm run build
EXPOSE 4000
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm run start"]
