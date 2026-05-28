# CRM Frontend Dockerfile — Next.js production build
#
# Two-stage build for a minimal production image:
# 1. builder — install all deps, compile everything, run Next.js build
# 2. runner  — lightweight production runtime as non-root

# ── Stage 1: Builder ──────────────────────────────────────────
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@11.2.2 --activate

# Copy workspace config and lockfile
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json .npmrc ./

# Copy workspace packages (needed for dependency resolution)
COPY packages ./packages

# Copy frontend app
COPY apps/crm-frontend ./apps/crm-frontend

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Accept API_URL build arg (default to backend:8000 for Docker Compose)
ARG API_URL=http://backend:8000
ENV API_URL=$API_URL

# Build the frontend (Next.js standalone output)
RUN pnpm --filter @app/crm-frontend build

# ── Stage 2: Production Runner ────────────────────────────────
FROM node:22-alpine AS runner
RUN apk add --no-cache wget
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output from builder
COPY --from=builder /app/apps/crm-frontend/.next/standalone ./
COPY --from=builder /app/apps/crm-frontend/.next/static ./apps/crm-frontend/.next/static
COPY --from=builder /app/apps/crm-frontend/public ./apps/crm-frontend/public

# Use non-root user
USER nextjs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "apps/crm-frontend/server.js"]
