# ==============================================================================
# Occasion Spaces - Production Multi-Stage Dockerfile
# Optimized for Node.js 20/22 + SQLite (better-sqlite3) on persistent storage
# ==============================================================================

# 1. Base image with build tools for native better-sqlite3 compilation
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat python3 make g++

# 2. Dependencies stage
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 3. Builder stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# 4. Production Runner stage
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache sqlite-libs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create volume mount point for persistent SQLite database
RUN mkdir -p /app/data && chown -R node:node /app

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src

# Set default persistent database path
ENV DATABASE_PATH=/app/data/occasion_spaces.db

USER node

EXPOSE 3000

CMD ["npm", "start"]

