# Usar Debian (não Alpine) - canvas compila melhor
FROM node:20-slim

# Python para node-gyp (canvas) + dependências canvas + Puppeteer/Chromium (WhatsApp)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python-is-python3 build-essential pkg-config \
    libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 \
    libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 \
    libx11-xcb1 libxcb1 libxext6 libxi6 libxtst6 libxss1 libxcursor1 \
    ca-certificates fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# node-gyp (canvas) precisa de Python explícito
ENV PYTHON=/usr/bin/python3
ENV npm_config_python=/usr/bin/python3

COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

EXPOSE 3020
ENV PORT=3020
ENV HOSTNAME="0.0.0.0"

CMD ["npx", "next", "start", "-H", "0.0.0.0", "-p", "3020"]
