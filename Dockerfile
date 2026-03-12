# Beef Sync - Dockerfile
# Build na imagem (não no startup) - container sobe rápido

FROM node:20-alpine

WORKDIR /app

# 1. Copiar e instalar dependências
COPY package.json package-lock.json* ./
RUN npm ci

# 2. Copiar código e fazer build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 3. Rodar (sem npm ci/build no startup)
EXPOSE 3020
ENV PORT=3020
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "run", "start:docker"]
