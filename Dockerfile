FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./

# ── Development ────────────────────────────────────────────────────────────────
FROM base AS development
ENV NODE_ENV=development
RUN npm ci
COPY . .
CMD ["node", "--watch", "src/index.js"]

# ── Production ─────────────────────────────────────────────────────────────────
FROM base AS production
ENV NODE_ENV=production
RUN npm ci --omit=dev
COPY . .
CMD ["node", "src/index.js"]
