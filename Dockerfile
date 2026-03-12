# Usar Debian (não Alpine) - canvas compila melhor
FROM node:20-slim

# Dependências para canvas (chartjs-node-canvas)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential python3 pkg-config \
    libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

EXPOSE 3020
ENV PORT=3020
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "run", "start:docker"]
