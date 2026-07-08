# ─── Builder Stage ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer caching)
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copy source & compile
COPY . .
RUN npm run build

# ─── Development Stage ───────────────────────────────────────────────────────
FROM node:20-alpine AS development

WORKDIR /app

# Install all deps including devDependencies for tsx/hot-reload
COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5000

CMD ["npm", "run", "dev"]

# ─── Production Stage ────────────────────────────────────────────────────────
# NOTE: Production configuration is intentionally minimal.
# Configure environment secrets, health checks, and orchestration
# separately per deployment environment (k8s, ECS, etc.)
FROM node:20-alpine AS production

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 express

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=builder --chown=express:nodejs /app/dist ./dist

USER express

EXPOSE 5000

CMD ["node", "dist/presentation/http/server.js"]
