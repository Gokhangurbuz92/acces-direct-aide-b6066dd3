# ============================================================
# Accès Direct Aide — Dockerfile (Phase 4)
# ============================================================
# Multi-stage build for a production-grade, sovereignty-ready image.
#
# Usage:
#   docker build -t ada-api .
#   docker run -p 3000:3000 --env-file .env ada-api
#
# Structure: api/ and packages/ stay at root (Option A monorepo).
# ============================================================

# ── Stage 1: Builder ─────────────────────────────────────────
FROM node:20-alpine AS builder

RUN apk add --no-cache libc6-compat openssl python3 make g++

WORKDIR /app

# Copy full source (relies on .dockerignore to exclude node_modules, dist, src, etc.)
COPY . .

# Install all deps (--legacy-peer-deps for Storybook peer conflict)
RUN npm install --legacy-peer-deps

# Generate Prisma Client targeting linux-musl-openssl-3.0.x (Alpine 3.18+)
ENV PRISMA_ENGINES_MIRROR=https://binaries.prisma.sh
RUN npx prisma generate --schema=prisma/schema.prisma

# Prune dev dependencies for a lighter production image
RUN npm prune --omit=dev --legacy-peer-deps --ignore-scripts 2>/dev/null || true

# ── Stage 2: Runner ──────────────────────────────────────────
FROM node:20-alpine AS runner

# OpenSSL 3 is needed by Prisma query engine on Alpine 3.18+
RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production

# Security: non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copy runtime files from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/api ./api
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/prisma ./prisma

# Switch to non-root user
USER nodejs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://localhost:3000/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Start the standalone HTTP server (wraps Vercel handler)
CMD ["node", "api/server.js"]
